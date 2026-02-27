/**
 * 세션 만료 사전 경고 테스트
 * - 12분 경과 시 toast.warning 호출
 * - 15분 경과 시 phase가 error로 변경
 * - phase 변경 시 타이머 클린업
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
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

// 하위 컴포넌트 mock
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
    <div data-testid="account-selector">
      <button onClick={() => onSelect('act_123')}>Select</button>
    </div>
  ),
}))
vi.mock('@/presentation/utils/accountStatus', () => ({
  isActiveAccount: (status: number) => status === 1,
}))

const MOCK_ACCOUNTS = [
  { id: 'act_1', name: 'Account 1', accountStatus: 1, currency: 'KRW', amount_spent: '1000' },
  { id: 'act_2', name: 'Account 2', accountStatus: 1, currency: 'KRW', amount_spent: '2000' },
]

const originalFetch = global.fetch

describe('세션 만료 사전 경고', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockSearchParams.delete('session')
    mockSearchParams.delete('error')
    mockSearchParams.delete('adAccountId')
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
  })

  async function renderSelectPhase() {
    mockSearchParams.set('session', 'test-session')

    // 활성 계정 2개 → select phase
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ accounts: MOCK_ACCOUNTS }),
    })

    render(<AuditCallbackPage />)

    await waitFor(() => {
      expect(screen.getByTestId('account-selector')).toBeInTheDocument()
    })
  }

  it('12분 경과 시 toast.warning을 호출한다', async () => {
    await renderSelectPhase()

    // 12분 경과
    act(() => {
      vi.advanceTimersByTime(12 * 60 * 1000)
    })

    expect(toast.warning).toHaveBeenCalledWith(
      '세션이 3분 후 만료됩니다. 계정을 선택해주세요.',
      { duration: 10000 },
    )
  })

  it('12분 전에는 warning이 호출되지 않는다', async () => {
    await renderSelectPhase()

    // 11분 59초 경과
    act(() => {
      vi.advanceTimersByTime(11 * 60 * 1000 + 59 * 1000)
    })

    expect(toast.warning).not.toHaveBeenCalled()
  })

  it('15분 경과 시 에러 상태로 전환하고 toast.error를 호출한다', async () => {
    await renderSelectPhase()

    // 15분 경과
    act(() => {
      vi.advanceTimersByTime(15 * 60 * 1000)
    })

    expect(toast.error).toHaveBeenCalledWith(
      '세션이 만료되었습니다. 다시 시도해주세요.',
      { duration: Infinity },
    )

    // error phase로 전환되어 에러 메시지가 표시됨
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('분석에 실패했습니다')).toBeInTheDocument()
    })
  })

  it('phase가 select에서 벗어나면 타이머가 정리된다', async () => {
    await renderSelectPhase()

    // 계정 선택 → analyzing phase로 전환
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
    const selectButton = screen.getByText('Select')
    act(() => {
      selectButton.click()
    })

    // 12분 경과해도 warning 없음 (타이머 정리됨)
    act(() => {
      vi.advanceTimersByTime(12 * 60 * 1000)
    })

    expect(toast.warning).not.toHaveBeenCalled()
  })
})
