/**
 * TrackingScriptService
 *
 * Meta Pixel 추적 스크립트 생성 및 이벤트 파싱 서비스
 * 카페24 등 쇼핑몰 플랫폼에 주입할 JavaScript 코드를 생성합니다.
 */

export interface TrackingScriptConfig {
  appBaseUrl: string
}

export interface ScriptSnippet {
  script: string
  noscript: string
  pixelId: string
  instructions: string
}

export interface ParsedEventPayload {
  eventName: string
  eventId: string
  eventTime: Date
  eventSourceUrl?: string
  userData?: Record<string, string>
  customData?: Record<string, unknown>
}

// Meta Pixel 표준 이벤트 목록
const STANDARD_EVENTS = [
  'PageView',
  'ViewContent',
  'Search',
  'AddToCart',
  'AddToWishlist',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Lead',
  'CompleteRegistration',
  'Contact',
  'CustomizeProduct',
  'Donate',
  'FindLocation',
  'Schedule',
  'StartTrial',
  'SubmitApplication',
  'Subscribe',
] as const

export class TrackingScriptService {
  private readonly appBaseUrl: string

  constructor(config: TrackingScriptConfig) {
    this.appBaseUrl = config.appBaseUrl
  }

  /**
   * Pixel ID 유효성 검증
   * Meta Pixel ID는 15-16자리 숫자
   */
  validatePixelId(pixelId: string): boolean {
    if (!pixelId || typeof pixelId !== 'string') {
      return false
    }
    // Meta Pixel ID는 15-16자리 숫자
    return /^\d{15,16}$/.test(pixelId)
  }

  /**
   * 이벤트 이름 유효성 검증
   */
  isValidEventName(eventName: string): boolean {
    if (!eventName || typeof eventName !== 'string') {
      return false
    }
    // 표준 이벤트 또는 커스텀 이벤트 (알파벳/숫자/언더스코어)
    return eventName.length > 0
  }

  /**
   * 지원하는 표준 이벤트 목록 반환
   */
  getSupportedEvents(): readonly string[] {
    return STANDARD_EVENTS
  }

  /**
   * Meta Pixel SDK 초기화 스크립트 생성
   */
  generatePixelScript(pixelId: string): string {
    if (!this.validatePixelId(pixelId)) {
      throw new Error('Invalid pixel ID format. Pixel ID must be 15-16 digits.')
    }

    const eventEndpoint = `${this.appBaseUrl}/api/pixel/${pixelId}/event`

    return `
<!-- Meta Pixel Code -->
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');

/* Batwo Enhanced Tracking */
window.batwoPixel = {
  pixelId: '${pixelId}',
  eventEndpoint: '${eventEndpoint}',

  trackEvent: function(eventName, params) {
    params = params || {};
    var eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // 클라이언트 픽셀 이벤트
    fbq('track', eventName, params, {eventID: eventId});

    // 서버 CAPI용 전송 (중복 제거 지원)
    var payload = JSON.stringify({
      event: eventName,
      eventId: eventId,
      timestamp: Date.now(),
      params: params,
      url: window.location.href
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.eventEndpoint, payload);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', this.eventEndpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    }
  },

  trackPurchase: function(value, currency, contentIds, contentType) {
    this.trackEvent('Purchase', {
      value: value,
      currency: currency || 'KRW',
      content_ids: contentIds || [],
      content_type: contentType || 'product'
    });
  },

  trackAddToCart: function(value, currency, contentId, contentName) {
    this.trackEvent('AddToCart', {
      value: value,
      currency: currency || 'KRW',
      content_ids: contentId ? [contentId] : [],
      content_name: contentName || ''
    });
  },

  trackInitiateCheckout: function(value, currency, numItems) {
    this.trackEvent('InitiateCheckout', {
      value: value,
      currency: currency || 'KRW',
      num_items: numItems || 1
    });
  },

  trackLead: function(value, currency) {
    this.trackEvent('Lead', {
      value: value || 0,
      currency: currency || 'KRW'
    });
  }
};
<!-- End Meta Pixel Code -->
`.trim()
  }

  /**
   * noscript 폴백 태그 생성
   */
  generateNoscriptTag(pixelId: string): string {
    if (!this.validatePixelId(pixelId)) {
      throw new Error('Invalid pixel ID format. Pixel ID must be 15-16 digits.')
    }

    return `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/></noscript>`
  }

  /**
   * 전체 스크립트 스니펫 생성 (스크립트 + noscript + 설치 안내)
   */
  generateScriptSnippet(pixelId: string): ScriptSnippet {
    const script = this.generatePixelScript(pixelId)
    const noscript = this.generateNoscriptTag(pixelId)

    return {
      script,
      noscript,
      pixelId,
      instructions: `
설치 방법:
1. 아래 스크립트 코드를 복사하세요.
2. 웹사이트의 <head> 태그 안에 붙여넣기 하세요.
3. noscript 코드는 <body> 태그 바로 아래에 붙여넣기 하세요.

주의사항:
- 모든 페이지에 동일한 코드가 설치되어야 합니다.
- 카페24의 경우 '디자인 관리 > HTML 편집'에서 설치할 수 있습니다.
`.trim(),
    }
  }

  /**
   * 클라이언트에서 전송된 이벤트 페이로드 파싱
   */
  parseEventPayload(payload: string): ParsedEventPayload {
    if (!payload || typeof payload !== 'string') {
      throw new Error('Invalid event payload: payload must be a non-empty string')
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(payload)
    } catch {
      throw new Error('Invalid event payload: failed to parse JSON')
    }

    // 필수 필드 검증
    if (!parsed.event || typeof parsed.event !== 'string') {
      throw new Error('Invalid event payload: missing required field "event"')
    }

    if (!parsed.eventId || typeof parsed.eventId !== 'string') {
      throw new Error('Invalid event payload: missing required field "eventId"')
    }

    // 이벤트 시간 파싱
    const eventTime = parsed.timestamp
      ? new Date(parsed.timestamp as number)
      : new Date()

    return {
      eventName: parsed.event as string,
      eventId: parsed.eventId as string,
      eventTime,
      eventSourceUrl: (parsed.url as string) || undefined,
      userData: (parsed.userData as Record<string, string>) || undefined,
      customData: (parsed.params as Record<string, unknown>) || undefined,
    }
  }

  /**
   * JavaScript 응답을 위한 Content-Type 반환
   */
  getScriptContentType(): string {
    return 'application/javascript; charset=utf-8'
  }

  /**
   * 캐시 헤더 반환
   */
  getCacheHeaders(): Record<string, string> {
    return {
      'Content-Type': this.getScriptContentType(),
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    }
  }
}
