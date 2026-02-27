/**
 * AccountSelector 컴포넌트 단위 테스트
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AccountSelector } from '@/presentation/components/audit/AccountSelector'
import type { AdAccount } from '@/presentation/components/audit/AccountSelector'

const MOCK_ACCOUNTS: AdAccount[] = [
  { id: 'act_111', name: '운영 계정 A', currency: 'KRW', accountStatus: 1 },
  { id: 'act_222', name: '비활성 계정 B', currency: 'USD', accountStatus: 2 },
  { id: 'act_333', name: '운영 계정 C', currency: 'KRW', accountStatus: 201 },
]

describe('AccountSelector', () => {
  it('계정 목록을 렌더링한다', () => {
    render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

    expect(screen.getByText('운영 계정 A')).toBeInTheDocument()
    expect(screen.getByText('비활성 계정 B')).toBeInTheDocument()
    expect(screen.getByText('운영 계정 C')).toBeInTheDocument()
  })

  it('헤더에 계정 수 요약을 표시한다', () => {
    render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

    expect(screen.getByText(/총 3개 계정/)).toBeInTheDocument()
    expect(screen.getByText(/2개가 운영 중/)).toBeInTheDocument()
  })

  it('활성 계정 상태 뱃지를 표시한다', () => {
    render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

    // status 1 → "운영 중", status 201 → "활성"
    expect(screen.getByText('운영 중')).toBeInTheDocument()
    expect(screen.getByText('활성')).toBeInTheDocument()
    expect(screen.getByText('비활성')).toBeInTheDocument()
  })

  it('활성 계정이 상단에 정렬된다', () => {
    const reversed: AdAccount[] = [
      { id: 'act_222', name: '비활성 계정', currency: 'USD', accountStatus: 2 },
      { id: 'act_111', name: '운영 계정', currency: 'KRW', accountStatus: 1 },
    ]
    render(<AccountSelector accounts={reversed} onSelect={vi.fn()} />)

    const cards = screen.getAllByRole('radio')
    expect(cards[0]).toHaveAttribute('aria-label', expect.stringContaining('운영 계정'))
    expect(cards[1]).toHaveAttribute('aria-label', expect.stringContaining('비활성 계정'))
  })

  it('활성 계정 클릭 시 onSelect 즉시 호출', () => {
    const onSelect = vi.fn()
    render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={onSelect} />)

    const activeCard = screen.getByText('운영 계정 A').closest('[role="radio"]')!
    fireEvent.click(activeCard)

    expect(onSelect).toHaveBeenCalledWith('act_111')
  })

  it('비활성 계정 클릭 시 확인 다이얼로그 표시', () => {
    render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

    const inactiveCard = screen.getByText('비활성 계정 B').closest('[role="radio"]')!
    fireEvent.click(inactiveCard)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/운영 중이 아닙니다/)).toBeInTheDocument()
  })

  it('확인 다이얼로그에서 "계속 진단" 클릭 시 onSelect 호출', () => {
    const onSelect = vi.fn()
    render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={onSelect} />)

    const inactiveCard = screen.getByText('비활성 계정 B').closest('[role="radio"]')!
    fireEvent.click(inactiveCard)

    const confirmBtn = screen.getByText('계속 진단')
    fireEvent.click(confirmBtn)

    expect(onSelect).toHaveBeenCalledWith('act_222')
  })

  it('확인 다이얼로그에서 "취소" 클릭 시 다이얼로그 닫힘', () => {
    render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

    const inactiveCard = screen.getByText('비활성 계정 B').closest('[role="radio"]')!
    fireEvent.click(inactiveCard)

    const cancelBtn = screen.getByText('취소')
    fireEvent.click(cancelBtn)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('로딩 상태를 표시한다', () => {
    render(<AccountSelector accounts={[]} onSelect={vi.fn()} loading />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/불러오는 중/)).toBeInTheDocument()
  })

  it('빈 목록일 때 안내 메시지를 표시한다', () => {
    render(<AccountSelector accounts={[]} onSelect={vi.fn()} />)

    expect(screen.getByText('광고 계정이 없습니다')).toBeInTheDocument()
  })

  it('radiogroup role이 설정되어 있다', () => {
    render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('키보드 Enter로 계정 선택 가능', () => {
    const onSelect = vi.fn()
    render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={onSelect} />)

    const activeCard = screen.getByText('운영 계정 A').closest('[role="radio"]')!
    fireEvent.keyDown(activeCard, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith('act_111')
  })

  // --- Phase 3 UX 개선 테스트 ---

  describe('aria-checked 상태 반영', () => {
    it('selectedAccountId와 일치하는 계정에 aria-checked="true" 설정', () => {
      render(
        <AccountSelector
          accounts={MOCK_ACCOUNTS}
          onSelect={vi.fn()}
          selectedAccountId="act_111"
        />
      )

      const cards = screen.getAllByRole('radio')
      const selectedCard = cards.find((c) =>
        c.getAttribute('aria-label')?.includes('운영 계정 A')
      )!
      const otherCard = cards.find((c) =>
        c.getAttribute('aria-label')?.includes('비활성 계정 B')
      )!

      expect(selectedCard).toHaveAttribute('aria-checked', 'true')
      expect(otherCard).toHaveAttribute('aria-checked', 'false')
    })

    it('selectedAccountId 미전달 시 모든 계정 aria-checked="false"', () => {
      render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

      const cards = screen.getAllByRole('radio')
      cards.forEach((card) => {
        expect(card).toHaveAttribute('aria-checked', 'false')
      })
    })
  })

  describe('확인 다이얼로그 ESC 핸들러', () => {
    it('ESC 키로 다이얼로그 닫기', () => {
      render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

      // 비활성 계정 클릭으로 다이얼로그 열기
      const inactiveCard = screen.getByText('비활성 계정 B').closest('[role="radio"]')!
      fireEvent.click(inactiveCard)
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // ESC 키 누르기
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('확인 다이얼로그 오버레이 클릭', () => {
    it('오버레이(배경) 클릭 시 다이얼로그 닫기', () => {
      render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

      // 비활성 계정 클릭으로 다이얼로그 열기
      const inactiveCard = screen.getByText('비활성 계정 B').closest('[role="radio"]')!
      fireEvent.click(inactiveCard)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()

      // 오버레이(다이얼로그 자체) 클릭
      fireEvent.click(dialog)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('다이얼로그 내부 카드 클릭 시 닫히지 않음', () => {
      render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

      const inactiveCard = screen.getByText('비활성 계정 B').closest('[role="radio"]')!
      fireEvent.click(inactiveCard)

      // 다이얼로그 내부 텍스트 클릭 (버블링되지만 target !== currentTarget)
      const dialogText = screen.getByText(/운영 중이 아닙니다/)
      fireEvent.click(dialogText)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('확인 다이얼로그 포커스 트랩', () => {
    it('다이얼로그 열릴 때 첫 번째 버튼에 포커스', () => {
      render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

      const inactiveCard = screen.getByText('비활성 계정 B').closest('[role="radio"]')!
      fireEvent.click(inactiveCard)

      // 첫 번째 버튼(취소)에 포커스가 이동
      const cancelBtn = screen.getByText('취소')
      expect(document.activeElement).toBe(cancelBtn)
    })

    it('마지막 버튼에서 Tab 시 첫 번째 버튼으로 순환', () => {
      render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

      const inactiveCard = screen.getByText('비활성 계정 B').closest('[role="radio"]')!
      fireEvent.click(inactiveCard)

      const confirmBtn = screen.getByText('계속 진단')
      confirmBtn.focus()

      // 마지막 요소에서 Tab
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' })

      const cancelBtn = screen.getByText('취소')
      expect(document.activeElement).toBe(cancelBtn)
    })

    it('첫 번째 버튼에서 Shift+Tab 시 마지막 버튼으로 순환', () => {
      render(<AccountSelector accounts={MOCK_ACCOUNTS} onSelect={vi.fn()} />)

      const inactiveCard = screen.getByText('비활성 계정 B').closest('[role="radio"]')!
      fireEvent.click(inactiveCard)

      const cancelBtn = screen.getByText('취소')
      cancelBtn.focus()

      // 첫 번째 요소에서 Shift+Tab
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true })

      const confirmBtn = screen.getByText('계속 진단')
      expect(document.activeElement).toBe(confirmBtn)
    })
  })
})
