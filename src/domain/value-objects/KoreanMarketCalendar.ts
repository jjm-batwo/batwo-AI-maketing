/**
 * 한국 시장 캘린더 값 객체
 *
 * 광고 성과에 영향을 미치는 한국 시장의 특수일 관리:
 * - 공휴일: 설날, 추석, 어린이날, 크리스마스 등
 * - 상업 이벤트: 빼빼로데이, 블랙프라이데이, 광군제 등
 * - 시즌 패턴: 여름휴가, 연말 쇼핑 시즌 등
 *
 * 각 이벤트별 예상 변동폭을 제공하여 이상 감지 정확도 향상
 */

export type EventCategory = 'public_holiday' | 'commercial' | 'seasonal' | 'industry_specific'
export type ImpactType = 'positive' | 'negative' | 'mixed'

export interface MarketEvent {
  name: string
  nameEn: string
  category: EventCategory
  impactType: ImpactType
  /** 예상 성과 변동폭 (%) - 긍정적 이벤트는 양수, 부정적은 음수 */
  expectedSpendChange: { min: number; max: number }
  expectedConversionChange: { min: number; max: number }
  expectedCTRChange: { min: number; max: number }
  /** 이벤트 영향 시작일 (이벤트 당일 기준 며칠 전부터) */
  leadDays: number
  /** 이벤트 영향 종료일 (이벤트 당일 기준 며칠 후까지) */
  trailDays: number
  /** 업종별 영향도 가중치 (1.0 = 표준, >1.0 = 더 큰 영향) */
  industryWeights?: Record<string, number>
  description: string
}

export interface DateEventInfo {
  date: Date
  events: MarketEvent[]
  isSpecialDay: boolean
  /** 해당 날짜의 총 예상 변동폭 (모든 이벤트 합산) */
  combinedExpectedChange: {
    spend: { min: number; max: number }
    conversion: { min: number; max: number }
    ctr: { min: number; max: number }
  }
}

/**
 * 한국 공휴일 (음력 기반은 연도별 계산 필요)
 */
