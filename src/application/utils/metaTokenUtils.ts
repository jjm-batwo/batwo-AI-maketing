/**
 * Meta API 토큰 만료 관련 유틸리티
 *
 * Meta long-lived token은 60일 유효.
 * 자동 갱신은 P1 스코프이므로, 현재는 만료 감지 + 사전 경고까지만 구현.
 */

/**
 * 토큰이 이미 만료되었는지 확인
 */
export function isTokenExpired(tokenExpiry: Date | null): boolean {
  if (!tokenExpiry) return false
  return tokenExpiry < new Date()
}

/**
 * 토큰이 곧 만료되는지 확인 (기본 24시간 전)
 */
export function isTokenExpiringSoon(
  tokenExpiry: Date | null,
  hoursBeforeExpiry = 24
): boolean {
  if (!tokenExpiry) return false
  const threshold = new Date(Date.now() + hoursBeforeExpiry * 60 * 60 * 1000)
  return tokenExpiry < threshold
}

/**
 * 토큰 만료까지 남은 시간(시간 단위) 반환
 * 이미 만료된 경우 음수 반환, tokenExpiry가 null이면 null 반환
 */
export function getTokenRemainingHours(tokenExpiry: Date | null): number | null {
  if (!tokenExpiry) return null
  const remainingMs = tokenExpiry.getTime() - Date.now()
  return Math.round(remainingMs / (60 * 60 * 1000))
}
