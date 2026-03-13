import { describe, it, expect, beforeEach } from 'vitest'
import { AdAccountAuditService } from '@/application/services/AdAccountAuditService'
// AnomalyDetectionService and PortfolioOptimizationService types are mocked locally
import { ICampaignRepository } from '@/domain/repositories/ICampaignRepository'
import { IKPIRepository } from '@/domain/repositories/IKPIRepository'
import { Campaign } from '@/domain/entities/Campaign'

class MockAnomalyDetectionService {
  private anomalies: any[] = []
  setMockAnomalies(anomalies: any[]) {
    this.anomalies = anomalies
  }
  async detectAnomalies() {
    return this.anomalies
  }
}

class MockPortfolioOptimizationService {
  private portfolio: any = {}
  setMockPortfolio(portfolio: any) {
    this.portfolio = portfolio
  }
  async analyzePortfolio() {
    return this.portfolio
  }
}

class MockCampaignRepository implements Partial<ICampaignRepository> {
  private campaigns: Campaign[] = []
  
  setMockCampaigns(campaigns: any[]) {
    this.campaigns = campaigns as any
  }
  async findByUserId(_userId: string): Promise<Campaign[]> {
    return this.campaigns
  }
}

class MockKPIRepository implements Partial<IKPIRepository> {
  async findByFilters(): Promise<any[]> {
    return []
  }
  async findByCampaignIdAndDateRange(): Promise<any[]> {
    return []
  }
}

describe('AdAccountAuditService', () => {
  let service: AdAccountAuditService
  let anomalyService: MockAnomalyDetectionService
  let portfolioService: MockPortfolioOptimizationService
  let campaignRepository: MockCampaignRepository
  let kpiRepository: MockKPIRepository

  beforeEach(() => {
    anomalyService = new MockAnomalyDetectionService()
    portfolioService = new MockPortfolioOptimizationService()
    campaignRepository = new MockCampaignRepository()
    kpiRepository = new MockKPIRepository()

    service = new AdAccountAuditService(
      anomalyService as any,
      portfolioService as any,
      kpiRepository as any,
      campaignRepository as any
    )
  })

  it('should generate audit report combining anomaly + portfolio + science data', async () => {
    campaignRepository.setMockCampaigns([
      { id: 'camp-1', name: 'Campaign 1' },
    ])
    
    anomalyService.setMockAnomalies([
      { type: 'metric_drop', severity: 'warning', metric: 'ctr' },
      { type: 'spike', severity: 'critical', metric: 'cpa' },
    ])
    
    portfolioService.setMockPortfolio({
      totalBudget: 1000000,
      optimizationRecommendations: [
        { campaignId: 'camp-1', recommendedBudget: 500000 },
      ],
    })

    const report = await service.generateAudit('user-123')

    expect(report.overallScore).toBeGreaterThanOrEqual(0)
    expect(report.overallScore).toBeLessThanOrEqual(100)
    expect(report.categories).toHaveLength(5)
    expect(report.totalWasteEstimate).toBeGreaterThanOrEqual(0)
    
    // CPA 급등(Critical)으로 비효율적 캠페인 감지 검증
    const inefficient = report.categories.find(c => c.category === 'inefficient_campaigns')
    expect(inefficient?.wasteEstimate).toBe(50000)
    
    // CTR 하락(Warning)으로 크리에이티브 피로 감지 검증
    const fatigue = report.categories.find(c => c.category === 'creative_fatigue')
    expect(fatigue?.wasteEstimate).toBe(30000)
  })

  it('should return empty report if no campaigns', async () => {
    campaignRepository.setMockCampaigns([])
    const report = await service.generateAudit('user-no-campaigns')
    
    expect(report.analyzedCampaigns).toBe(0)
    expect(report.overallGrade).toBe('average')
    expect(report.overallScore).toBe(50)
  })
})
