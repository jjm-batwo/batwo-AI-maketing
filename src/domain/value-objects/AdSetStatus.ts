// 광고 세트 상태 열거형
export enum AdSetStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DELETED = 'DELETED',
  ARCHIVED = 'ARCHIVED',
}

// 허용된 상태 전이 맵
export const ADSET_STATUS_TRANSITIONS: Record<AdSetStatus, AdSetStatus[]> = {
  [AdSetStatus.DRAFT]: [AdSetStatus.ACTIVE, AdSetStatus.DELETED],
  [AdSetStatus.ACTIVE]: [AdSetStatus.PAUSED, AdSetStatus.ARCHIVED],
  [AdSetStatus.PAUSED]: [AdSetStatus.ACTIVE, AdSetStatus.ARCHIVED],
  [AdSetStatus.DELETED]: [],
  [AdSetStatus.ARCHIVED]: [],
}

export function canAdSetTransition(from: AdSetStatus, to: AdSetStatus): boolean {
  return ADSET_STATUS_TRANSITIONS[from].includes(to)
}

export function isAdSetTerminalStatus(status: AdSetStatus): boolean {
  return [AdSetStatus.DELETED, AdSetStatus.ARCHIVED].includes(status)
}
