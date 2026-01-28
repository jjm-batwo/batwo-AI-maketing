/**
 * PortfolioOptimizationService - Multi-campaign portfolio budget optimization
 *
 * Analyzes campaign performance across a user's entire portfolio
 * and provides optimal budget allocation recommendations.
 *
 * Key Features:
 * - Marginal ROAS calculation (diminishing returns)
 * - Optimal budget reallocation based on efficiency
 * - Risk-return diversification analysis
 * - Portfolio-level performance metrics
 */

import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

/**
 * Campaign allocation recommendation
 */
export interface CampaignAllocation {
  campaignId: string
  campaignName: string
  objective: CampaignObjective
  currentBudget: number
  recommendedBudget: number
  changePercent: number
  metrics: {
    roas: number
    cpa: number
    marginalROAS: number // Incremental ROAS at current spend level
  }
  reasoning: string
}

/**
 * Portfolio-wide analysis result
 */
export interface PortfolioAnalysis {
  totalBudget: number
  allocations: CampaignAllocation[]
  expectedImpact: {
    currentTotalROAS: number
    projectedTotalROAS: number
    improvement: number
  }
  efficiencyScore: number // 0-100: How well budget is allocated
  diversificationScore: number // 0-100: Campaign diversity
  recommendations: string[]
}

/**
 * Efficiency frontier point (risk-return analysis)
 */
export interface EfficiencyFrontier {
  points: { risk: number; return: number; allocation: Record<string, number> }[]
  currentPosition: { risk: number; return: number }
  optimalPosition: { risk: number; return: number }
}

/**
 * Campaign performance data for optimization
 */
interface CampaignPerformance {
  id: string
  name: string
  objective: CampaignObjective
  currentBudget: number
  spend: number
  revenue: number
  conversions: number
  roas: number
  cpa: number
  variance: number // Performance variance (for risk calculation)
}

/**
 * Portfolio Optimization Service
 */
