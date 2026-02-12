import { NextRequest } from 'next/server'

/**
 * CSRF 보호를 위한 검증 함수
 *
 * POST, PUT, DELETE, PATCH 요청에 대해 X-Requested-With 헤더를 검증합니다.
 * 이 헤더는 CORS 정책에 의해 cross-origin 요청에서 추가할 수 없으므로,
 * 동일 출처(same-origin) 요청임을 보장합니다.
 *
 * @param request - NextRequest 객체
 * @returns 검증 성공 시 true, 실패 시 false
 */
export function validateCSRF(request: NextRequest): boolean {
  // GET, HEAD, OPTIONS는 읽기 전용이므로 CSRF 위험이 낮음
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true
  }

  // 변경(mutation) 요청은 커스텀 헤더 검증 필수
  const xRequestedWith = request.headers.get('X-Requested-With')
  return xRequestedWith === 'XMLHttpRequest'
}