const KOREAN_PUBLIC_HOLIDAYS: Record<string, Omit<MarketEvent, 'category'>> = {
  NEW_YEAR: {
    name: '신정',
    nameEn: 'New Year',
    impactType: 'negative',
    expectedSpendChange: { min: -40, max: -20 },
    expectedConversionChange: { min: -50, max: -30 },
    expectedCTRChange: { min: -20, max: -5 },
    leadDays: 1,
    trailDays: 1,
    description: '연초 휴식으로 광고 성과 하락 예상',
  },
  SEOLLAL: {
    name: '설날',
    nameEn: 'Lunar New Year',
    impactType: 'mixed',
    expectedSpendChange: { min: -30, max: 50 },
    expectedConversionChange: { min: -40, max: 30 },
    expectedCTRChange: { min: -20, max: 10 },
    leadDays: 7,
    trailDays: 3,
    industryWeights: {
      ecommerce: 1.3,
      food_beverage: 1.5,
      fashion: 1.2,
      beauty: 1.1,
    },
    description: '설 선물 시즌으로 특정 업종 성과 상승 가능',
  },
  INDEPENDENCE_DAY: {
    name: '삼일절',
    nameEn: 'Independence Movement Day',
    impactType: 'negative',
    expectedSpendChange: { min: -20, max: -10 },
    expectedConversionChange: { min: -25, max: -10 },
    expectedCTRChange: { min: -15, max: -5 },
    leadDays: 0,
    trailDays: 0,
    description: '공휴일로 일반적인 성과 하락',
  },
  CHILDREN_DAY: {
    name: '어린이날',
    nameEn: "Children's Day",
    impactType: 'positive',
    expectedSpendChange: { min: 10, max: 60 },
    expectedConversionChange: { min: 20, max: 80 },
    expectedCTRChange: { min: 5, max: 25 },
    leadDays: 14,
    trailDays: 1,
    industryWeights: {
      ecommerce: 1.5,
      education: 1.3,
      food_beverage: 1.2,
    },
    description: '어린이날 선물 시즌으로 관련 업종 대폭 상승',
  },
  PARENTS_DAY: {
    name: '어버이날',
    nameEn: "Parents' Day",
    impactType: 'positive',
    expectedSpendChange: { min: 10, max: 40 },
    expectedConversionChange: { min: 15, max: 50 },
    expectedCTRChange: { min: 5, max: 15 },
    leadDays: 7,
    trailDays: 0,
    industryWeights: {
      beauty: 1.4,
      fashion: 1.3,
      food_beverage: 1.2,
    },
    description: '효도 선물 시즌',
  },
  MEMORIAL_DAY: {
    name: '현충일',
    nameEn: 'Memorial Day',
    impactType: 'negative',
    expectedSpendChange: { min: -20, max: -5 },
    expectedConversionChange: { min: -25, max: -10 },
    expectedCTRChange: { min: -10, max: -3 },
    leadDays: 0,
    trailDays: 0,
    description: '추모일로 광고 성과 소폭 하락',
  },
  LIBERATION_DAY: {
    name: '광복절',
    nameEn: 'Liberation Day',
    impactType: 'negative',
    expectedSpendChange: { min: -15, max: -5 },
    expectedConversionChange: { min: -20, max: -5 },
    expectedCTRChange: { min: -10, max: -2 },
    leadDays: 0,
    trailDays: 0,
    description: '공휴일로 일반적인 성과 하락',
  },
  CHUSEOK: {
    name: '추석',
    nameEn: 'Chuseok',
    impactType: 'mixed',
    expectedSpendChange: { min: -20, max: 70 },
    expectedConversionChange: { min: -30, max: 60 },
    expectedCTRChange: { min: -15, max: 20 },
    leadDays: 14,
    trailDays: 3,
    industryWeights: {
      ecommerce: 1.4,
      food_beverage: 1.6,
      fashion: 1.2,
      beauty: 1.3,
    },
    description: '추석 선물 시즌으로 특정 업종 대폭 상승 가능',
  },
  NATIONAL_FOUNDATION_DAY: {
    name: '개천절',
    nameEn: 'National Foundation Day',
    impactType: 'negative',
    expectedSpendChange: { min: -15, max: -5 },
    expectedConversionChange: { min: -20, max: -5 },
    expectedCTRChange: { min: -10, max: -2 },
    leadDays: 0,
    trailDays: 0,
    description: '공휴일로 일반적인 성과 하락',
  },
  HANGUL_DAY: {
    name: '한글날',
    nameEn: 'Hangul Day',
    impactType: 'negative',
    expectedSpendChange: { min: -15, max: -5 },
    expectedConversionChange: { min: -20, max: -5 },
    expectedCTRChange: { min: -10, max: -2 },
    leadDays: 0,
    trailDays: 0,
    description: '공휴일로 일반적인 성과 하락',
  },
  CHRISTMAS: {
    name: '크리스마스',
    nameEn: 'Christmas',
    impactType: 'positive',
    expectedSpendChange: { min: 20, max: 100 },
    expectedConversionChange: { min: 30, max: 120 },
    expectedCTRChange: { min: 10, max: 30 },
    leadDays: 21,
    trailDays: 1,
    industryWeights: {
      ecommerce: 1.5,
      fashion: 1.4,
      beauty: 1.3,
      food_beverage: 1.2,
    },
    description: '연말 쇼핑 시즌 최대 성수기',
  },
}

/**
 * 상업 이벤트
 */
