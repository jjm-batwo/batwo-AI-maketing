export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export const CAMPAIGN_STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  [CampaignStatus.DRAFT]: [CampaignStatus.PENDING_REVIEW],
  [CampaignStatus.PENDING_REVIEW]: [CampaignStatus.ACTIVE, CampaignStatus.REJECTED],
  [CampaignStatus.ACTIVE]: [CampaignStatus.PAUSED, CampaignStatus.COMPLETED],
  [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED],
  [CampaignStatus.COMPLETED]: [],
  [CampaignStatus.REJECTED]: [CampaignStatus.DRAFT],
}

export function canTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  return CAMPAIGN_STATUS_TRANSITIONS[from].includes(to)
}

export function isEditableStatus(status: CampaignStatus): boolean {
  return [CampaignStatus.DRAFT, CampaignStatus.PAUSED].includes(status)
}

export function isActiveStatus(status: CampaignStatus): boolean {
  return status === CampaignStatus.ACTIVE
}

export function isTerminalStatus(status: CampaignStatus): boolean {
  return [CampaignStatus.COMPLETED, CampaignStatus.REJECTED].includes(status)
}
