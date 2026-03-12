import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationDispatcherService } from '@application/services/NotificationDispatcherService'
import type { INotificationSender } from '@application/ports/INotificationSender'
import type { INotificationChannelRepository } from '@domain/repositories/INotificationChannelRepository'
import type { INotificationPreferenceRepository } from '@domain/repositories/INotificationPreferenceRepository'
import { NotificationChannel } from '@domain/entities/NotificationChannel'
import { NotificationPreference } from '@domain/value-objects/NotificationPreference'

function createMockChannelRepo(): INotificationChannelRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn(),
    findByUserAndType: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}

function createMockPreferenceRepo(): INotificationPreferenceRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn(),
    findByUserAndType: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}

function createMockSender(success = true): INotificationSender {
  return {
    send: vi.fn().mockResolvedValue({ success, error: success ? undefined : 'Send failed' }),
  }
}

describe('NotificationDispatcherService', () => {
  let service: NotificationDispatcherService
  let channelRepo: INotificationChannelRepository
  let preferenceRepo: INotificationPreferenceRepository
  let slackSender: INotificationSender
  let kakaoSender: INotificationSender

  beforeEach(() => {
    channelRepo = createMockChannelRepo()
    preferenceRepo = createMockPreferenceRepo()
    slackSender = createMockSender()
    kakaoSender = createMockSender()

    service = new NotificationDispatcherService(channelRepo, preferenceRepo, slackSender, kakaoSender)
  })

  it('선호도에 따라 Slack으로 알림을 발송해야 한다', async () => {
    const preference = NotificationPreference.restore({
      id: 'pref-1',
      userId: 'user-1',
      alertType: 'anomaly',
      channels: ['SLACK'],
      minSeverity: 'WARNING',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const channel = NotificationChannel.restore({
      id: 'ch-1',
      userId: 'user-1',
      type: 'SLACK',
      config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(preferenceRepo.findByUserAndType).mockResolvedValue(preference)
    vi.mocked(channelRepo.findByUserAndType).mockResolvedValue(channel)

    const result = await service.dispatch({
      userId: 'user-1',
      alertType: 'anomaly',
      severity: 'WARNING',
      title: 'ROAS 급락',
      message: 'Campaign A ROAS가 30% 하락했습니다',
    })

    expect(result.sent).toBe(1)
    expect(result.failed).toBe(0)
    expect(slackSender.send).toHaveBeenCalledOnce()
  })

  it('선호도에 따라 Slack과 카카오 모두에 발송해야 한다', async () => {
    const preference = NotificationPreference.restore({
      id: 'pref-1',
      userId: 'user-1',
      alertType: 'budget',
      channels: ['SLACK', 'KAKAO'],
      minSeverity: 'WARNING',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const slackChannel = NotificationChannel.restore({
      id: 'ch-1',
      userId: 'user-1',
      type: 'SLACK',
      config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const kakaoChannel = NotificationChannel.restore({
      id: 'ch-2',
      userId: 'user-1',
      type: 'KAKAO',
      config: { phoneNumber: '01012345678' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(preferenceRepo.findByUserAndType).mockResolvedValue(preference)
    vi.mocked(channelRepo.findByUserAndType)
      .mockResolvedValueOnce(slackChannel)
      .mockResolvedValueOnce(kakaoChannel)

    const result = await service.dispatch({
      userId: 'user-1',
      alertType: 'budget',
      severity: 'CRITICAL',
      title: '예산 초과',
      message: 'Campaign B 예산이 초과되었습니다',
    })

    expect(result.sent).toBe(2)
    expect(result.failed).toBe(0)
    expect(slackSender.send).toHaveBeenCalledOnce()
    expect(kakaoSender.send).toHaveBeenCalledOnce()
  })

  it('선호도가 비활성이면 발송하지 않아야 한다', async () => {
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

    vi.mocked(preferenceRepo.findByUserAndType).mockResolvedValue(preference)

    const result = await service.dispatch({
      userId: 'user-1',
      alertType: 'anomaly',
      severity: 'CRITICAL',
      title: 'Test',
      message: 'Test message',
    })

    expect(result.sent).toBe(0)
    expect(slackSender.send).not.toHaveBeenCalled()
  })

  it('선호도가 없으면 발송하지 않아야 한다', async () => {
    vi.mocked(preferenceRepo.findByUserAndType).mockResolvedValue(null)

    const result = await service.dispatch({
      userId: 'user-1',
      alertType: 'anomaly',
      severity: 'CRITICAL',
      title: 'Test',
      message: 'Test message',
    })

    expect(result.sent).toBe(0)
    expect(slackSender.send).not.toHaveBeenCalled()
  })

  it('심각도가 최소 기준 미만이면 발송하지 않아야 한다', async () => {
    const preference = NotificationPreference.restore({
      id: 'pref-1',
      userId: 'user-1',
      alertType: 'anomaly',
      channels: ['SLACK'],
      minSeverity: 'CRITICAL',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(preferenceRepo.findByUserAndType).mockResolvedValue(preference)

    const result = await service.dispatch({
      userId: 'user-1',
      alertType: 'anomaly',
      severity: 'WARNING',
      title: 'Test',
      message: 'Test message',
    })

    expect(result.sent).toBe(0)
    expect(slackSender.send).not.toHaveBeenCalled()
  })

  it('비활성화된 채널은 건너뛰어야 한다', async () => {
    const preference = NotificationPreference.restore({
      id: 'pref-1',
      userId: 'user-1',
      alertType: 'anomaly',
      channels: ['SLACK'],
      minSeverity: 'WARNING',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const channel = NotificationChannel.restore({
      id: 'ch-1',
      userId: 'user-1',
      type: 'SLACK',
      config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(preferenceRepo.findByUserAndType).mockResolvedValue(preference)
    vi.mocked(channelRepo.findByUserAndType).mockResolvedValue(channel)

    const result = await service.dispatch({
      userId: 'user-1',
      alertType: 'anomaly',
      severity: 'WARNING',
      title: 'Test',
      message: 'Test message',
    })

    expect(result.sent).toBe(0)
    expect(slackSender.send).not.toHaveBeenCalled()
  })

  it('발송 실패 시 failed 카운트와 에러를 기록해야 한다', async () => {
    slackSender = createMockSender(false)
    service = new NotificationDispatcherService(channelRepo, preferenceRepo, slackSender, kakaoSender)

    const preference = NotificationPreference.restore({
      id: 'pref-1',
      userId: 'user-1',
      alertType: 'anomaly',
      channels: ['SLACK'],
      minSeverity: 'WARNING',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const channel = NotificationChannel.restore({
      id: 'ch-1',
      userId: 'user-1',
      type: 'SLACK',
      config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(preferenceRepo.findByUserAndType).mockResolvedValue(preference)
    vi.mocked(channelRepo.findByUserAndType).mockResolvedValue(channel)

    const result = await service.dispatch({
      userId: 'user-1',
      alertType: 'anomaly',
      severity: 'WARNING',
      title: 'Test',
      message: 'Test message',
    })

    expect(result.sent).toBe(0)
    expect(result.failed).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('SLACK')
  })
})
