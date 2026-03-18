import { describe, it, expect } from 'vitest'
import { FunnelClassificationService } from '@application/services/FunnelClassificationService'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

describe('FunnelClassificationService', () => {
  const service = new FunnelClassificationService()

  describe('classifyFunnelStage', () => {
    it('should classify AWARENESS as tofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.AWARENESS)).toBe('tofu')
    })

    it('should classify TRAFFIC as mofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.TRAFFIC)).toBe('mofu')
    })

    it('should classify ENGAGEMENT as mofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.ENGAGEMENT)).toBe('mofu')
    })

    it('should classify LEADS as mofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.LEADS)).toBe('mofu')
    })

    it('should classify APP_PROMOTION as mofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.APP_PROMOTION)).toBe('mofu')
    })

    it('should classify SALES as bofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.SALES)).toBe('bofu')
    })

    it('should classify CONVERSIONS as bofu', () => {
      expect(service.classifyFunnelStage(CampaignObjective.CONVERSIONS)).toBe('bofu')
    })
  })

  describe('classifyWithAdvantage (B4)', () => {
    it('should return auto for campaign with advantageConfig', () => {
      const result = service.classifyWithAdvantage(
        CampaignObjective.SALES,
        true
      )
      expect(result).toBe('auto')
    })

    it('should classify normally without advantageConfig', () => {
      const result = service.classifyWithAdvantage(
        CampaignObjective.SALES,
        false
      )
      expect(result).toBe('bofu')
    })
  })

  describe('calculateBudgetRatios', () => {
    it('should calculate correct budget ratios excluding auto', () => {
      const stages = [
        { stage: 'tofu' as const, spend: 300_000 },
        { stage: 'mofu' as const, spend: 200_000 },
        { stage: 'bofu' as const, spend: 500_000 },
      ]
      const ratios = service.calculateBudgetRatios(stages)
      expect(ratios.get('tofu')).toBeCloseTo(30.0)
      expect(ratios.get('mofu')).toBeCloseTo(20.0)
      expect(ratios.get('bofu')).toBeCloseTo(50.0)
    })

    it('should exclude auto from ratio calculation', () => {
      const stages = [
        { stage: 'tofu' as const, spend: 300_000 },
        { stage: 'auto' as const, spend: 200_000 },
        { stage: 'bofu' as const, spend: 500_000 },
      ]
      const ratios = service.calculateBudgetRatios(stages)
      expect(ratios.get('tofu')).toBeCloseTo(37.5)
      expect(ratios.get('bofu')).toBeCloseTo(62.5)
      expect(ratios.get('auto')).toBe(0)
    })

    it('should handle all-zero spend', () => {
      const stages = [
        { stage: 'tofu' as const, spend: 0 },
        { stage: 'mofu' as const, spend: 0 },
      ]
      const ratios = service.calculateBudgetRatios(stages)
      expect(ratios.get('tofu')).toBe(0)
    })
  })

  describe('getStageLabel', () => {
    it('should return Korean labels', () => {
      expect(service.getStageLabel('tofu')).toBe('인지 (ToFu)')
      expect(service.getStageLabel('mofu')).toBe('고려 (MoFu)')
      expect(service.getStageLabel('bofu')).toBe('전환 (BoFu)')
      expect(service.getStageLabel('auto')).toBe('자동 배치 (Advantage+)')
    })
  })
})
