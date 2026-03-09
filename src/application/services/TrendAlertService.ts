/**
 * 트렌드 알림 서비스
 *
 * 다가오는 마케팅 시즌/이벤트 알림 및 준비사항 제공
 */

import { getUpcomingEvents, type MarketingEvent } from '@/lib/constants/koreanMarketingCalendar'

export interface UpcomingEvent {
  name: string
  date: string
  daysUntil: number
  impact: string
  relevantIndustries: string[]
  preparationChecklist: string[]
  budgetRecommendation: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  isPrepPhase: boolean // 현재 준비 기간인지
}

export interface TrendAlert {
  events: UpcomingEvent[]
  weeklyDigest: {
    summary: string
    topOpportunity: string
    actionItems: string[]
    urgentCount: number
  }
}

export class TrendAlertService {
  /**
   * 다가오는 이벤트 조회
   * @param lookaheadDays - 조회 기간 (일)
   * @param industry - 업종 필터 (선택)
   */
  getUpcomingEvents(lookaheadDays: number, industry?: string): UpcomingEvent[] {
    const events = getUpcomingEvents(lookaheadDays, industry)

    return events.map((event) => {
      const daysUntil = this.calculateDaysUntil(event.date)
      const isPrepPhase = daysUntil <= event.optimalPrepDays

      return {
        name: event.name,
        date: event.date.toISOString().split('T')[0],
        daysUntil,
        impact: event.impact,
        relevantIndustries: event.relevantIndustries,
        preparationChecklist: event.preparationChecklist,
        budgetRecommendation: event.budgetRecommendation,
        urgency: this.calculateUrgency(daysUntil, event.optimalPrepDays),
        isPrepPhase,
      }
    })
  }

  /**
   * 업종별 준비사항 체크리스트 생성
   */
  generatePreparationChecklist(event: MarketingEvent, industry: string): string[] {
    // 기본 체크리스트
    const baseChecklist = [...event.preparationChecklist]

    // 업종별 추가 항목
    const industrySpecific = this.getIndustrySpecificTasks(event, industry)

    return [...baseChecklist, ...industrySpecific]
  }

  /**
   * 주간 기회 요약 생성
   * @param userId - 사용자 ID (향후 사용자별 커스터마이징)
   * @param industry - 업종
   */
  getWeeklyOpportunityDigest(userId: string, industry: string): TrendAlert {
    const upcomingEvents = this.getUpcomingEvents(14, industry)
    const urgentEvents = upcomingEvents.filter(
      (e) => e.urgency === 'critical' || e.urgency === 'high'
    )

    // 최고 기회 선정 (가장 가까우면서 impact가 큰 이벤트)
    const topOpportunity = this.selectTopOpportunity(upcomingEvents)

    // 액션 아이템 생성
    const actionItems = this.generateWeeklyActionItems(upcomingEvents)

    return {
      events: upcomingEvents,
      weeklyDigest: {
        summary: this.generateWeeklySummary(upcomingEvents, industry),
        topOpportunity: topOpportunity
          ? `${topOpportunity.name} (${topOpportunity.daysUntil}일 후)`
          : '이번 주 특별 이벤트 없음',
        actionItems,
        urgentCount: urgentEvents.length,
      },
    }
  }