export class PortfolioOptimizationService {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly kpiRepository: IKPIRepository
  ) {}

  /**
   * Analyze user's full campaign portfolio
   */
  async analyzePortfolio(userId: string): Promise<PortfolioAnalysis> {
    // Fetch all active campaigns with recent performance data
    const campaigns = await this.fetchCampaignPerformance(userId)

    if (campaigns.length === 0) {
      throw new Error('No active campaigns found for portfolio analysis')
    }

    const totalBudget = campaigns.reduce((sum, c) => sum + c.currentBudget, 0)

    // Calculate marginal ROAS for each campaign
    const campaignsWithMarginal = await Promise.all(
      campaigns.map(async (c) => ({
        ...c,
        marginalROAS: await this.calculateMarginalROAS(c.id),
      }))
    )

    // Optimize allocation
    const optimizedAllocation = this.optimizeAllocation(totalBudget, campaignsWithMarginal)

    // Calculate diversification
    const diversificationScore = this.calculateDiversificationScore(campaigns)

    // Calculate efficiency score
    const efficiencyScore = this.calculateEfficiencyScore(campaignsWithMarginal)

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      campaignsWithMarginal,
      optimizedAllocation,
      diversificationScore
    )

    // Calculate expected impact
    const currentTotalROAS = this.calculateWeightedROAS(campaigns, campaigns)
    const projectedTotalROAS = this.calculateWeightedROAS(
      campaigns,
      optimizedAllocation.map((a) => ({
        ...campaigns.find((c) => c.id === a.campaignId)!,
        currentBudget: a.recommendedBudget,
      }))
    )

    return {
      totalBudget,
      allocations: optimizedAllocation,
      expectedImpact: {
        currentTotalROAS,
        projectedTotalROAS,
        improvement: projectedTotalROAS - currentTotalROAS,
      },
      efficiencyScore,
      diversificationScore,
      recommendations,
    }
  }

  /**
   * Calculate marginal ROAS (incremental ROAS at current spend level)
   *
   * Uses historical data to estimate diminishing returns
   */
  async calculateMarginalROAS(campaignId: string): Promise<number> {
    // Fetch last 14 days of performance data
    const endDate = new Date()
    const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

    const snapshots = await this.kpiRepository.findByCampaignIdAndDateRange(
      campaignId,
      startDate,
      endDate
    )

    if (snapshots.length < 2) {
      // Not enough data for marginal calculation
      const totalSpend = snapshots.reduce((sum, s) => sum + s.spend.amount, 0)
      const totalRevenue = snapshots.reduce((sum, s) => sum + s.revenue.amount, 0)
      return totalSpend > 0 ? totalRevenue / totalSpend : 0
    }

    // Calculate marginal ROAS using last 7 days vs previous 7 days
    const midpoint = Math.floor(snapshots.length / 2)
    const firstHalf = snapshots.slice(0, midpoint)
    const secondHalf = snapshots.slice(midpoint)

    const spend1 = firstHalf.reduce((sum, s) => sum + s.spend.amount, 0)
    const revenue1 = firstHalf.reduce((sum, s) => sum + s.revenue.amount, 0)
    const spend2 = secondHalf.reduce((sum, s) => sum + s.spend.amount, 0)
    const revenue2 = secondHalf.reduce((sum, s) => sum + s.revenue.amount, 0)

    const spendDelta = spend2 - spend1
    const revenueDelta = revenue2 - revenue1

    // Marginal ROAS = delta revenue / delta spend
    if (spendDelta === 0) {
      // No change in spend, return average ROAS
      const totalSpend = spend1 + spend2
      const totalRevenue = revenue1 + revenue2
      return totalSpend > 0 ? totalRevenue / totalSpend : 0
    }

    const marginalROAS = revenueDelta / spendDelta

    // Clamp to reasonable range (avoid negative or extreme values)
    return Math.max(0, Math.min(marginalROAS, 10))
  }

  /**
   * Optimize budget allocation across campaigns
   *
   * Uses marginal ROAS to allocate budget proportionally
   * Higher marginal ROAS = more budget
   */
  optimizeAllocation(
    totalBudget: number,
    campaigns: (CampaignPerformance & { marginalROAS: number })[]
  ): CampaignAllocation[] {
    // Filter out campaigns with marginal ROAS <= 0 (saturated or negative)
    const viableCampaigns = campaigns.filter((c) => c.marginalROAS > 0)

    if (viableCampaigns.length === 0) {
      // All campaigns saturated, maintain current allocation
      return campaigns.map((c) => ({
        campaignId: c.id,
        campaignName: c.name,
        objective: c.objective,
        currentBudget: c.currentBudget,
        recommendedBudget: c.currentBudget,
        changePercent: 0,
        metrics: {
          roas: c.roas,
          cpa: c.cpa,
          marginalROAS: c.marginalROAS,
        },
        reasoning: 'Campaign is at optimal saturation point',
      }))
    }

    // Calculate total marginal efficiency (sum of marginal ROAS / variance)
    const totalMarginalEfficiency = viableCampaigns.reduce(
      (sum, c) => sum + c.marginalROAS / Math.max(c.variance, 0.1),
      0
    )

    // Allocate proportionally to marginal efficiency
    const allocations: CampaignAllocation[] = campaigns.map((campaign) => {
      let recommendedBudget: number

      if (campaign.marginalROAS <= 0) {
        // Reduce budget for saturated/negative campaigns
        recommendedBudget = Math.round(campaign.currentBudget * 0.7)
      } else {
        // Allocate proportionally to marginal ROAS / variance
        const efficiency = campaign.marginalROAS / Math.max(campaign.variance, 0.1)
        const proportion = efficiency / totalMarginalEfficiency
        recommendedBudget = Math.round(totalBudget * proportion)

        // Apply constraints: min 10k, max 2x current
        recommendedBudget = Math.max(10000, recommendedBudget)
        recommendedBudget = Math.min(recommendedBudget, campaign.currentBudget * 2)
      }

      const changePercent =
        campaign.currentBudget > 0
          ? Math.round(((recommendedBudget - campaign.currentBudget) / campaign.currentBudget) * 100)
          : 0

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        objective: campaign.objective,
        currentBudget: campaign.currentBudget,
        recommendedBudget,
        changePercent,
        metrics: {
          roas: campaign.roas,
          cpa: campaign.cpa,
          marginalROAS: campaign.marginalROAS,
        },
        reasoning: this.generateAllocationReasoning(campaign, recommendedBudget, changePercent),
      }
    })

    return allocations
  }

  /**
   * Calculate efficiency frontier (risk-return analysis)
   */
  calculateEfficiencyFrontier(
    campaigns: (CampaignPerformance & { marginalROAS: number })[]
  ): EfficiencyFrontier {
    // Current position: weighted average return and risk
    const currentPosition = {
      return: this.calculateWeightedROAS(campaigns, campaigns),
      risk: this.calculatePortfolioRisk(campaigns, campaigns),
    }

    // Generate frontier points by simulating different allocations
    const points: EfficiencyFrontier['points'] = []

    // Simulate allocations from conservative (low variance) to aggressive (high ROAS)
    for (let risk = 0; risk <= 1; risk += 0.1) {
      const allocation: Record<string, number> = {}
      let totalBudget = 0

      campaigns.forEach((c) => {
        // Weight by (marginalROAS * risk + (1 - risk) / variance)
        const weight = c.marginalROAS * risk + (1 - risk) / Math.max(c.variance, 0.1)
        allocation[c.id] = weight
        totalBudget += weight
      })

      // Normalize
      Object.keys(allocation).forEach((id) => {
        allocation[id] = (allocation[id] / totalBudget) * 100
      })

      // Calculate expected return for this allocation
      const expectedReturn = campaigns.reduce((sum, c) => {
        return sum + (allocation[c.id] / 100) * c.roas
      }, 0)

      points.push({
        risk: risk * 100,
        return: expectedReturn,
        allocation,
      })
    }

    // Find optimal position (max return / risk ratio)
    const optimalPoint = points.reduce((best, point) => {
      const ratio = point.return / Math.max(point.risk, 0.1)
      const bestRatio = best.return / Math.max(best.risk, 0.1)
      return ratio > bestRatio ? point : best
    })

    return {
      points,
      currentPosition,
      optimalPosition: {
        risk: optimalPoint.risk,
        return: optimalPoint.return,
      },
    }
  }

  /**
   * Fetch campaign performance data
   */
  private async fetchCampaignPerformance(userId: string): Promise<CampaignPerformance[]> {
    const campaignsResult = await this.campaignRepository.findByFilters({
      userId,
      status: CampaignStatus.ACTIVE,
    })

    const campaigns = campaignsResult.data
    const endDate = new Date()
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days

    return Promise.all(
      campaigns.map(async (campaign) => {
        const kpiSnapshots = await this.kpiRepository.findByCampaignIdAndDateRange(
          campaign.id,
          startDate,
          endDate
        )

        const totalSpend = kpiSnapshots.reduce((sum, s) => sum + s.spend.amount, 0)
        const totalRevenue = kpiSnapshots.reduce((sum, s) => sum + s.revenue.amount, 0)
        const totalConversions = kpiSnapshots.reduce((sum, s) => sum + s.conversions, 0)

        const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
        const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0

        // Calculate variance (for risk assessment)
        const dailyROAS = kpiSnapshots.map((s) => {
          const spend = s.spend.amount
          const revenue = s.revenue.amount
          return spend > 0 ? revenue / spend : 0
        })

        const avgROAS =
          dailyROAS.reduce((sum, r) => sum + r, 0) / Math.max(dailyROAS.length, 1)
        const variance =
          dailyROAS.reduce((sum, r) => sum + Math.pow(r - avgROAS, 2), 0) /
          Math.max(dailyROAS.length, 1)

        return {
          id: campaign.id,
          name: campaign.name,
          objective: campaign.objective,
          currentBudget: campaign.dailyBudget.amount,
          spend: totalSpend,
          revenue: totalRevenue,
          conversions: totalConversions,
          roas,
          cpa,
          variance: Math.sqrt(variance), // Standard deviation
        }
      })
    )
  }

  /**
   * Calculate weighted portfolio ROAS
   */
  private calculateWeightedROAS(
    allCampaigns: CampaignPerformance[],
    allocation: CampaignPerformance[]
  ): number {
    const totalBudget = allocation.reduce((sum, c) => sum + c.currentBudget, 0)
    if (totalBudget === 0) return 0

    return allocation.reduce((sum, campaign) => {
      const weight = campaign.currentBudget / totalBudget
      const campaignData = allCampaigns.find((c) => c.id === campaign.id)
      return sum + weight * (campaignData?.roas || 0)
    }, 0)
  }

  /**
   * Calculate portfolio risk (weighted standard deviation)
   */
  private calculatePortfolioRisk(
    allCampaigns: CampaignPerformance[],
    allocation: CampaignPerformance[]
  ): number {
    const totalBudget = allocation.reduce((sum, c) => sum + c.currentBudget, 0)
    if (totalBudget === 0) return 0

    return allocation.reduce((sum, campaign) => {
      const weight = campaign.currentBudget / totalBudget
      const campaignData = allCampaigns.find((c) => c.id === campaign.id)
      return sum + weight * (campaignData?.variance || 0)
    }, 0)
  }

  /**
   * Calculate diversification score (0-100)
   *
   * Based on:
   * - Objective diversity (multiple objectives is better)
   * - Budget concentration (even distribution is better)
   */
  private calculateDiversificationScore(campaigns: CampaignPerformance[]): number {
    if (campaigns.length === 0) return 0

    // Objective diversity (max 50 points)
    const objectives = new Set(campaigns.map((c) => c.objective))
    const objectiveScore = Math.min((objectives.size / 4) * 50, 50) // Max 4 objectives

    // Budget concentration (max 50 points)
    const totalBudget = campaigns.reduce((sum, c) => sum + c.currentBudget, 0)
    const budgetShares = campaigns.map((c) => c.currentBudget / totalBudget)

    // Calculate Herfindahl-Hirschman Index (lower is more diverse)
    const hhi = budgetShares.reduce((sum, share) => sum + Math.pow(share, 2), 0)

    // Convert to score (1/n = perfectly diverse, 1 = monopoly)
    const perfectHHI = 1 / campaigns.length
    const concentrationScore = Math.max(0, 1 - (hhi - perfectHHI) / (1 - perfectHHI)) * 50

    return Math.round(objectiveScore + concentrationScore)
  }

  /**
   * Calculate efficiency score (0-100)
   *
   * Based on how well budget is allocated relative to marginal ROAS
   */
  private calculateEfficiencyScore(
    campaigns: (CampaignPerformance & { marginalROAS: number })[]
  ): number {
    if (campaigns.length === 0) return 0

    const totalBudget = campaigns.reduce((sum, c) => sum + c.currentBudget, 0)
    if (totalBudget === 0) return 0

    // Calculate optimal allocation (proportional to marginal ROAS)
    const totalMarginalROAS = campaigns.reduce((sum, c) => sum + Math.max(c.marginalROAS, 0), 0)
    if (totalMarginalROAS === 0) return 50 // Neutral if no positive marginal ROAS

    // Calculate efficiency: sum of (actual_share * marginal_roas)
    const efficiency = campaigns.reduce((sum, campaign) => {
      const actualShare = campaign.currentBudget / totalBudget
      const optimalShare = Math.max(campaign.marginalROAS, 0) / totalMarginalROAS
      const alignment = 1 - Math.abs(actualShare - optimalShare)
      return sum + alignment * campaign.marginalROAS
    }, 0)

    // Normalize to 0-100
    return Math.round(Math.min(100, (efficiency / totalMarginalROAS) * 100))
  }

  /**
   * Generate allocation reasoning
   */
  private generateAllocationReasoning(
    campaign: CampaignPerformance & { marginalROAS: number },
    recommendedBudget: number,
    changePercent: number
  ): string {
    if (changePercent > 10) {
      return `High marginal ROAS (${campaign.marginalROAS.toFixed(2)}x) indicates room for growth. Increase budget to capture more efficient conversions.`
    } else if (changePercent < -10) {
      return `Marginal ROAS (${campaign.marginalROAS.toFixed(2)}x) declining. Reduce budget and reinvest in higher-performing campaigns.`
    } else {
      return `Campaign performing at optimal saturation point. Maintain current budget level.`
    }
  }

  /**
   * Generate portfolio recommendations
   */
  private generateRecommendations(
    campaigns: (CampaignPerformance & { marginalROAS: number })[],
    allocations: CampaignAllocation[],
    diversificationScore: number
  ): string[] {
    const recommendations: string[] = []

    // Check for over-concentration
    const maxAllocation = Math.max(...allocations.map((a) => a.recommendedBudget))
    const totalBudget = allocations.reduce((sum, a) => sum + a.recommendedBudget, 0)
    const maxShare = maxAllocation / totalBudget

    if (maxShare > 0.7) {
      recommendations.push(
        'Portfolio is heavily concentrated in one campaign. Consider diversifying to reduce risk.'
      )
    }

    // Check for low diversification
    if (diversificationScore < 40) {
      recommendations.push(
        'Low diversification score. Consider adding campaigns with different objectives.'
      )
    }

    // Check for saturated campaigns
    const saturatedCampaigns = campaigns.filter((c) => c.marginalROAS < 1.0)
    if (saturatedCampaigns.length > 0) {
      recommendations.push(
        `${saturatedCampaigns.length} campaign(s) showing diminishing returns. Consider creative refresh or audience expansion.`
      )
    }

    // Check for high-variance campaigns
    const highVarianceCampaigns = campaigns.filter((c) => c.variance > 1.5)
    if (highVarianceCampaigns.length > 0) {
      recommendations.push(
        `${highVarianceCampaigns.length} campaign(s) with high performance volatility. Stabilize with refined targeting.`
      )
    }

    // Check for underutilized campaigns
    const underutilized = allocations.filter((a) => a.changePercent > 30)
    if (underutilized.length > 0) {
      recommendations.push(
        `${underutilized.length} campaign(s) have room for significant budget increase based on strong marginal returns.`
      )
    }

    return recommendations.slice(0, 5) // Max 5 recommendations
  }
}
