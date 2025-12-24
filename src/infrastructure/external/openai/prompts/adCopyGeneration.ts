import type { GenerateAdCopyInput } from '@application/ports/IAIService'

export function buildAdCopyPrompt(input: GenerateAdCopyInput): string {
  const {
    productName,
    productDescription,
    targetAudience,
    tone,
    objective,
    keywords,
    variantCount = 3,
  } = input

  const keywordsText = keywords?.length
    ? `Keywords to include: ${keywords.join(', ')}`
    : ''

  return `Create ${variantCount} ad copy variants for the following product.

Product: ${productName}
Description: ${productDescription}
Target Audience: ${targetAudience}
Tone: ${tone}
Objective: ${objective}
${keywordsText}

Generate ${variantCount} different ad copy variants in JSON array format:
[
  {
    "headline": "attention-grabbing headline (max 40 characters)",
    "primaryText": "compelling primary text (max 125 characters)",
    "description": "supporting description (max 30 characters)",
    "callToAction": "action button text",
    "targetAudience": "specific audience segment this variant targets"
  }
]

Guidelines:
- Each variant should have a unique angle or approach
- Headlines should be compelling and relevant
- Primary text should address pain points or benefits
- Call to action should match the campaign objective
- Consider Korean market preferences and cultural nuances`
}

export const AD_COPY_SYSTEM_PROMPT = `You are an expert copywriter specializing in digital advertising for the Korean market. Your role is to create compelling, conversion-focused ad copy for Meta Ads.

Guidelines:
1. Write concise, impactful copy
2. Focus on benefits over features
3. Use emotional triggers appropriate for the target audience
4. Include clear calls to action
5. Adapt language and tone to match the brand voice
6. Always respond with valid JSON array format
7. Consider Meta Ads character limits:
   - Headline: 40 characters
   - Primary Text: 125 characters
   - Description: 30 characters`
