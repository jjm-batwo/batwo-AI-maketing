import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/payments/billing/fail
 * Toss 결제 인증 실패 콜백 처리
 *
 * Toss 팝업에서 리다이렉트되는 엔드포인트
 * 실패 시 체크아웃 실패 페이지로 리다이렉트
 */
export async function GET(request: NextRequest) {
  try {
    // 1. URL 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code') || 'UNKNOWN_ERROR'
    const message = searchParams.get('message') || '결제 인증에 실패했습니다'

    // 2. 로깅
    console.error('결제 인증 실패 콜백:', { code, message })

    // 3. 체크아웃 실패 페이지로 리다이렉트
    const failUrl = new URL('/checkout/fail', request.url)
    failUrl.searchParams.set('code', code)
    failUrl.searchParams.set('message', message)

    return NextResponse.redirect(failUrl)
  } catch (error) {
    console.error('결제 인증 실패 콜백 처리 실패:', error)
    const failUrl = new URL('/checkout/fail', request.url)
    failUrl.searchParams.set('code', 'CALLBACK_ERROR')
    failUrl.searchParams.set('message', '콜백 처리 중 오류가 발생했습니다')
    return NextResponse.redirect(failUrl)
  }
}
