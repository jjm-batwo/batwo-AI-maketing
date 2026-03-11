import { IKPIRepository } from '@/domain/repositories/IKPIRepository'
import { IPendingActionRepository } from '@/domain/repositories/IPendingActionRepository'

interface OptimizationMetrics {
  roas: number
  cpa: number
  ctr: number
}

export interface OptimizationResult {
  actionId: string
  campaignId: string
  appliedAt: Date
  before: OptimizationMetrics
  after: OptimizationMetrics
  improvement: OptimizationMetrics
  daysTracked: number
}

export class OptimizationTrackerService {
  constructor(
    private readonly kpiRepository: IKPIRepository,
    private readonly pendingActionRepository: IPendingActionRepository,
  ) {}

  async getOptimizationResult(actionId: string): Promise<OptimizationResult | null> {
    const action = await this.pendingActionRepository.findById(actionId)
    if (!action || action.status !== 'COMPLETED' || !action.executedAt) return null

    const campaignId = action.toolArgs.campaignId as string
    const executedAt = action.executedAt

    const beforeTotals = await this.kpiRepository.aggregateByCampaignId(
      campaignId,
      new Date(executedAt.getTime() - 7 * 24 * 60 * 60 * 1000),
      executedAt,
    )
    
    const now = new Date()
    const trackingEndDate = new Date(Math.min(now.getTime(), executedAt.getTime() + 7 * 24 * 60 * 60 * 1000))
    const afterTotals = await this.kpiRepository.aggregateByCampaignId(
      campaignId,
      executedAt,
      trackingEndDate,
    )

    const calculateMetrics = (totals: { totalImpressions: number, totalClicks: number, totalConversions: number, totalSpend: number, totalRevenue: number }): OptimizationMetrics => {
      return {
        roas: totals.totalSpend > 0 ? totals.totalRevenue / totals.totalSpend : 0,
        cpa: totals.totalConversions > 0 ? totals.totalSpend / totals.totalConversions : 0,
        ctr: totals.totalImpressions > 0 ? (totals.totalClicks / totals.totalImpressions) * 100 : 0,
      }
    }

    const beforeKPI = calculateMetrics(beforeTotals)
    const afterKPI = calculateMetrics(afterTotals)

    return {
      actionId,
      campaignId,
      appliedAt: executedAt,
      before: beforeKPI,
      after: afterKPI,
      improvement: {
        roas: afterKPI.roas - beforeKPI.roas,
        cpa: beforeKPI.cpa - afterKPI.cpa, // lower CPA is better, so maybe positive means improvement in the UI? 
        // to keep it simple, math difference:
        ctr: afterKPI.ctr - beforeKPI.ctr,
      },
      daysTracked: Math.min(7, Math.max(0, Math.floor((now.getTime() - executedAt.getTime()) / (24 * 60 * 60 * 1000)))),
    }
  }
}
