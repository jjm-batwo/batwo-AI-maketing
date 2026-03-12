import { describe, it, expect } from 'vitest'
import { NotificationPreference } from '@domain/value-objects/NotificationPreference'

describe('NotificationPreference', () => {
  describe('create', () => {
    it('유효한 선호도를 생성해야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK', 'KAKAO'],
        minSeverity: 'WARNING',
      })

      expect(preference.userId).toBe('user-1')
      expect(preference.alertType).toBe('anomaly')
      expect(preference.channels).toEqual(['SLACK', 'KAKAO'])
      expect(preference.minSeverity).toBe('WARNING')
      expect(preference.isActive).toBe(true)
    })

    it('minSeverity 기본값은 WARNING이어야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'budget',
        channels: ['SLACK'],
      })

      expect(preference.minSeverity).toBe('WARNING')
    })

    it('빈 채널 배열이면 오류를 던져야 한다', () => {
      expect(() =>
        NotificationPreference.create({
          userId: 'user-1',
          alertType: 'anomaly',
          channels: [],
        })
      ).toThrow('최소 하나의 알림 채널을 선택해야 합니다')
    })

    it('잘못된 alertType이면 오류를 던져야 한다', () => {
      expect(() =>
        NotificationPreference.create({
          userId: 'user-1',
          alertType: 'invalid' as never,
          channels: ['SLACK'],
        })
      ).toThrow('알 수 없는 알림 유형: invalid')
    })
  })

  describe('meetsSeverity', () => {
    it('WARNING 기준에서 CRITICAL은 true여야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
        minSeverity: 'WARNING',
      })

      expect(preference.meetsSeverity('CRITICAL')).toBe(true)
    })

    it('WARNING 기준에서 WARNING은 true여야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
        minSeverity: 'WARNING',
      })

      expect(preference.meetsSeverity('WARNING')).toBe(true)
    })

    it('WARNING 기준에서 INFO는 false여야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
        minSeverity: 'WARNING',
      })

      expect(preference.meetsSeverity('INFO')).toBe(false)
    })

    it('INFO 기준에서 모든 심각도는 true여야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
        minSeverity: 'INFO',
      })

      expect(preference.meetsSeverity('INFO')).toBe(true)
      expect(preference.meetsSeverity('WARNING')).toBe(true)
      expect(preference.meetsSeverity('CRITICAL')).toBe(true)
    })

    it('CRITICAL 기준에서 CRITICAL만 true여야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
        minSeverity: 'CRITICAL',
      })

      expect(preference.meetsSeverity('INFO')).toBe(false)
      expect(preference.meetsSeverity('WARNING')).toBe(false)
      expect(preference.meetsSeverity('CRITICAL')).toBe(true)
    })
  })

  describe('updateChannels', () => {
    it('채널을 업데이트해야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
      })

      const updated = preference.updateChannels(['SLACK', 'EMAIL'])
      expect(updated.channels).toEqual(['SLACK', 'EMAIL'])
    })

    it('빈 채널로 업데이트하면 오류를 던져야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
      })

      expect(() => preference.updateChannels([])).toThrow('최소 하나의 알림 채널을 선택해야 합니다')
    })
  })

  describe('updateMinSeverity', () => {
    it('최소 심각도를 업데이트해야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
        minSeverity: 'WARNING',
      })

      const updated = preference.updateMinSeverity('CRITICAL')
      expect(updated.minSeverity).toBe('CRITICAL')
    })
  })

  describe('deactivate/activate', () => {
    it('비활성화해야 한다', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
      })

      const deactivated = preference.deactivate()
      expect(deactivated.isActive).toBe(false)
    })

    it('활성화해야 한다', () => {
      const preference = NotificationPreference.restore({
        id: 'pref-1',
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
        minSeverity: 'WARNING',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const activated = preference.activate()
      expect(activated.isActive).toBe(true)
    })
  })

  describe('toJSON', () => {
    it('channels는 복사본이어야 한다 (불변성)', () => {
      const preference = NotificationPreference.create({
        userId: 'user-1',
        alertType: 'anomaly',
        channels: ['SLACK'],
      })

      const json = preference.toJSON()
      json.channels.push('KAKAO')

      expect(preference.channels).toEqual(['SLACK'])
    })
  })
})
