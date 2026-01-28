/**
 * Portfolio Optimization API
 *
 * GET: Analyze user's campaign portfolio and get budget allocation recommendations
 * POST: Simulate allocation with custom total budget
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getCampaignRepository, getKPIRepository } from '@/lib/di/container'
import { PortfolioOptimizationService } from '@/application/services/PortfolioOptimizationService'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { portfolioSimulationSchema, validateBody } from '@/lib/validations'
import type { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { checkRateLimit, getClientIp, addRateLimitHeaders, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'

/**
 * Campaign performance with marginal ROAS
 */
interface CampaignPerformanceWithMarginal {
  id: string
  name: string
  objective: CampaignObjective
  currentBudget: number
  spend: number
  revenue: number
  conversions: number
  roas: number
  cpa: number
  variance: number
  marginalROAS: number
}

/**
 * Create portfolio service with repository injection
 */
function createPortfolioService(): PortfolioOptimizationService {
  return new PortfolioOptimizationService(
    getCampaignRepository(),
    getKPIRepository()
  )
}

/**
 * GET /api/ai/portfolio
 *
 * Get portfolio analysis for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return unauthorizedResponse()
    }

    // Rate limiting
    const clientIp = getClientIp(request)
    const rateLimitKey = `${user.id}:${clientIp}`
    const rateLimitResult = await checkRateLimit(rateLimitKey, 'ai')

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    const portfolioService = createPortfolioService()
    const analysis = await portfolioService.analyzePortfolio(user.id)

    const response = NextResponse.json({
      success: true,
      data: analysis,
    })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('[Portfolio API] GET error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze portfolio'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/portfolio
 *
 * Simulate budget allocation with custom total budget
 *
 * Body:
 * {
 *   totalBudget: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return unauthorizedResponse()
    }

    // Rate limiting
    const clientIp = getClientIp(request)
    const rateLimitKey = `${user.id}:${clientIp}`
    const rateLimitResult = await checkRateLimit(rateLimitKey, 'ai')

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    // Validate request body
    const validation = await validateBody(request, portfolioSimulationSchema)
    if (!validation.success) return validation.error

    const { totalBudget } = validation.data

    const portfolioService = createPortfolioService()

    // Fetch current portfolio analysis
    const currentAnalysis = await portfolioService.analyzePortfolio(user.id)

    // Re-optimize with new total budget
    const campaigns = await getCampaignPerformanceWithMarginal(user.id, portfolioService)
    const simulatedAllocation = portfolioService.optimizeAllocation(totalBudget, campaigns)

    // Calculate simulated impact
    const projectedTotalROAS = calculateWeightedROAS(campaigns, simulatedAllocation)
    const currentTotalROAS = currentAnalysis.expectedImpact.currentTotalROAS

    const response = NextResponse.json({
      success: true,
      data: {
        totalBudget,
        allocations: simulatedAllocation,
        expectedImpact: {
          currentTotalROAS,
          projectedTotalROAS,
          improvement: projectedTotalROAS - currentTotalROAS,
        },
        comparison: {
          currentBudget: currentAnalysis.totalBudget,
          newBudget: totalBudget,
          budgetChange: totalBudget - currentAnalysis.totalBudget,
          budgetChangePercent:
            currentAnalysis.totalBudget > 0
              ? Math.round(
                  ((totalBudget - currentAnalysis.totalBudget) / currentAnalysis.totalBudget) * 100
                )
              : 0,
        },
      },
    })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('[Portfolio API] POST error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to simulate allocation'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

/**
 * Helper: Fetch campaign performance with marginal ROAS
 */
async function getCampaignPerformanceWithMarginal(
  userId: string,
  portfolioService: PortfolioOptimizationService
): Promise<CampaignPerformanceWithMarginal[]> {
  const campaignRepository = getCampaignRepository()
  const kpiRepository = getKPIRepository()

  const campaignsResult = await campaignRepository.findByFilters({
    userId,
    status: CampaignStatus.ACTIVE,
  })

  const campaigns = campaignsResult.data
  const endDate = new Date()
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  return Promise.all(
    campaigns.map(async (campaign) => {
      const kpiSnapshots = await kpiRepository.findByCampaignIdAndDateRange(
        campaign.id,
        startDate,
        endDate
      )

      const totalSpend = kpiSnapshots.reduce((sum, s) => sum + s.spend.amount, 0)
      const totalRevenue = kpiSnapshots.reduce((sum, s) => sum + s.revenue.amount, 0)
      const totalConversions = kpiSnapshots.reduce((sum, s) => sum + s.conversions, 0)

      const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0
      const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0

      // Calculate variance
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

      // Calculate marginal ROAS
      const marginalROAS = await portfolioService.calculateMarginalROAS(campaign.id)

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
        variance: Math.sqrt(variance),
        marginalROAS,
      }
    })
  )
}

/**
 * Helper: Calculate weighted ROAS
 */
function calculateWeightedROAS(
  campaigns: Array<{ id: string; roas: number }>,
  allocations: Array<{ campaignId: string; recommendedBudget: number }>
): number {
  const totalBudget = allocations.reduce((sum, a) => sum + a.recommendedBudget, 0)
  if (totalBudget === 0) return 0

  return allocations.reduce((sum, allocation) => {
    const campaign = campaigns.find((c) => c.id === allocation.campaignId)
    if (!campaign) return sum

    const weight = allocation.recommendedBudget / totalBudget
    return sum + weight * campaign.roas
  }, 0)
}