const COMMERCIAL_EVENTS: Record<string, Omit<MarketEvent, 'category'>> = {
  VALENTINES_DAY: {
    name: '발렌타인데이',
    nameEn: "Valentine's Day",
    impactType: 'positive',
    expectedSpendChange: { min: 15, max: 50 },
    expectedConversionChange: { min: 20, max: 60 },
    expectedCTRChange: { min: 5, max: 20 },
    leadDays: 7,
    trailDays: 0,
    industryWeights: {
      beauty: 1.4,
      fashion: 1.3,
      food_beverage: 1.5,
    },
    description: '연인 선물 시즌',
  },
  WHITE_DAY: {
    name: '화이트데이',
    nameEn: 'White Day',
    impactType: 'positive',
    expectedSpendChange: { min: 15, max: 45 },
    expectedConversionChange: { min: 20, max: 55 },
    expectedCTRChange: { min: 5, max: 18 },
    leadDays: 7,
    trailDays: 0,
    industryWeights: {
      beauty: 1.3,
      fashion: 1.2,
      food_beverage: 1.4,
    },
    description: '화이트데이 선물 시즌',
  },
  PEPERO_DAY: {
    name: '빼빼로데이',
    nameEn: 'Pepero Day',
    impactType: 'positive',
    expectedSpendChange: { min: 10, max: 35 },
    expectedConversionChange: { min: 15, max: 45 },
    expectedCTRChange: { min: 5, max: 15 },
    leadDays: 5,
    trailDays: 0,
    industryWeights: {
      food_beverage: 1.8,
      ecommerce: 1.2,
    },
    description: '빼빼로데이 특수',
  },
  BLACK_FRIDAY: {
    name: '블랙프라이데이',
    nameEn: 'Black Friday',
    impactType: 'positive',
    expectedSpendChange: { min: 30, max: 100 },
    expectedConversionChange: { min: 40, max: 150 },
    expectedCTRChange: { min: 15, max: 40 },
    leadDays: 3,
    trailDays: 3,
    industryWeights: {
      ecommerce: 1.6,
      fashion: 1.5,
      beauty: 1.3,
    },
    description: '블랙프라이데이 쇼핑 시즌',
  },
  CYBER_MONDAY: {
    name: '사이버먼데이',
    nameEn: 'Cyber Monday',
    impactType: 'positive',
    expectedSpendChange: { min: 25, max: 80 },
    expectedConversionChange: { min: 35, max: 120 },
    expectedCTRChange: { min: 12, max: 35 },
    leadDays: 0,
    trailDays: 1,
    industryWeights: {
      ecommerce: 1.7,
      saas: 1.3,
    },
    description: '사이버먼데이 온라인 쇼핑 특수',
  },
  SINGLES_DAY: {
    name: '광군제',
    nameEn: "Singles' Day (11.11)",
    impactType: 'positive',
    expectedSpendChange: { min: 20, max: 70 },
    expectedConversionChange: { min: 30, max: 100 },
    expectedCTRChange: { min: 10, max: 30 },
    leadDays: 3,
    trailDays: 1,
    industryWeights: {
      ecommerce: 1.5,
      fashion: 1.3,
      beauty: 1.4,
    },
    description: '광군제(11.11) 쇼핑 이벤트',
  },
  TEACHERS_DAY: {
    name: '스승의 날',
    nameEn: "Teachers' Day",
    impactType: 'positive',
    expectedSpendChange: { min: 5, max: 25 },
    expectedConversionChange: { min: 10, max: 35 },
    expectedCTRChange: { min: 3, max: 12 },
    leadDays: 5,
    trailDays: 0,
    industryWeights: {
      education: 1.5,
      beauty: 1.2,
      food_beverage: 1.2,
    },
    description: '스승의 날 선물 시즌',
  },
}

/**
 * 시즌 패턴
 */
const SEASONAL_PATTERNS: Record<string, Omit<MarketEvent, 'category'>> = {
  NEW_YEAR_SHOPPING: {
    name: '연말 쇼핑 시즌',
    nameEn: 'Year-end Shopping Season',
    impactType: 'positive',
    expectedSpendChange: { min: 20, max: 80 },
    expectedConversionChange: { min: 25, max: 100 },
    expectedCTRChange: { min: 10, max: 25 },
    leadDays: 0,
    trailDays: 0,
    industryWeights: {
      ecommerce: 1.4,
      fashion: 1.3,
      beauty: 1.2,
    },
    description: '12월 연말 쇼핑 시즌',
  },
  SUMMER_VACATION: {
    name: '여름휴가 시즌',
    nameEn: 'Summer Vacation Season',
    impactType: 'mixed',
    expectedSpendChange: { min: -20, max: 40 },
    expectedConversionChange: { min: -25, max: 50 },
    expectedCTRChange: { min: -10, max: 15 },
    leadDays: 0,
    trailDays: 0,
    industryWeights: {
      fashion: 1.3,
      beauty: 1.2,
      food_beverage: 1.1,
    },
    description: '7-8월 여름휴가 시즌',
  },
  BACK_TO_SCHOOL: {
    name: '신학기 시즌',
    nameEn: 'Back to School Season',
    impactType: 'positive',
    expectedSpendChange: { min: 10, max: 40 },
    expectedConversionChange: { min: 15, max: 50 },
    expectedCTRChange: { min: 5, max: 15 },
    leadDays: 0,
    trailDays: 0,
    industryWeights: {
      education: 1.6,
      fashion: 1.3,
      ecommerce: 1.2,
    },
    description: '2-3월 신학기 시즌',
  },
  YEAR_END_TAX: {
    name: '연말정산 시즌',
    nameEn: 'Year-end Tax Season',
    impactType: 'positive',
    expectedSpendChange: { min: 5, max: 30 },
    expectedConversionChange: { min: 10, max: 40 },
    expectedCTRChange: { min: 3, max: 12 },
    leadDays: 0,
    trailDays: 0,
    industryWeights: {
      saas: 1.4,
      education: 1.3,
    },
    description: '1월 연말정산 시즌',
  },
}

