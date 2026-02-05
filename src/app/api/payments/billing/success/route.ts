import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/payments/billing/success
 * Toss 결제 인증 성공 콜백 처리
 *
 * Toss 팝업에서 리다이렉트되는 엔드포인트
 * 성공 시 체크아웃 완료 페이지로 리다이렉트
 */
export async function GET(request: NextRequest) {
  try {
    // 1. URL 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams
    const authKey = searchParams.get('authKey')
    const customerKey = searchParams.get('customerKey')

    // 2. 필수 파라미터 검증
    if (!authKey || !customerKey) {
      console.error('결제 인증 성공 콜백: 필수 파라미터 누락', { authKey, customerKey })
      const failUrl = new URL('/checkout/fail', request.url)
      failUrl.searchParams.set('code', 'INVALID_CALLBACK')
      failUrl.searchParams.set('message', '잘못된 콜백 요청입니다')
      return NextResponse.redirect(failUrl)
    }

    // 3. 체크아웃 완료 페이지로 리다이렉트
    const completeUrl = new URL('/checkout/complete', request.url)
    completeUrl.searchParams.set('authKey', authKey)
    completeUrl.searchParams.set('customerKey', customerKey)

    return NextResponse.redirect(completeUrl)
  } catch (error) {
    console.error('결제 인증 성공 콜백 처리 실패:', error)
    const failUrl = new URL('/checkout/fail', request.url)
    failUrl.searchParams.set('code', 'CALLBACK_ERROR')
    failUrl.searchParams.set('message', '콜백 처리 중 오류가 발생했습니다')
    return NextResponse.redirect(failUrl)
  }
}
