import { describe, it, expect } from 'vitest'
import {
  isTokenExpired,
  isTokenExpiringSoon,
  getTokenRemainingHours,
} from '@application/utils/metaTokenUtils'

describe('metaTokenUtils', () => {
  describe('isTokenExpired', () => {
    it('should return false when tokenExpiry is null', () => {
      expect(isTokenExpired(null)).toBe(false)
    })

    it('should return true when token is already expired', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000) // 1시간 전
      expect(isTokenExpired(pastDate)).toBe(true)
    })

    it('should return false when token is still valid', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후
      expect(isTokenExpired(futureDate)).toBe(false)
    })
  })

  describe('isTokenExpiringSoon', () => {
    it('should return false when tokenExpiry is null', () => {
      expect(isTokenExpiringSoon(null)).toBe(false)
    })

    it('should return true when token expires within default 24 hours', () => {
      const soonDate = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12시간 후
      expect(isTokenExpiringSoon(soonDate)).toBe(true)
    })

    it('should return false when token expires after 24 hours', () => {
      const farDate = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48시간 후
      expect(isTokenExpiringSoon(farDate)).toBe(false)
    })

    it('should respect custom hoursBeforeExpiry parameter', () => {
      const date = new Date(Date.now() + 3 * 60 * 60 * 1000) // 3시간 후
      expect(isTokenExpiringSoon(date, 2)).toBe(false) // 2시간 기준 → 아직 여유
      expect(isTokenExpiringSoon(date, 4)).toBe(true) // 4시간 기준 → 곧 만료
    })

    it('should return true when token is already expired', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000)
      expect(isTokenExpiringSoon(pastDate)).toBe(true)
    })
  })

  describe('getTokenRemainingHours', () => {
    it('should return null when tokenExpiry is null', () => {
      expect(getTokenRemainingHours(null)).toBeNull()
    })

    it('should return positive hours for future expiry', () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000)
      const remaining = getTokenRemainingHours(futureDate)
      expect(remaining).toBeGreaterThan(47)
      expect(remaining).toBeLessThanOrEqual(48)
    })

    it('should return negative hours for past expiry', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const remaining = getTokenRemainingHours(pastDate)
      expect(remaining).toBeLessThan(0)
    })
  })
})
