export enum AdStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DELETED = 'DELETED',
}

// 허용된 상태 전이 맵
const VALID_TRANSITIONS: Record<AdStatus, AdStatus[]> = {
  [AdStatus.DRAFT]: [AdStatus.ACTIVE, AdStatus.DELETED],
  [AdStatus.ACTIVE]: [AdStatus.PAUSED, AdStatus.DELETED],
  [AdStatus.PAUSED]: [AdStatus.ACTIVE, AdStatus.DELETED],
  [AdStatus.DELETED]: [],
}

export function canAdTransition(from: AdStatus, to: AdStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}
