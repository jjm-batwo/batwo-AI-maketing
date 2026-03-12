import { describe, it, expect } from 'vitest'
import { NotificationChannel } from '@domain/entities/NotificationChannel'
import type { SlackConfig, KakaoConfig, EmailConfig } from '@domain/entities/NotificationChannel'

describe('NotificationChannel', () => {
  describe('create', () => {
    it('유효한 Slack 설정으로 채널을 생성해야 한다', () => {
      const config: SlackConfig = { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' }
      const channel = NotificationChannel.create({
        userId: 'user-1',
        type: 'SLACK',
        config,
      })

      expect(channel.userId).toBe('user-1')
      expect(channel.type).toBe('SLACK')
      expect(channel.config).toEqual(config)
      expect(channel.isActive).toBe(true)
    })

    it('유효한 카카오 설정으로 채널을 생성해야 한다', () => {
      const config: KakaoConfig = { phoneNumber: '01012345678' }
      const channel = NotificationChannel.create({
        userId: 'user-1',
        type: 'KAKAO',
        config,
      })

      expect(channel.type).toBe('KAKAO')
      expect(channel.config).toEqual(config)
      expect(channel.isActive).toBe(true)
    })

    it('유효한 이메일 설정으로 채널을 생성해야 한다', () => {
      const config: EmailConfig = { email: 'test@batwo.ai' }
      const channel = NotificationChannel.create({
        userId: 'user-1',
        type: 'EMAIL',
        config,
      })

      expect(channel.type).toBe('EMAIL')
      expect(channel.config).toEqual(config)
    })

    it('잘못된 Slack webhook URL이면 오류를 던져야 한다', () => {
      expect(() =>
        NotificationChannel.create({
          userId: 'user-1',
          type: 'SLACK',
          config: { webhookUrl: 'https://example.com/webhook' } as SlackConfig,
        })
      ).toThrow('유효한 Slack Webhook URL이 필요합니다')
    })

    it('빈 Slack webhook URL이면 오류를 던져야 한다', () => {
      expect(() =>
        NotificationChannel.create({
          userId: 'user-1',
          type: 'SLACK',
          config: { webhookUrl: '' } as SlackConfig,
        })
      ).toThrow('유효한 Slack Webhook URL이 필요합니다')
    })

    it('잘못된 전화번호이면 오류를 던져야 한다', () => {
      expect(() =>
        NotificationChannel.create({
          userId: 'user-1',
          type: 'KAKAO',
          config: { phoneNumber: '1234567890' } as KakaoConfig,
        })
      ).toThrow('유효한 휴대폰 번호가 필요합니다')
    })

    it('잘못된 이메일이면 오류를 던져야 한다', () => {
      expect(() =>
        NotificationChannel.create({
          userId: 'user-1',
          type: 'EMAIL',
          config: { email: 'invalid-email' } as EmailConfig,
        })
      ).toThrow('유효한 이메일 주소가 필요합니다')
    })
  })

  describe('restore', () => {
    it('persistence에서 복원해야 한다', () => {
      const channel = NotificationChannel.restore({
        id: 'ch-1',
        userId: 'user-1',
        type: 'SLACK',
        config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(channel.id).toBe('ch-1')
      expect(channel.type).toBe('SLACK')
    })
  })

  describe('deactivate', () => {
    it('채널을 비활성화해야 한다', () => {
      const channel = NotificationChannel.create({
        userId: 'user-1',
        type: 'SLACK',
        config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
      })

      const deactivated = channel.deactivate()
      expect(deactivated.isActive).toBe(false)
    })
  })

  describe('activate', () => {
    it('채널을 활성화해야 한다', () => {
      const channel = NotificationChannel.restore({
        id: 'ch-1',
        userId: 'user-1',
        type: 'SLACK',
        config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const activated = channel.activate()
      expect(activated.isActive).toBe(true)
    })
  })

  describe('updateConfig', () => {
    it('유효한 설정으로 업데이트해야 한다', () => {
      const channel = NotificationChannel.create({
        userId: 'user-1',
        type: 'SLACK',
        config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
      })

      const updated = channel.updateConfig({
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/yyy',
        channelName: '#alerts',
      })

      expect((updated.config as SlackConfig).webhookUrl).toBe(
        'https://hooks.slack.com/services/T00/B00/yyy'
      )
      expect((updated.config as SlackConfig).channelName).toBe('#alerts')
    })

    it('잘못된 설정이면 오류를 던져야 한다', () => {
      const channel = NotificationChannel.create({
        userId: 'user-1',
        type: 'SLACK',
        config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
      })

      expect(() =>
        channel.updateConfig({ webhookUrl: 'invalid-url' } as SlackConfig)
      ).toThrow('유효한 Slack Webhook URL이 필요합니다')
    })
  })

  describe('toJSON', () => {
    it('props를 JSON으로 반환해야 한다', () => {
      const channel = NotificationChannel.create({
        userId: 'user-1',
        type: 'SLACK',
        config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
      })

      const json = channel.toJSON()
      expect(json.userId).toBe('user-1')
      expect(json.type).toBe('SLACK')
      expect(json.isActive).toBe(true)
    })
  })
})
