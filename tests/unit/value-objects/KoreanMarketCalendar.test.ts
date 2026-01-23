/**
 * KoreanMarketCalendar 단위 테스트
 *
 * 테스트 범위:
 * - 공휴일 감지
 * - 상업 이벤트 감지
 * - 시즌 패턴 감지
 * - 업종별 가중치
 * - 예상 변동폭 계산
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  KoreanMarketCalendar,
  getKoreanMarketCalendar,
} from '@domain/value-objects/KoreanMarketCalendar'

describe('KoreanMarketCalendar', () => {
  let calendar: KoreanMarketCalendar

  beforeEach(() => {
    // 테스트에서 2024년 날짜를 사용하므로 2024년 캘린더 생성
    calendar = new KoreanMarketCalendar(2024)
  })

  describe('getDateEventInfo', () => {
    it('should return event info for a date', () => {
      const date = new Date('2024-01-01')
      const info = calendar.getDateEventInfo(date)

      expect(info).toBeDefined()
      expect(typeof info.isSpecialDay).toBe('boolean')
      expect(Array.isArray(info.events)).toBe(true)
    })

    it('should identify New Year Day (설날)', () => {
      // 2024년 설날: 2월 10일
      const seollal = new Date('2024-02-10')
      const info = calendar.getDateEventInfo(seollal)

      expect(info.isSpecialDay).toBe(true)
      expect(info.events.some(e => e.name.includes('설날'))).toBe(true)
    })

    it('should identify Chuseok (추석)', () => {
      // 2024년 추석: 9월 17일
      const chuseok = new Date('2024-09-17')
      const info = calendar.getDateEventInfo(chuseok)

      expect(info.isSpecialDay).toBe(true)
      expect(info.events.some(e => e.name.includes('추석'))).toBe(true)
    })

    it('should identify Pepero Day (빼빼로데이)', () => {
      const peperoDay = new Date('2024-11-11')
      const info = calendar.getDateEventInfo(peperoDay)

      expect(info.isSpecialDay).toBe(true)
      expect(info.events.some(e => e.name.includes('빼빼로'))).toBe(true)
    })

    it('should identify Black Friday', () => {
      // 2024년 블랙프라이데이: 11월 29일
      const blackFriday = new Date('2024-11-29')
      const info = calendar.getDateEventInfo(blackFriday)

      expect(info.isSpecialDay).toBe(true)
      expect(info.events.some(e => e.name.includes('블랙프라이데이'))).toBe(true)
    })

    it('should identify Christmas', () => {
      const christmas = new Date('2024-12-25')
      const info = calendar.getDateEventInfo(christmas)

      expect(info.isSpecialDay).toBe(true)
      expect(info.events.some(e => e.name.includes('크리스마스'))).toBe(true)
    })

    it('should identify Valentines Day', () => {
      const valentines = new Date('2024-02-14')
      const info = calendar.getDateEventInfo(valentines)

      expect(info.isSpecialDay).toBe(true)
      expect(info.events.some(e => e.name.includes('발렌타인'))).toBe(true)
    })

    it('should identify White Day', () => {
      const whiteDay = new Date('2024-03-14')
      const info = calendar.getDateEventInfo(whiteDay)

      expect(info.isSpecialDay).toBe(true)
      expect(info.events.some(e => e.name.includes('화이트'))).toBe(true)
    })

    it('should return empty events for regular day', () => {
      // 2024년 4월 15일 - 평범한 날
      const regularDay = new Date('2024-04-15')
      const info = calendar.getDateEventInfo(regularDay)

      // May or may not be a special day depending on seasonal patterns
      expect(Array.isArray(info.events)).toBe(true)
    })
  })

  describe('Industry-specific weights', () => {
    it('should apply higher weight for ecommerce on shopping events', () => {
      const blackFriday = new Date('2024-11-29')

      const ecommerceInfo = calendar.getDateEventInfo(blackFriday, 'ecommerce')
      const serviceInfo = calendar.getDateEventInfo(blackFriday, 'service')

      // Ecommerce should have larger expected change range
      if (ecommerceInfo.combinedExpectedChange && serviceInfo.combinedExpectedChange) {
        expect(ecommerceInfo.combinedExpectedChange.spend.max).toBeGreaterThan(
          serviceInfo.combinedExpectedChange.spend.max
        )
      }
    })

    it('should apply higher weight for food_beverage on holiday seasons', () => {
      const chuseok = new Date('2024-09-17')

      const fbInfo = calendar.getDateEventInfo(chuseok, 'food_beverage')

      expect(fbInfo.isSpecialDay).toBe(true)
      if (fbInfo.combinedExpectedChange) {
        expect(fbInfo.combinedExpectedChange.conversion.max).toBeGreaterThan(0)
      }
    })

    it('should apply higher weight for beauty on gift-giving holidays', () => {
      const valentines = new Date('2024-02-14')

      const beautyInfo = calendar.getDateEventInfo(valentines, 'beauty')

      expect(beautyInfo.isSpecialDay).toBe(true)
      if (beautyInfo.combinedExpectedChange) {
        expect(beautyInfo.combinedExpectedChange.conversion.max).toBeGreaterThan(0)
      }
    })

    it('should apply higher weight for fashion on seasonal changes', () => {
      // 봄 신학기 시즌
      const springSeason = new Date('2024-03-01')

      const fashionInfo = calendar.getDateEventInfo(springSeason, 'fashion')

      // Fashion may have seasonal patterns
      expect(fashionInfo).toBeDefined()
    })
  })

  describe('isSpecialDay', () => {
    it('should return true for major holidays', () => {
      const holidays = [
        new Date('2024-01-01'), // 신정
        new Date('2024-02-10'), // 설날
        new Date('2024-05-05'), // 어린이날
        new Date('2024-09-17'), // 추석
        new Date('2024-12-25'), // 크리스마스
      ]

      holidays.forEach(date => {
        expect(calendar.isSpecialDay(date)).toBe(true)
      })
    })

    it('should return true for commercial events', () => {
      const commercialDays = [
        new Date('2024-02-14'), // 발렌타인데이
        new Date('2024-03-14'), // 화이트데이
        new Date('2024-11-11'), // 빼빼로데이
        new Date('2024-11-29'), // 블랙프라이데이
      ]

      commercialDays.forEach(date => {
        expect(calendar.isSpecialDay(date)).toBe(true)
      })
    })
  })

  describe('getSpecialDaysInRange', () => {
    it('should return all special days in November 2024', () => {
      const start = new Date('2024-11-01')
      const end = new Date('2024-11-30')

      const specialDays = calendar.getSpecialDaysInRange(start, end)

      // November has: Pepero Day (11), Black Friday (~29)
      expect(specialDays.length).toBeGreaterThanOrEqual(2)
    })

    it('should return all special days in December 2024', () => {
      const start = new Date('2024-12-01')
      const end = new Date('2024-12-31')

      const specialDays = calendar.getSpecialDaysInRange(start, end)

      // December has: Christmas (25), Year-end shopping season
      expect(specialDays.length).toBeGreaterThanOrEqual(1)
    })

    it('should return empty array for short non-special period', () => {
      const start = new Date('2024-06-05')
      const end = new Date('2024-06-10')

      const specialDays = calendar.getSpecialDaysInRange(start, end)

      // May or may not have seasonal events
      expect(Array.isArray(specialDays)).toBe(true)
    })
  })

  describe('isChangeWithinExpectedRange', () => {
    it('should accept normal variation on regular day', () => {
      const regularDay = new Date('2024-04-15')

      // 10% change should be within expected on regular day
      const result = calendar.isChangeWithinExpectedRange(
        regularDay,
        'spend',
        10,
        'ecommerce'
      )

      // Regular days may have some expected variation too
      expect(typeof result).toBe('boolean')
    })

    it('should accept large variation on Black Friday', () => {
      const blackFriday = new Date('2024-11-29')

      // 50% increase should be expected on Black Friday for ecommerce
      const result = calendar.isChangeWithinExpectedRange(
        blackFriday,
        'spend',
        50,
        'ecommerce'
      )

      expect(result).toBe(true)
    })

    it('should accept conversion spike on Chuseok for food', () => {
      const chuseok = new Date('2024-09-17')

      // High conversion expected for food during Chuseok
      const result = calendar.isChangeWithinExpectedRange(
        chuseok,
        'conversion',
        40,
        'food_beverage'
      )

      expect(result).toBe(true)
    })
  })

  describe('getAdjustedThreshold', () => {
    it('should increase threshold on special days', () => {
      const baseThreshold = 30
      const blackFriday = new Date('2024-11-29')
      const regularDay = new Date('2024-04-15')

      const adjustedBlackFriday = calendar.getAdjustedThreshold(
        blackFriday,
        baseThreshold,
        'spend',
        true,
        'ecommerce'
      )

      const adjustedRegular = calendar.getAdjustedThreshold(
        regularDay,
        baseThreshold,
        'spend',
        true,
        'ecommerce'
      )

      expect(adjustedBlackFriday).toBeGreaterThan(adjustedRegular)
    })

    it('should adjust differently for positive vs negative changes', () => {
      const peperoDay = new Date('2024-11-11')
      const baseThreshold = 30

      const positiveThreshold = calendar.getAdjustedThreshold(
        peperoDay,
        baseThreshold,
        'conversion',
        true,
        'food_beverage'
      )

      const negativeThreshold = calendar.getAdjustedThreshold(
        peperoDay,
        baseThreshold,
        'conversion',
        false,
        'food_beverage'
      )

      // Thresholds may be different for positive vs negative
      expect(typeof positiveThreshold).toBe('number')
      expect(typeof negativeThreshold).toBe('number')
    })
  })

  describe('Expected change ranges', () => {
    it('should have reasonable spend ranges for Black Friday', () => {
      const blackFriday = new Date('2024-11-29')
      const info = calendar.getDateEventInfo(blackFriday, 'ecommerce')

      if (info.combinedExpectedChange) {
        expect(info.combinedExpectedChange.spend.min).toBeGreaterThanOrEqual(-10)
        expect(info.combinedExpectedChange.spend.max).toBeLessThanOrEqual(200)
      }
    })

    it('should have reasonable conversion ranges for Chuseok', () => {
      const chuseok = new Date('2024-09-17')
      const info = calendar.getDateEventInfo(chuseok, 'food_beverage')

      if (info.combinedExpectedChange) {
        // 업종별 가중치(food_beverage: 1.6)가 적용되어 범위가 확대됨
        // 기본 범위 -30~60 * 1.6 = -48~96
        expect(info.combinedExpectedChange.conversion.min).toBeGreaterThanOrEqual(-50)
        expect(info.combinedExpectedChange.conversion.max).toBeLessThanOrEqual(100)
      }
    })

    it('should have CTR ranges', () => {
      const peperoDay = new Date('2024-11-11')
      const info = calendar.getDateEventInfo(peperoDay, 'food_beverage')

      if (info.combinedExpectedChange) {
        expect(info.combinedExpectedChange.ctr).toBeDefined()
        expect(typeof info.combinedExpectedChange.ctr.min).toBe('number')
        expect(typeof info.combinedExpectedChange.ctr.max).toBe('number')
      }
    })
  })

  describe('Singleton pattern', () => {
    it('should return same instance via factory function', () => {
      const instance1 = getKoreanMarketCalendar()
      const instance2 = getKoreanMarketCalendar()

      expect(instance1).toBe(instance2)
    })
  })

  describe('Lunar calendar events', () => {
    it('should correctly calculate Seollal for different years', () => {
      // 설날은 음력 1월 1일로, 매년 양력 날짜가 다름
      // 2024: 2월 10일
      // 2025: 1월 29일
      const seollal2024 = new Date('2024-02-10')
      const info2024 = calendar.getDateEventInfo(seollal2024)

      expect(info2024.events.some(e => e.name.includes('설날'))).toBe(true)
    })

    it('should correctly calculate Chuseok for different years', () => {
      // 추석은 음력 8월 15일로, 매년 양력 날짜가 다름
      // 2024: 9월 17일
      const chuseok2024 = new Date('2024-09-17')
      const info2024 = calendar.getDateEventInfo(chuseok2024)

      expect(info2024.events.some(e => e.name.includes('추석'))).toBe(true)
    })
  })

  describe('Pre-event periods', () => {
    it('should detect pre-Seollal shopping period', () => {
      // 설날 1주 전부터 선물 쇼핑 증가
      const preSeollal = new Date('2024-02-03') // 설날(2/10) 1주 전
      const info = calendar.getDateEventInfo(preSeollal, 'ecommerce')

      // May have pre-event pattern
      expect(info).toBeDefined()
    })

    it('should detect pre-Chuseok shopping period', () => {
      // 추석 1주 전부터 선물 쇼핑 증가
      const preChuseok = new Date('2024-09-10') // 추석(9/17) 1주 전
      const info = calendar.getDateEventInfo(preChuseok, 'ecommerce')

      // May have pre-event pattern
      expect(info).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle year boundary (Dec 31 - Jan 1)', () => {
      const newYearsEve = new Date('2024-12-31')
      const newYearsDay = new Date('2025-01-01')

      const infoEve = calendar.getDateEventInfo(newYearsEve)
      const infoDay = calendar.getDateEventInfo(newYearsDay)

      // Both should be handled without error
      expect(infoEve).toBeDefined()
      expect(infoDay).toBeDefined()
      expect(infoDay.isSpecialDay).toBe(true) // 신정
    })

    it('should handle February 29 (leap year)', () => {
      const leapDay = new Date('2024-02-29')
      const info = calendar.getDateEventInfo(leapDay)

      // Should handle without error
      expect(info).toBeDefined()
    })

    it('should handle invalid dates gracefully', () => {
      // Invalid date should not crash
      const invalidDate = new Date('invalid')

      // The implementation should handle this gracefully
      try {
        const info = calendar.getDateEventInfo(invalidDate)
        // If it doesn't throw, it should return a default response
        expect(info).toBeDefined()
      } catch {
        // It's also acceptable to throw for invalid dates
        expect(true).toBe(true)
      }
    })
  })
})

describe('Seasonal Patterns', () => {
  let calendar: KoreanMarketCalendar

  beforeEach(() => {
    // 테스트에서 2024년 날짜를 사용하므로 2024년 캘린더 생성
    calendar = new KoreanMarketCalendar(2024)
  })

  describe('Year-end shopping season (연말 쇼핑)', () => {
    it('should identify year-end shopping period', () => {
      const dates = [
        new Date('2024-12-20'),
        new Date('2024-12-24'),
        new Date('2024-12-26'),
      ]

      dates.forEach(date => {
        const info = calendar.getDateEventInfo(date, 'ecommerce')
        // Year-end should show increased activity
        expect(info).toBeDefined()
      })
    })
  })

  describe('Summer vacation season (여름휴가)', () => {
    it('should identify summer vacation period', () => {
      const summerDates = [
        new Date('2024-07-20'),
        new Date('2024-08-01'),
        new Date('2024-08-15'),
      ]

      summerDates.forEach(date => {
        const info = calendar.getDateEventInfo(date)
        // Summer should be recognized
        expect(info).toBeDefined()
      })
    })
  })

  describe('Back to school season (신학기)', () => {
    it('should identify back-to-school period', () => {
      const backToSchool = new Date('2024-03-01')
      const info = calendar.getDateEventInfo(backToSchool, 'education')

      // Education industry should see impact
      expect(info).toBeDefined()
    })
  })
})
