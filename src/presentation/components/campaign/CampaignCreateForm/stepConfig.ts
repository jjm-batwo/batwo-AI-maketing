import type { CampaignMode, ExtendedCampaignFormData } from './types'

export interface StepDefinition {
  key: string
  title: string
  validationFields: (keyof ExtendedCampaignFormData)[]
}

// Advantage+ 모드: 4단계
const advantageSteps: StepDefinition[] = [
  {
    key: 'campaign-type',
    title: '캠페인 유형',
    validationFields: ['name', 'objective', 'campaignMode'],
  },
  {
    key: 'budget',
    title: '예산 & 일정',
    validationFields: ['dailyBudget', 'startDate'],
  },
  {
    key: 'creative',
    title: '크리에이티브',
    validationFields: ['creative'],
  },
  {
    key: 'review',
    title: '검토 & 제출',
    validationFields: [],
  },
]

// 수동 모드: 6단계
const manualSteps: StepDefinition[] = [
  {
    key: 'campaign-type',
    title: '캠페인 유형',
    validationFields: ['name', 'objective', 'campaignMode'],
  },
  {
    key: 'target-audience',
    title: '타겟 오디언스',
    validationFields: ['targetAudience'],
  },
  {
    key: 'budget',
    title: '예산 & 일정',
    validationFields: ['dailyBudget', 'startDate'],
  },
  {
    key: 'adset-config',
    title: '광고 세트 설정',
    validationFields: ['adSetConfig'],
  },
  {
    key: 'creative',
    title: '크리에이티브',
    validationFields: ['creative'],
  },
  {
    key: 'review',
    title: '검토 & 제출',
    validationFields: [],
  },
]

export function getStepsForMode(mode: CampaignMode): StepDefinition[] {
  return mode === 'ADVANTAGE_PLUS' ? advantageSteps : manualSteps
}

export function getTotalSteps(mode: CampaignMode): number {
  return getStepsForMode(mode).length
}
