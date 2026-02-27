/**
 * FreeAuditButton 컴포넌트 단위 테스트
 * - fetch 실패 시 toast.error 호출 검증
 * - res.ok === false 시 toast.error 호출 검증
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FreeAuditButton } from '@/presentation/components/landing/HeroSection/FreeAuditButton'
import { toast } from 'sonner'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

const originalFetch = global.fetch

describe('FreeAuditButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('정상 응답 시 authUrl로 리다이렉트한다', async () => {
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ authUrl: 'https://facebook.com/oauth' }),
    })

    render(<FreeAuditButton />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockLocation.href).toBe('https://facebook.com/oauth')
    })
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('fetch 네트워크 에러 시 toast.error를 호출한다', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    render(<FreeAuditButton />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Meta 계정 연결에 실패했습니다. 다시 시도해주세요.',
      )
    })
  })

  it('res.ok가 false일 때 toast.error를 호출한다', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: '서버 오류' }),
    })

    render(<FreeAuditButton />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Meta 계정 연결에 실패했습니다. 다시 시도해주세요.',
      )
    })
  })

  it('에러 발생 후 loading 상태가 해제된다', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('fail'))

    render(<FreeAuditButton />)
    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })
})
