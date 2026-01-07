import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BudgetAlertService } from '@/application/services/BudgetAlertService'
import { IBudgetAlertRepository } from '@/domain/repositories/IBudgetAlertRepository'
import { IKPIRepository } from '@/domain/repositories/IKPIRepository'
import { BudgetAlert } from '@/domain/entities/BudgetAlert'

describe('BudgetAlertService', () => {
  let service: BudgetAlertService
  let mockBudgetAlertRepo: IBudgetAlertRepository
  let mockKPIRepo: Partial<IKPIRepository>

  beforeEach(() => {
    mockBudgetAlertRepo = {
      findByCampaignId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAllEnabled: vi.fn(),
    }

    mockKPIRepo = {
      getCumulativeSpend: vi.fn(),
    }

    service = new BudgetAlertService(mockBudgetAlertRepo, mockKPIRepo as IKPIRepository)
  })

  describe('createAlert', () => {
    it('캠페인에 대한 예산 알림을 생성해야 한다', async () => {
      const expectedAlert = BudgetAlert.create({
        campaignId: 'campaign-1',
        thresholdPercent: 80,
        isEnabled: true,
      })

      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(null)
      vi.mocked(mockBudgetAlertRepo.create).mockResolvedValue(expectedAlert)

      const result = await service.createAlert({
        campaignId: 'campaign-1',
        thresholdPercent: 80,
      })

      expect(result.campaignId).toBe('campaign-1')
      expect(result.thresholdPercent).toBe(80)
      expect(result.isEnabled).toBe(true)
      expect(mockBudgetAlertRepo.create).toHaveBeenCalled()
    })

    it('이미 알림이 존재하면 에러를 던져야 한다', async () => {
      const existingAlert = BudgetAlert.create({
        campaignId: 'campaign-1',
        thresholdPercent: 80,
        isEnabled: true,
      })

      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(existingAlert)

      await expect(
        service.createAlert({
          campaignId: 'campaign-1',
          thresholdPercent: 80,
        })
      ).rejects.toThrow('이 캠페인에 이미 예산 알림이 설정되어 있습니다')
    })

    it('임계값이 0-100 범위를 벗어나면 에러를 던져야 한다', async () => {
      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(null)

      await expect(
        service.createAlert({
          campaignId: 'campaign-1',
          thresholdPercent: 150,
        })
      ).rejects.toThrow('임계값은 1-100 사이여야 합니다')

      await expect(
        service.createAlert({
          campaignId: 'campaign-1',
          thresholdPercent: 0,
        })
      ).rejects.toThrow('임계값은 1-100 사이여야 합니다')
    })
  })

  describe('updateAlert', () => {
    it('알림 설정을 업데이트해야 한다', async () => {
      const existingAlert = BudgetAlert.create({
        id: 'alert-1',
        campaignId: 'campaign-1',
        thresholdPercent: 80,
        isEnabled: true,
      })

      const updatedAlert = existingAlert.updateThreshold(90)

      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(existingAlert)
      vi.mocked(mockBudgetAlertRepo.update).mockResolvedValue(updatedAlert)

      const result = await service.updateAlert({
        campaignId: 'campaign-1',
        thresholdPercent: 90,
      })

      expect(result.thresholdPercent).toBe(90)
      expect(mockBudgetAlertRepo.update).toHaveBeenCalled()
    })

    it('존재하지 않는 알림을 업데이트하면 에러를 던져야 한다', async () => {
      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(null)

      await expect(
        service.updateAlert({
          campaignId: 'campaign-1',
          thresholdPercent: 90,
        })
      ).rejects.toThrow('예산 알림 설정을 찾을 수 없습니다')
    })
  })

  describe('toggleAlert', () => {
    it('알림을 활성화/비활성화해야 한다', async () => {
      const existingAlert = BudgetAlert.create({
        id: 'alert-1',
        campaignId: 'campaign-1',
        thresholdPercent: 80,
        isEnabled: true,
      })

      const disabledAlert = existingAlert.disable()

      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(existingAlert)
      vi.mocked(mockBudgetAlertRepo.update).mockResolvedValue(disabledAlert)

      const result = await service.toggleAlert('campaign-1', false)

      expect(result.isEnabled).toBe(false)
    })
  })

  describe('checkBudgetStatus', () => {
    it('예산 소진율이 임계값 미만이면 정상 상태를 반환해야 한다', async () => {
      const alert = BudgetAlert.create({
        id: 'alert-1',
        campaignId: 'campaign-1',
        thresholdPercent: 80,
        isEnabled: true,
      })

      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(alert)
      // 일일 예산 100,000원, 지출 50,000원 = 50%
      vi.mocked(mockKPIRepo.getCumulativeSpend!).mockResolvedValue(50000)

      const result = await service.checkBudgetStatus('campaign-1', 100000)

      expect(result.status).toBe('normal')
      expect(result.spendPercent).toBe(50)
      expect(result.shouldAlert).toBe(false)
    })

    it('예산 소진율이 임계값 이상이면 경고 상태를 반환해야 한다', async () => {
      const alert = BudgetAlert.create({
        id: 'alert-1',
        campaignId: 'campaign-1',
        thresholdPercent: 80,
        isEnabled: true,
      })

      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(alert)
      // 일일 예산 100,000원, 지출 85,000원 = 85%
      vi.mocked(mockKPIRepo.getCumulativeSpend!).mockResolvedValue(85000)

      const result = await service.checkBudgetStatus('campaign-1', 100000)

      expect(result.status).toBe('warning')
      expect(result.spendPercent).toBe(85)
      expect(result.shouldAlert).toBe(true)
    })

    it('예산이 100% 소진되면 초과 상태를 반환해야 한다', async () => {
      const alert = BudgetAlert.create({
        id: 'alert-1',
        campaignId: 'campaign-1',
        thresholdPercent: 80,
        isEnabled: true,
      })

      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(alert)
      // 일일 예산 100,000원, 지출 105,000원 = 105%
      vi.mocked(mockKPIRepo.getCumulativeSpend!).mockResolvedValue(105000)

      const result = await service.checkBudgetStatus('campaign-1', 100000)

      expect(result.status).toBe('exceeded')
      expect(result.spendPercent).toBe(105)
      expect(result.shouldAlert).toBe(true)
    })

    it('알림이 비활성화되어 있으면 shouldAlert가 false여야 한다', async () => {
      const alert = BudgetAlert.create({
        id: 'alert-1',
        campaignId: 'campaign-1',
        thresholdPercent: 80,
        isEnabled: false,
      })

      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(alert)
      vi.mocked(mockKPIRepo.getCumulativeSpend!).mockResolvedValue(85000)

      const result = await service.checkBudgetStatus('campaign-1', 100000)

      expect(result.status).toBe('warning')
      expect(result.shouldAlert).toBe(false) // 비활성화되어 있으므로
    })

    it('알림 설정이 없으면 기본 상태를 반환해야 한다', async () => {
      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(null)
      vi.mocked(mockKPIRepo.getCumulativeSpend!).mockResolvedValue(85000)

      const result = await service.checkBudgetStatus('campaign-1', 100000)

      expect(result.status).toBe('warning')
      expect(result.shouldAlert).toBe(false) // 알림 설정이 없으므로
    })
  })

  describe('markAsAlerted', () => {
    it('알림 발송 시점을 기록해야 한다', async () => {
      const alert = BudgetAlert.create({
        id: 'alert-1',
        campaignId: 'campaign-1',
        thresholdPercent: 80,
        isEnabled: true,
      })

      const alertedAlert = alert.markAsAlerted()

      vi.mocked(mockBudgetAlertRepo.findByCampaignId).mockResolvedValue(alert)
      vi.mocked(mockBudgetAlertRepo.update).mockResolvedValue(alertedAlert)

      const result = await service.markAsAlerted('campaign-1')

      expect(result.alertedAt).toBeDefined()
      expect(mockBudgetAlertRepo.update).toHaveBeenCalled()
    })
  })

  describe('deleteAlert', () => {
    it('알림 설정을 삭제해야 한다', async () => {
      vi.mocked(mockBudgetAlertRepo.delete).mockResolvedValue(undefined)

      await service.deleteAlert('campaign-1')

      expect(mockBudgetAlertRepo.delete).toHaveBeenCalledWith('campaign-1')
    })
  })
})