/**
 * 음력 날짜를 양력으로 변환하는 근사치 계산
 * 실제 운영에서는 정확한 음력-양력 변환 라이브러리 사용 권장
 */
function getLunarNewYear(year: number): Date {
  // 설날 근사치 (1월 21일 ~ 2월 20일 사이)
  const lunarNewYears: Record<number, string> = {
    2024: '2024-02-10',
    2025: '2025-01-29',
    2026: '2026-02-17',
    2027: '2027-02-06',
    2028: '2028-01-26',
    2029: '2029-02-13',
    2030: '2030-02-03',
  }
  return new Date(lunarNewYears[year] || `${year}-02-01`)
}

function getChuseok(year: number): Date {
  // 추석 근사치 (9월 8일 ~ 10월 7일 사이)
  const chuseokDates: Record<number, string> = {
    2024: '2024-09-17',
    2025: '2025-10-06',
    2026: '2026-09-25',
    2027: '2027-09-15',
    2028: '2028-10-03',
    2029: '2029-09-22',
    2030: '2030-09-12',
  }
  return new Date(chuseokDates[year] || `${year}-09-20`)
}

/**
 * 특정 연도의 고정 공휴일 날짜 반환
 */
function getFixedHolidayDates(year: number): Map<string, string> {
  return new Map([
    ['NEW_YEAR', `${year}-01-01`],
    ['INDEPENDENCE_DAY', `${year}-03-01`],
    ['CHILDREN_DAY', `${year}-05-05`],
    ['PARENTS_DAY', `${year}-05-08`],
    ['MEMORIAL_DAY', `${year}-06-06`],
    ['LIBERATION_DAY', `${year}-08-15`],
    ['NATIONAL_FOUNDATION_DAY', `${year}-10-03`],
    ['HANGUL_DAY', `${year}-10-09`],
    ['CHRISTMAS', `${year}-12-25`],
  ])
}

/**
 * 상업 이벤트 날짜 반환
 */
function getCommercialEventDates(year: number): Map<string, string> {
  // 블랙프라이데이: 11월 4번째 목요일(추수감사절) 다음 날 금요일
  const novFirst = new Date(year, 10, 1)
  const dayOfWeek = novFirst.getDay()
  // 첫 번째 목요일 찾기 (목요일 = 4)
  const firstThursday = 1 + ((4 - dayOfWeek + 7) % 7)
  // 4번째 목요일 = 첫 번째 목요일 + 21일
  const thanksgiving = firstThursday + 21
  // 블랙프라이데이 = 추수감사절 + 1일
  const blackFriday = new Date(year, 10, thanksgiving + 1)

  // 사이버먼데이: 블랙프라이데이 다음 월요일
  const cyberMonday = new Date(blackFriday)
  cyberMonday.setDate(cyberMonday.getDate() + 3)

  return new Map([
    ['VALENTINES_DAY', `${year}-02-14`],
    ['WHITE_DAY', `${year}-03-14`],
    ['TEACHERS_DAY', `${year}-05-15`],
    ['PEPERO_DAY', `${year}-11-11`],
    ['SINGLES_DAY', `${year}-11-11`],
    ['BLACK_FRIDAY', blackFriday.toISOString().split('T')[0]],
    ['CYBER_MONDAY', cyberMonday.toISOString().split('T')[0]],
  ])
}

/**
 * 한국 시장 캘린더 클래스
 */
export class KoreanMarketCalendar {
  private readonly year: number
  private readonly holidayDates: Map<string, Date>
  private readonly commercialDates: Map<string, Date>
  private readonly lunarHolidays: Map<string, Date>

  constructor(year: number = new Date().getFullYear()) {
    this.year = year
    this.holidayDates = new Map()
    this.commercialDates = new Map()
    this.lunarHolidays = new Map()

    this.initializeDates()
  }

