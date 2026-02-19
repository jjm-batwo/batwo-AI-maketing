import { CreativeFormat } from '@domain/value-objects/CreativeFormat'
import { CTAType } from '@domain/value-objects/CTAType'
import { OptimizationGoal } from '@domain/value-objects/OptimizationGoal'
import { BidStrategy } from '@domain/value-objects/BidStrategy'
import { BillingEvent } from '@domain/value-objects/BillingEvent'

// 캠페인 모드
export type CampaignMode = 'ADVANTAGE_PLUS' | 'MANUAL'

// 크리에이티브 폼 데이터
export interface CreativeFormData {
  name: string
  format: CreativeFormat
  primaryText: string
  headline: string
  description: string
  callToAction: CTAType
  linkUrl: string
  assetIds: string[]
}

// 광고 세트 폼 데이터 (수동 모드)
export interface AdSetFormData {
  name: string
  optimizationGoal: OptimizationGoal
  bidStrategy: BidStrategy
  billingEvent: BillingEvent
  placements: 'AUTOMATIC' | 'MANUAL'
}

// 업로드된 에셋 정보
export interface UploadedAsset {
  id: string
  fileName: string
  blobUrl: string
  type: 'IMAGE' | 'VIDEO'
  width?: number
  height?: number
}

// 확장된 캠페인 폼 데이터 (기존 CampaignFormData 확장)
export interface ExtendedCampaignFormData {
  // 기존 필드
  name: string
  objective: 'TRAFFIC' | 'CONVERSIONS' | 'BRAND_AWARENESS' | 'REACH' | 'ENGAGEMENT'
  targetAudience: {
    ageMin: number
    ageMax: number
    gender: 'ALL' | 'MALE' | 'FEMALE'
    locations: string[]
    interests: string[]
  }
  dailyBudget: number
  currency: 'KRW' | 'USD'
  startDate: string
  endDate?: string

  // 신규 필드
  campaignMode: CampaignMode
  creative: CreativeFormData
  adSetConfig: AdSetFormData
}

// 마법사 제출 진행 상태
export type WizardSubmitStage =
  | 'idle'
  | 'creating-campaign'
  | 'uploading-assets'
  | 'creating-creative'
  | 'creating-ad'
  | 'done'
  | 'error'
