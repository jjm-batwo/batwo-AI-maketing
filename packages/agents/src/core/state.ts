import { z } from 'zod';

/**
 * 캠페인 세팅 상태 스키마
 * LangGraph StateGraph에서 사용되는 공유 상태
 */
export const CampaignSetupStateSchema = z.object({
  // 입력
  businessInfo: z.object({
    name: z.string(),
    industry: z.string(),
    description: z.string(),
    targetAudience: z.string().optional(),
    uniqueSellingPoints: z.array(z.string()).optional(),
  }),
  budget: z.number().positive(),
  objective: z.enum(['AWARENESS', 'TRAFFIC', 'CONVERSIONS']),

  // 중간 결과
  businessAnalysis: z
    .object({
      industryInsights: z.string(),
      targetMarket: z.string(),
      competitiveAdvantages: z.array(z.string()),
    })
    .optional(),

  targetingRecommendation: z
    .object({
      demographics: z.object({
        ageMin: z.number(),
        ageMax: z.number(),
        genders: z.array(z.enum(['male', 'female', 'all'])),
      }),
      interests: z.array(z.string()),
      behaviors: z.array(z.string()),
      locations: z.array(z.string()),
    })
    .optional(),

  budgetAllocation: z
    .object({
      dailyBudget: z.number(),
      bidStrategy: z.enum(['LOWEST_COST', 'COST_CAP', 'BID_CAP']),
      suggestedDuration: z.number(),
    })
    .optional(),

  // 최종 출력
  campaignStructure: z
    .object({
      campaign: z.object({
        name: z.string(),
        objective: z.string(),
        status: z.string(),
      }),
      adSets: z.array(z.unknown()),
      ads: z.array(z.unknown()),
    })
    .optional(),

  // 메타데이터
  errors: z.array(z.string()).default([]),
  currentStep: z.string().default('init'),
});

export type CampaignSetupState = z.infer<typeof CampaignSetupStateSchema>;

/**
 * 에이전트 실행 로그 스키마
 */
export const AgentExecutionLogSchema = z.object({
  id: z.string(),
  agentType: z.string(),
  userId: z.string(),
  input: z.unknown(),
  output: z.unknown().optional(),
  status: z.enum(['running', 'completed', 'failed']),
  tokensUsed: z.number().default(0),
  duration: z.number().optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export type AgentExecutionLog = z.infer<typeof AgentExecutionLogSchema>;