  private initializeDates(): void {
    // 고정 공휴일
    const fixedDates = getFixedHolidayDates(this.year)
    for (const [key, dateStr] of fixedDates) {
      this.holidayDates.set(key, new Date(dateStr))
    }

    // 음력 기반 공휴일
    this.lunarHolidays.set('SEOLLAL', getLunarNewYear(this.year))
    this.lunarHolidays.set('CHUSEOK', getChuseok(this.year))

    // 상업 이벤트
    const commercialDates = getCommercialEventDates(this.year)
    for (const [key, dateStr] of commercialDates) {
      this.commercialDates.set(key, new Date(dateStr))
    }
  }

  /**
   * 특정 날짜의 이벤트 정보 조회
   */
  getDateEventInfo(date: Date, industry?: string): DateEventInfo {
    const events: MarketEvent[] = []

    // 공휴일 확인
    for (const [key, holidayDate] of this.holidayDates) {
      const event = this.createMarketEvent(key, 'public_holiday', KOREAN_PUBLIC_HOLIDAYS[key])
      if (this.isDateInEventRange(date, holidayDate, event)) {
        events.push(event)
      }
    }

    // 음력 공휴일 확인
    for (const [key, holidayDate] of this.lunarHolidays) {
      const event = this.createMarketEvent(key, 'public_holiday', KOREAN_PUBLIC_HOLIDAYS[key])
      if (this.isDateInEventRange(date, holidayDate, event)) {
        events.push(event)
      }
    }

    // 상업 이벤트 확인
    for (const [key, eventDate] of this.commercialDates) {
      const eventConfig = COMMERCIAL_EVENTS[key]
      if (eventConfig) {
        const event = this.createMarketEvent(key, 'commercial', eventConfig)
        if (this.isDateInEventRange(date, eventDate, event)) {
          events.push(event)
        }
      }
    }

    // 시즌 패턴 확인
    const seasonalEvents = this.getSeasonalEvents(date)
    events.push(...seasonalEvents)

    // 업종별 가중치 적용
    const adjustedEvents = industry
      ? events.map((e) => this.applyIndustryWeight(e, industry))
      : events

    return {
      date,
      events: adjustedEvents,
      isSpecialDay: adjustedEvents.length > 0,
      combinedExpectedChange: this.calculateCombinedChange(adjustedEvents),
    }
  }

  /**
   * 특정 날짜가 이벤트 영향 범위 내인지 확인
   */
  private isDateInEventRange(targetDate: Date, eventDate: Date, event: MarketEvent): boolean {
    const targetTime = this.normalizeDate(targetDate).getTime()
    const eventTime = this.normalizeDate(eventDate).getTime()
    const msPerDay = 24 * 60 * 60 * 1000

    const startTime = eventTime - event.leadDays * msPerDay
    const endTime = eventTime + event.trailDays * msPerDay

    return targetTime >= startTime && targetTime <= endTime
  }

