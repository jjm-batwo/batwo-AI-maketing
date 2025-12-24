import type { GenerateOptimizationInput } from '@application/ports/IAIService'

export function buildCampaignOptimizationPrompt(
  input: GenerateOptimizationInput
): string {
  const {
    campaignName,
    objective,
    currentMetrics,
    targetAudience,
  } = input

  const audienceInfo = targetAudience
    ? `
Target Audience:
- Age Range: ${targetAudience.ageRange || 'Not specified'}
- Interests: ${targetAudience.interests?.join(', ') || 'Not specified'}
- Locations: ${targetAudience.locations?.join(', ') || 'Not specified'}`
    : ''

  return `Analyze the following campaign performance and provide optimization suggestions.

Campaign: ${campaignName}
Objective: ${objective}

Current Performance Metrics:
- ROAS: ${currentMetrics.roas.toFixed(2)}x
- CPA: ₩${currentMetrics.cpa.toLocaleString()}
- CTR: ${currentMetrics.ctr.toFixed(2)}%
- Impressions: ${currentMetrics.impressions.toLocaleString()}
- Clicks: ${currentMetrics.clicks.toLocaleString()}
- Conversions: ${currentMetrics.conversions.toLocaleString()}
- Spend: ₩${currentMetrics.spend.toLocaleString()}
${audienceInfo}

Provide 2-4 optimization suggestions in JSON array format with the following structure:
[
  {
    "category": "budget" | "targeting" | "creative" | "timing",
    "priority": "high" | "medium" | "low",
    "suggestion": "specific actionable recommendation",
    "expectedImpact": "quantified expected outcome",
    "rationale": "data-driven reasoning"
  }
]

Focus on actionable, specific recommendations based on the metrics provided. Consider Korean market best practices.`
}

export const CAMPAIGN_OPTIMIZATION_SYSTEM_PROMPT = `You are an expert digital marketing analyst specializing in Meta Ads campaign optimization. Your role is to analyze campaign performance data and provide actionable optimization suggestions.

Guidelines:
1. Prioritize high-impact, low-effort optimizations
2. Base all suggestions on the provided metrics
3. Consider the campaign objective when making recommendations
4. Provide specific, quantified expected impacts when possible
5. Always respond with valid JSON array format
6. Focus on practical Korean market strategies`
