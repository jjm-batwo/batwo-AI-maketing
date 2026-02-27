/**
 * Meta 광고 계정 상태 헬퍼 유틸리티
 *
 * Meta API account_status 값을 한국어 라벨, 색상, 활성 여부로 매핑.
 * @see https://developers.facebook.com/docs/marketing-api/reference/ad-account/
 */

interface AccountStatusInfo {
  label: string
  color: string // Tailwind 색상 클래스
  dotColor: string // 상태 점 색상 클래스
}

const STATUS_MAP: Record<number, AccountStatusInfo> = {
  1: { label: '운영 중', color: 'text-green-700 dark:text-green-400', dotColor: 'bg-green-500' },
  2: { label: '비활성', color: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500' },
  3: { label: '미결제', color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
  7: { label: '검토 중', color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
  8: { label: '정산 대기', color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
  9: { label: '유예 기간', color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
  100: { label: '폐쇄 예정', color: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500' },
  101: { label: '폐쇄됨', color: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500' },
  201: { label: '활성', color: 'text-green-700 dark:text-green-400', dotColor: 'bg-green-500' },
  202: { label: '폐쇄', color: 'text-red-600 dark:text-red-400', dotColor: 'bg-red-500' },
}

const UNKNOWN_STATUS: AccountStatusInfo = {
  label: '알 수 없음',
  color: 'text-muted-foreground',
  dotColor: 'bg-gray-400',
}

/** 상태 코드 → 한국어 라벨 */
export function getStatusLabel(status: number): string {
  return (STATUS_MAP[status] ?? UNKNOWN_STATUS).label
}

/** 상태 코드 → Tailwind 텍스트 색상 클래스 */
export function getStatusColor(status: number): string {
  return (STATUS_MAP[status] ?? UNKNOWN_STATUS).color
}

/** 상태 코드 → Tailwind 점 색상 클래스 */
export function getStatusDotColor(status: number): string {
  return (STATUS_MAP[status] ?? UNKNOWN_STATUS).dotColor
}

/** 활성 계정 여부 (status 1 또는 201) */
export function isActiveAccount(status: number): boolean {
  return status === 1 || status === 201
}

/** 계정 목록을 활성 우선으로 정렬 */
export function sortByStatus<T extends { accountStatus: number }>(accounts: T[]): T[] {
  return [...accounts].sort((a, b) => {
    const aActive = isActiveAccount(a.accountStatus) ? 0 : 1
    const bActive = isActiveAccount(b.accountStatus) ? 0 : 1
    return aActive - bActive
  })
}