  /**
   * 날짜를 자정으로 정규화
   */
  private normalizeDate(date: Date): Date {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  /**
   * MarketEvent 객체 생성
   */
  private createMarketEvent(
    _key: string,
    category: EventCategory,
    config: Omit<MarketEvent, 'category'>
  ): MarketEvent {
    return {
      ...config,
      category,
    }
  }

  /**
   * 시즌 패턴 이벤트 반환
   */
  private getSeasonalEvents(date: Date): MarketEvent[] {
    const events: MarketEvent[] = []
    const month = date.getMonth() + 1

    // 연말 쇼핑 시즌 (12월)
    if (month === 12) {
      events.push(this.createMarketEvent('NEW_YEAR_SHOPPING', 'seasonal', SEASONAL_PATTERNS.NEW_YEAR_SHOPPING))
    }

    // 여름휴가 시즌 (7-8월)
    if (month === 7 || month === 8) {
      events.push(this.createMarketEvent('SUMMER_VACATION', 'seasonal', SEASONAL_PATTERNS.SUMMER_VACATION))
    }

    // 신학기 시즌 (2-3월)
    if (month === 2 || month === 3) {
      events.push(this.createMarketEvent('BACK_TO_SCHOOL', 'seasonal', SEASONAL_PATTERNS.BACK_TO_SCHOOL))
    }

    // 연말정산 시즌 (1월)
    if (month === 1) {
      events.push(this.createMarketEvent('YEAR_END_TAX', 'seasonal', SEASONAL_PATTERNS.YEAR_END_TAX))
    }

    return events
  }

  /**
   * 업종별 가중치 적용
   */
  private applyIndustryWeight(event: MarketEvent, industry: string): MarketEvent {
    const weight = event.industryWeights?.[industry] ?? 1.0

    return {
      ...event,
      expectedSpendChange: {
        min: Math.round(event.expectedSpendChange.min * weight),
        max: Math.round(event.expectedSpendChange.max * weight),
      },
      expectedConversionChange: {
        min: Math.round(event.expectedConversionChange.min * weight),
        max: Math.round(event.expectedConversionChange.max * weight),
      },
      expectedCTRChange: {
        min: Math.round(event.expectedCTRChange.min * weight),
        max: Math.round(event.expectedCTRChange.max * weight),
      },
    }
  }

  /**
   * 여러 이벤트의 예상 변동폭 합산
   */
  private calculateCombinedChange(events: MarketEvent[]): DateEventInfo['combinedExpectedChange'] {
    if (events.length === 0) {
      return {
        spend: { min: 0, max: 0 },
        conversion: { min: 0, max: 0 },
        ctr: { min: 0, max: 0 },
      }
    }

    // 가장 큰 영향을 주는 이벤트 기준으로 계산 (합산이 아닌 max 적용)
    return events.reduce(
      (acc, event) => ({
        spend: {
          min: Math.min(acc.spend.min, event.expectedSpendChange.min),
          max: Math.max(acc.spend.max, event.expectedSpendChange.max),
        },
        conversion: {
          min: Math.min(acc.conversion.min, event.expectedConversionChange.min),
          max: Math.max(acc.conversion.max, event.expectedConversionChange.max),
        },
        ctr: {
          min: Math.min(acc.ctr.min, event.expectedCTRChange.min),
          max: Math.max(acc.ctr.max, event.expectedCTRChange.max),
        },
      }),
      {
        spend: { min: Infinity, max: -Infinity },
        conversion: { min: Infinity, max: -Infinity },
        ctr: { min: Infinity, max: -Infinity },
      }
    )
  }

  /**
   * 특정 날짜가 특수일인지 확인
   */
  isSpecialDay(date: Date, industry?: string): boolean {
    return this.getDateEventInfo(date, industry).isSpecialDay
  }

  /**
   * 특정 기간의 특수일 목록 반환
   */
  getSpecialDaysInRange(startDate: Date, endDate: Date, industry?: string): DateEventInfo[] {
    const specialDays: DateEventInfo[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      const eventInfo = this.getDateEventInfo(current, industry)
      if (eventInfo.isSpecialDay) {
        specialDays.push(eventInfo)
      }
      current.setDate(current.getDate() + 1)
    }

    return specialDays
  }

  /**
   * 특정 변동폭이 해당 날짜의 예상 범위 내인지 확인
   */
  isChangeWithinExpectedRange(
    date: Date,
    metric: 'spend' | 'conversion' | 'ctr',
    changePercent: number,
    industry?: string
  ): boolean {
    const eventInfo = this.getDateEventInfo(date, industry)

    if (!eventInfo.isSpecialDay) {
      return false // 특수일이 아니면 예상 범위 없음
    }

    const range = eventInfo.combinedExpectedChange[metric]
    return changePercent >= range.min && changePercent <= range.max
  }

  /**
   * 특수일 감안한 조정된 임계값 반환
   */
  getAdjustedThreshold(
    date: Date,
    baseThreshold: number,
    metric: 'spend' | 'conversion' | 'ctr',
    isPositive: boolean,
    industry?: string
  ): number {
    const eventInfo = this.getDateEventInfo(date, industry)

    if (!eventInfo.isSpecialDay) {
      return baseThreshold
    }

    const range = eventInfo.combinedExpectedChange[metric]
    const adjustment = isPositive ? range.max : Math.abs(range.min)

    return baseThreshold + adjustment
  }
}

// 싱글톤 인스턴스 (현재 연도)
let calendarInstance: KoreanMarketCalendar | null = null

export function getKoreanMarketCalendar(year?: number): KoreanMarketCalendar {
  const targetYear = year ?? new Date().getFullYear()

  if (!calendarInstance || calendarInstance['year'] !== targetYear) {
    calendarInstance = new KoreanMarketCalendar(targetYear)
  }

  return calendarInstance
}
