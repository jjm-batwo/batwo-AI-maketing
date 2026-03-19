// src/domain/value-objects/AdCopyTypes.ts
// Domain-level types for ad copy generation, extracted from IAIService port

export interface AdCopyVariant {
  headline: string
  primaryText: string
  description: string
  callToAction: string
  targetAudience: string
}

export interface GenerateAdCopyInput {
  productName: string
  productDescription: string
  targetAudience: string
  tone: 'professional' | 'casual' | 'playful' | 'urgent'
  objective: 'awareness' | 'consideration' | 'conversion'
  keywords?: string[]
  variantCount?: number
  /** 과학 기반 마케팅 지식 컨텍스트 (자동 주입) */
  scienceContext?: string
}
