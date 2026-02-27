/**
 * AuditCallbackPage 단위 테스트
 * - alert() → toast 교체 검증
 * - AnalyzingProgress 프로그레스 인디케이터 검증
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import AuditCallbackPage from '@/app/audit/callback/page'
import { toast } from 'sonner'

// sonner mock
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// next/navigation mock
const mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}))

// 하위 컴포넌트 mock (테스트 범위 한정)
vi.mock('@/presentation/components/audit/AuditReportCard', () => ({
  AuditReportCard: () => <div data-testid="report-card">ReportCard</div>,
}))
vi.mock('@/presentation/components/audit/AuditCategoryBreakdown', () => ({
  AuditCategoryBreakdown: () => <div data-testid="category-breakdown">Breakdown</div>,
}))
vi.mock('@/presentation/components/audit/AuditConversionCTA', () => ({
  AuditConversionCTA: () => <div data-testid="conversion-cta">CTA</div>,
}))
vi.mock('@/presentation/components/audit/AccountSelector', () => ({
  AccountSelector: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <button data-testid="account-selector" onClick={() => onSelect('act_123')}>
      Select
    </button>
  ),
}))
vi.mock('@/presentation/utils/accountStatus', () => ({
  isActiveAccount: (status: number) => status === 1,
}))

const originalFetch = global.fetch

// 분석 결과 mock 데이터
const MOCK_REPORT = {
  overall: 75,
  grade: 'B',
  categories: [],
  estimatedWaste: { amount: 100000, currency: 'KRW' },
  estimatedImprovement: { amount: 50000, currency: 'KRW' },
  totalCampaigns: 5,
  activeCampaigns: 3,
  analyzedAt: '2026-02-27T10:00:00Z',
  signature: 'test-sig',
}

describe('AuditCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // searchParams 초기화
    mockSearchParams.delete('session')
    mockSearchParams.delete('error')
    mockSearchParams.delete('adAccountId')
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  describe('AnalyzingProgress 프로그레스 인디케이터', () => {
    it('분석 중일 때 프로그레스 인디케이터를 표시한다', async () => {
      mockSearchParams.set('session', 'test-session')
      mockSearchParams.set('adAccountId', 'act_123')

      // fetch가 resolve 안 되도록 pending 유지
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

      render(<AuditCallbackPage />)

      // analyzing 단계에서 프로그레스 메시지 표시
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
    })

    it('경과 시간을 표시한다', async () => {
      mockSearchParams.set('session', 'test-session')
      mockSearchParams.set('adAccountId', 'act_123')

      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

      render(<AuditCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/경과:/)).toBeInTheDocument()
      })

      // 5초 경과
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(screen.getByText(/5초/)).toBeInTheDocument()
    })

    it('예상 소요 시간을 표시한다', async () => {
      mockSearchParams.set('session', 'test-session')
      mockSearchParams.set('adAccountId', 'act_123')

      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

      render(<AuditCallbackPage />)

      await waitFor(() => {
        expect(screen.getByText(/30초~1분/)).toBeInTheDocument()
      })
    })

    it('단계별 체크리스트를 표시한다', async () => {
      mockSearchParams.set('session', 'test-session')
      mockSearchParams.set('adAccountId', 'act_123')

      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

      render(<AuditCallbackPage />)

      await waitFor(() => {
        const stepList = screen.getByLabelText('분석 단계')
        expect(stepList).toBeInTheDocument()
        // 4개 단계가 리스트에 존재
        const items = stepList.querySelectorAll('li')
        expect(items).toHaveLength(4)
      })
    })

    it('프로그레스 바가 렌더링된다', async () => {
      mockSearchParams.set('session', 'test-session')
      mockSearchParams.set('adAccountId', 'act_123')

      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

      render(<AuditCallbackPage />)

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument()
      })
    })
  })

  describe('toast 교체 검증', () => {
    // 결과 화면까지 진행하는 헬퍼
    async function renderWithResult() {
      mockSearchParams.set('session', 'test-session')
      mockSearchParams.set('adAccountId', 'act_123')

      // 계정 분석 성공 응답
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_REPORT),
      })

      render(<AuditCallbackPage />)

      // 결과 화면 대기
      await waitFor(() => {
        expect(screen.getByTestId('report-card')).toBeInTheDocument()
      })
    }

    it('공유 성공 시 toast.success를 호출한다', async () => {
      vi.useRealTimers()
      await renderWithResult()

      // 공유 API 성공 mock
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ shareUrl: 'https://batwo.ai/share/abc' }),
      })

      // clipboard mock
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      })

      const shareButton = screen.getByLabelText('진단 결과 공유 링크 복사')
      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('공유 링크가 클립보드에 복사되었습니다!')
      })
    })

    it('공유 실패 시 toast.error를 호출한다', async () => {
      vi.useRealTimers()
      await renderWithResult()

      // 공유 API 실패 mock
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })

      const shareButton = screen.getByLabelText('진단 결과 공유 링크 복사')
      fireEvent.click(shareButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          '공유 링크 생성에 실패했습니다. 다시 시도해주세요.',
        )
      })
    })

    it('PDF 다운로드 실패 시 toast.error를 호출한다', async () => {
      vi.useRealTimers()
      await renderWithResult()

      // PDF API 실패 mock
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      })

      const pdfButton = screen.getByLabelText('진단 결과 PDF 다운로드')
      fireEvent.click(pdfButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'PDF 다운로드에 실패했습니다. 다시 시도해주세요.',
        )
      })
    })
  })
})
