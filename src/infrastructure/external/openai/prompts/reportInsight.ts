import type { GenerateReportInsightInput } from '@application/ports/IAIService'

export function buildReportInsightPrompt(
  input: GenerateReportInsightInput
): string {
  const { reportType, campaignSummaries, comparisonPeriod } = input

  const campaignDetails = campaignSummaries
    .map(
      (c) => `
Campaign: ${c.name} (${c.objective})
- Impressions: ${c.metrics.impressions.toLocaleString()}
- Clicks: ${c.metrics.clicks.toLocaleString()}
- Conversions: ${c.metrics.conversions.toLocaleString()}
- Spend: ₩${c.metrics.spend.toLocaleString()}
- Revenue: ₩${c.metrics.revenue.toLocaleString()}
- ROAS: ${(c.metrics.revenue / c.metrics.spend).toFixed(2)}x
- CTR: ${((c.metrics.clicks / c.metrics.impressions) * 100).toFixed(2)}%`
    )
    .join('\n')

  const comparisonText = comparisonPeriod
    ? `
Previous Period Comparison:
- Impressions: ${comparisonPeriod.previousMetrics.impressions.toLocaleString()}
- Clicks: ${comparisonPeriod.previousMetrics.clicks.toLocaleString()}
- Conversions: ${comparisonPeriod.previousMetrics.conversions.toLocaleString()}
- Spend: ₩${comparisonPeriod.previousMetrics.spend.toLocaleString()}
- Revenue: ₩${comparisonPeriod.previousMetrics.revenue.toLocaleString()}`
    : ''

  return `Generate a ${reportType} performance report insight based on the following campaign data.

${campaignDetails}
${comparisonText}

Provide the report insight in JSON format with the following structure:
{
  "title": "report title",
  "summary": "executive summary of overall performance (2-3 sentences)",
  "keyMetrics": [
    {
      "name": "metric name (ROAS, CPA, CTR, etc.)",
      "value": "formatted value",
      "change": "percentage change from previous period",
      "trend": "up" | "down" | "stable"
    }
  ],
  "recommendations": [
    "actionable recommendation 1",
    "actionable recommendation 2",
    "actionable recommendation 3"
  ]
}

Focus on insights that help business owners understand their marketing performance quickly.`
}

export const REPORT_INSIGHT_SYSTEM_PROMPT = `You are an expert marketing report analyst. Your role is to analyze campaign performance data and generate clear, actionable insights for business owners.

Guidelines:
1. Write in clear, non-technical language
2. Highlight the most important metrics first
3. Calculate and include period-over-period changes when data is available
4. Provide 3-5 key metrics with trends
5. Include 2-4 specific, actionable recommendations
6. Always respond with valid JSON format
7. Use Korean currency formatting (₩) for monetary values`
