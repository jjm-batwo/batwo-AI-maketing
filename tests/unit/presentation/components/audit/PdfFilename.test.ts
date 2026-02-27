/**
 * PDF 파일명 생성 로직 테스트
 * - accountName이 있을 때/없을 때 파일명 형식
 * - 특수문자 sanitize
 */
import { describe, it, expect } from 'vitest'

// PDF 파일명 생성 로직 (callback page와 PDF route에서 동일하게 사용)
function buildPdfFilename(analyzedAt: string, accountName?: string): string {
  const analyzedDate = new Date(analyzedAt)
    .toISOString()
    .split('T')[0]
    .replace(/-/g, '')
  const safeName = (accountName || '').replace(/[^a-zA-Z0-9가-힣_-]/g, '_').slice(0, 30)
  return safeName
    ? `바투_광고계정진단_${safeName}_${analyzedDate}.pdf`
    : `바투_광고계정진단_${analyzedDate}.pdf`
}

describe('PDF 파일명 생성', () => {
  const analyzedAt = '2026-02-27T10:00:00Z'

  it('accountName이 없으면 날짜만 포함된 파일명을 생성한다', () => {
    expect(buildPdfFilename(analyzedAt)).toBe('바투_광고계정진단_20260227.pdf')
  })

  it('accountName이 빈 문자열이면 날짜만 포함된 파일명을 생성한다', () => {
    expect(buildPdfFilename(analyzedAt, '')).toBe('바투_광고계정진단_20260227.pdf')
  })

  it('accountName이 있으면 계정명을 포함한 파일명을 생성한다', () => {
    expect(buildPdfFilename(analyzedAt, '바투쇼핑몰')).toBe(
      '바투_광고계정진단_바투쇼핑몰_20260227.pdf',
    )
  })

  it('영문 계정명도 정상 처리한다', () => {
    expect(buildPdfFilename(analyzedAt, 'MyShop')).toBe(
      '바투_광고계정진단_MyShop_20260227.pdf',
    )
  })

  it('특수문자는 언더스코어로 치환한다', () => {
    expect(buildPdfFilename(analyzedAt, '바투 쇼핑몰 (테스트)')).toBe(
      '바투_광고계정진단_바투_쇼핑몰__테스트__20260227.pdf',
    )
  })

  it('슬래시, 백슬래시 등 파일시스템 위험 문자를 제거한다', () => {
    expect(buildPdfFilename(analyzedAt, 'shop/test\\name')).toBe(
      '바투_광고계정진단_shop_test_name_20260227.pdf',
    )
  })

  it('30자를 초과하는 계정명은 잘라낸다', () => {
    const longName = '가'.repeat(40)
    const result = buildPdfFilename(analyzedAt, longName)
    const safePart = '가'.repeat(30)
    expect(result).toBe(`바투_광고계정진단_${safePart}_20260227.pdf`)
  })

  it('하이픈과 언더스코어는 유지한다', () => {
    expect(buildPdfFilename(analyzedAt, 'my-shop_01')).toBe(
      '바투_광고계정진단_my-shop_01_20260227.pdf',
    )
  })
})
