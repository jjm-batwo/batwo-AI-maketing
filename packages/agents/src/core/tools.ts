/**
 * LangGraph 에이전트용 공통 도구 정의
 */

import { z } from 'zod';

/**
 * 도구 정의 인터페이스
 */
export interface ToolDefinition<TInput extends z.ZodType, TOutput> {
  name: string;
  description: string;
  inputSchema: TInput;
  execute: (input: z.infer<TInput>) => Promise<TOutput>;
}

/**
 * 도구 생성 헬퍼 함수
 */
export function defineTool<TInput extends z.ZodType, TOutput>(
  definition: ToolDefinition<TInput, TOutput>
): ToolDefinition<TInput, TOutput> {
  return definition;
}

// ============================================================================
// Meta Ads 관련 도구 스키마 (실제 API 호출은 BE-003에서 구현)
// ============================================================================

export const MetaAdsSearchInterestsInputSchema = z.object({
  query: z.string().describe('관심사 검색어'),
  limit: z.number().default(25).describe('최대 결과 수'),
});

export const MetaAdsSearchInterestsOutputSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    audienceSize: z.number().optional(),
    path: z.array(z.string()).optional(),
  })
);

export const MetaAdsGetDemographicsInputSchema = z.object({
  demographicClass: z
    .enum(['demographics', 'life_events', 'industries', 'income', 'family_statuses'])
    .default('demographics'),
  limit: z.number().default(50),
});

export const MetaAdsEstimateAudienceInputSchema = z.object({
  accountId: z.string().describe('광고 계정 ID'),
  targeting: z.object({
    ageMin: z.number().optional(),
    ageMax: z.number().optional(),
    genders: z.array(z.number()).optional(),
    geoLocations: z.object({
      countries: z.array(z.string()).optional(),
      regions: z.array(z.object({ key: z.string() })).optional(),
    }).optional(),
    interests: z.array(z.object({ id: z.string() })).optional(),
    behaviors: z.array(z.object({ id: z.string() })).optional(),
  }),
});

export const MetaAdsEstimateAudienceOutputSchema = z.object({
  estimatedAudienceSize: z.number(),
  lowerBound: z.number().optional(),
  upperBound: z.number().optional(),
});

// ============================================================================
// 도구 타입 정의
// ============================================================================

export type MetaAdsSearchInterestsInput = z.infer<typeof MetaAdsSearchInterestsInputSchema>;
export type MetaAdsSearchInterestsOutput = z.infer<typeof MetaAdsSearchInterestsOutputSchema>;
export type MetaAdsGetDemographicsInput = z.infer<typeof MetaAdsGetDemographicsInputSchema>;
export type MetaAdsEstimateAudienceInput = z.infer<typeof MetaAdsEstimateAudienceInputSchema>;
export type MetaAdsEstimateAudienceOutput = z.infer<typeof MetaAdsEstimateAudienceOutputSchema>;

// ============================================================================
// 도구 레지스트리
// ============================================================================

export interface ToolRegistry {
  tools: Map<string, ToolDefinition<z.ZodType, unknown>>;
  register<TInput extends z.ZodType, TOutput>(
    tool: ToolDefinition<TInput, TOutput>
  ): void;
  get(name: string): ToolDefinition<z.ZodType, unknown> | undefined;
  getAll(): ToolDefinition<z.ZodType, unknown>[];
}

export function createToolRegistry(): ToolRegistry {
  const tools = new Map<string, ToolDefinition<z.ZodType, unknown>>();

  return {
    tools,
    register<TInput extends z.ZodType, TOutput>(
      tool: ToolDefinition<TInput, TOutput>
    ): void {
      tools.set(tool.name, tool as unknown as ToolDefinition<z.ZodType, unknown>);
    },
    get(name: string): ToolDefinition<z.ZodType, unknown> | undefined {
      return tools.get(name);
    },
    getAll(): ToolDefinition<z.ZodType, unknown>[] {
      return Array.from(tools.values());
    },
  };
}

// 전역 도구 레지스트리
export const globalToolRegistry = createToolRegistry();
