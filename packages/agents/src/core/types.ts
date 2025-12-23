/**
 * 에이전트 공통 타입 정의
 */

export interface AgentConfig {
  name: string;
  description: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    tokensUsed: number;
    duration: number;
    model: string;
  };
}

export interface BusinessInfo {
  name: string;
  industry: string;
  description: string;
  targetAudience?: string;
  uniqueSellingPoints?: string[];
}

export interface TargetingSpec {
  demographics: {
    ageMin: number;
    ageMax: number;
    genders: ('male' | 'female' | 'all')[];
  };
  interests: string[];
  behaviors: string[];
  locations: string[];
}

export interface BudgetAllocation {
  dailyBudget: number;
  bidStrategy: 'LOWEST_COST' | 'COST_CAP' | 'BID_CAP';
  suggestedDuration: number;
}

export interface CampaignObjective {
  type: 'AWARENESS' | 'TRAFFIC' | 'CONVERSIONS';
  description: string;
}

export interface MetaCampaignJSON {
  campaign: {
    name: string;
    objective: string;
    status: string;
    specialAdCategories?: string[];
  };
  adSets: Array<{
    name: string;
    targeting: TargetingSpec;
    dailyBudget: number;
    bidStrategy: string;
    startTime?: string;
    endTime?: string;
  }>;
  ads: Array<{
    name: string;
    creative: {
      title?: string;
      body?: string;
      imageUrl?: string;
      callToAction?: string;
    };
  }>;
}
