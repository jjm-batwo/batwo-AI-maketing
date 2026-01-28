import { z } from 'zod'

/**
 * Budget Recommendation POST body validation
 */
export const budgetRecommendationSchema = z.object({
  industry: z.string().min(1, '업종은 필수입니다'),
  businessScale: z.string().min(1, '사업 규모는 필수입니다'),
  averageOrderValue: z.number().positive().optional(),
  monthlyMarketingBudget: z.number().positive().optional(),
  marginRate: z.number().min(0).max(1).optional(),
  existingCampaignData: z
    .object({
      avgDailySpend: z.number(),
      avgROAS: z.number(),
      avgCPA: z.number(),
      avgAOV: z.number(),
      totalSpend30Days: z.number(),
      totalRevenue30Days: z.number(),
      totalPurchases30Days: z.number(),
    })
    .optional(),
})

/**
 * AI Chat POST body validation
 */
export const chatSchema = z.object({
  message: z
    .string()
    .min(1, '메시지는 필수입니다')
    .max(1000, '메시지는 1000자를 초과할 수 없습니다'),
  conversationId: z.string().uuid().optional(),
})

/**
 * AI Competitors GET query parameters validation
 */
export const competitorsQuerySchema = z.object({
  keywords: z.string().min(1, '키워드는 필수입니다'),
  countries: z.string().default('KR'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  industry: z.string().optional(),
})

/**
 * AI Competitors POST body validation
 */
export const competitorsTrackingSchema = z.object({
  pageIds: z.array(z.string()).min(1, '최소 1개의 페이지 ID가 필요합니다'),
  industry: z.string().optional(),
})

/**
 * Portfolio Optimization POST body validation
 */
export const portfolioSimulationSchema = z.object({
  totalBudget: z
    .number()
    .positive('총 예산은 0보다 커야 합니다')
    .max(1000000000, '예산이 너무 큽니다'),
})

export type BudgetRecommendationInput = z.infer<typeof budgetRecommendationSchema>
export type ChatInput = z.infer<typeof chatSchema>
export type CompetitorsQueryParams = z.infer<typeof competitorsQuerySchema>
export type CompetitorsTrackingInput = z.infer<typeof competitorsTrackingSchema>
export type PortfolioSimulationInput = z.infer<typeof portfolioSimulationSchema>