  /**
   * 날짜까지 남은 일수 계산
   */
  private calculateDaysUntil(targetDate: Date): number {
    const now = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * 긴급도 계산
   */
  private calculateUrgency(
    daysUntil: number,
    optimalPrepDays: number
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (daysUntil <= 3) return 'critical'
    if (daysUntil <= 7) return 'high'
    if (daysUntil <= optimalPrepDays) return 'medium'
    return 'low'
  }

  /**
   * 업종별 추가 작업 생성
   */
  private getIndustrySpecificTasks(event: MarketingEvent, industry: string): string[] {
    const tasks: Record<string, Record<string, string[]>> = {
      ecommerce: {
        default: ['재고 확보 및 물류 준비', '쿠폰/프로모션 코드 발급', '모바일 결제 최적화 확인'],
      },
      fashion: {
        default: ['시즌 룩북 촬영', '인플루언서 협업 콘텐츠', '사이즈별 재고 분석'],
      },
      beauty: {
        default: ['신상품 샘플링 이벤트', '뷰티 크리에이터 협업', '성분/효과 콘텐츠 제작'],
      },
      food_beverage: {
        default: ['유통기한 관리', '온도/포장 배송 테스트', '식품안전 인증 확인'],
      },
      health: {
        default: ['건강기능식품 인증 표시', '복용법 안내 콘텐츠', '정기배송 프로모션'],
      },
      education: {
        default: ['무료 체험 이벤트', '수강 후기 콘텐츠', '커리큘럼 소개 영상'],
      },
      service: {
        default: ['예약 시스템 점검', '서비스 FAQ 업데이트', '고객 응대 스크립트 준비'],
      },
      saas: {
        default: ['무료 체험 기간 연장', '온보딩 튜토리얼 점검', '케이스 스터디 준비'],
      },
    }

    return tasks[industry]?.default || tasks.ecommerce.default
  }

  /**
   * 최고 기회 선정
   */
  private selectTopOpportunity(events: UpcomingEvent[]): UpcomingEvent | null {
    if (events.length === 0) return null

    // 긴급도 우선, 그 다음 날짜 가까운 순
    const sorted = [...events].sort((a, b) => {
      const urgencyWeight = { critical: 4, high: 3, medium: 2, low: 1 }
      const urgencyDiff = urgencyWeight[b.urgency] - urgencyWeight[a.urgency]
      if (urgencyDiff !== 0) return urgencyDiff
      return a.daysUntil - b.daysUntil
    })

    return sorted[0]
  }

  /**
   * 주간 요약 생성
   */
  private generateWeeklySummary(events: UpcomingEvent[], industry: string): string {
    if (events.length === 0) {
      return `향후 2주간 ${this.getIndustryNameKo(industry)} 업종에 특별한 마케팅 이벤트가 없습니다. 일상적인 캠페인 최적화에 집중하세요.`
    }

    const urgentCount = events.filter(
      (e) => e.urgency === 'critical' || e.urgency === 'high'
    ).length
    const eventNames = events.slice(0, 3).map((e) => e.name)

    if (urgentCount > 0) {
      return `⚠️ ${urgentCount}개의 긴급 이벤트가 다가오고 있습니다. ${eventNames.join(', ')} 준비가 필요합니다. 지금 바로 캠페인 기획을 시작하세요.`
    }

    return `향후 2주간 ${eventNames.join(', ')} 등 ${events.length}개 이벤트가 예정되어 있습니다. 계획적인 준비로 매출 기회를 잡으세요.`
  }

  /**
   * 주간 액션 아이템 생성
   */
  private generateWeeklyActionItems(events: UpcomingEvent[]): string[] {
    const items: string[] = []

    // 긴급 이벤트
    const criticalEvents = events.filter((e) => e.urgency === 'critical')
    if (criticalEvents.length > 0) {
      items.push(
        `🔥 긴급: ${criticalEvents[0].name} 캠페인 즉시 시작 (${criticalEvents[0].daysUntil}일 남음)`
      )
    }

    // 준비 기간 이벤트
    const prepEvents = events.filter((e) => e.isPrepPhase && e.urgency !== 'critical')
    if (prepEvents.length > 0) {
      items.push(`📋 ${prepEvents[0].name} 준비 시작: ${prepEvents[0].preparationChecklist[0]}`)
    }

    // 예산 계획
    const highImpactEvents = events.filter((e) => e.budgetRecommendation.includes('30%'))
    if (highImpactEvents.length > 0) {
      items.push(
        `💰 ${highImpactEvents[0].name} 예산 확보: ${highImpactEvents[0].budgetRecommendation}`
      )
    }

    // 일반 알림
    if (items.length === 0 && events.length > 0) {
      items.push(`📅 ${events[0].name} 캠페인 사전 기획 시작`)
      items.push(`🎯 타겟 오디언스 분석 및 광고 소재 준비`)
    }

    return items.slice(0, 5) // 최대 5개
  }

  /**
   * 업종명 한국어 변환
   */
  private getIndustryNameKo(industry: string): string {
    const names: Record<string, string> = {
      ecommerce: '이커머스',
      food_beverage: '식품/음료',
      beauty: '뷰티/화장품',
      fashion: '패션/의류',
      education: '교육',
      service: '서비스',
      saas: 'SaaS/B2B',
      health: '건강/웰니스',
    }
    return names[industry] || industry
  }
}
