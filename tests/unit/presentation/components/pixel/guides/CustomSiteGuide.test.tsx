import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomSiteGuide } from '@presentation/components/pixel/guides/CustomSiteGuide'

// clipboard API mock
const mockWriteText = vi.fn()
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

// fetch mock
global.fetch = vi.fn()

describe('CustomSiteGuide', () => {
  const pixelId = 'pixel-abc-123'
  const mockSnippet = `<script src="https://batwo.ai/api/pixel/${pixelId}/tracker.js" async></script>`

  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteText.mockResolvedValue(undefined)
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => mockSnippet,
    } as Response)
  })

  describe('렌더링', () => {
    it('should_render_section_title', () => {
      render(<CustomSiteGuide pixelId={pixelId} />)

      expect(screen.getByText(/자체몰 픽셀 설치 가이드/i)).toBeInTheDocument()
    })

    it('should_render_three_installation_steps', () => {
      render(<CustomSiteGuide pixelId={pixelId} />)

      expect(screen.getByText(/코드 복사/i)).toBeInTheDocument()
      expect(screen.getByText(/head.*태그에 붙여넣기/i)).toBeInTheDocument()
      expect(screen.getByText(/저장 후 새로고침/i)).toBeInTheDocument()
    })

    it('should_display_snippet_code_after_fetch', async () => {
      render(<CustomSiteGuide pixelId={pixelId} />)

      await waitFor(() => {
        const codeBlock = screen.getByTestId('snippet-code')
        expect(codeBlock.textContent).toContain(pixelId)
        expect(codeBlock.textContent).toContain('tracker.js')
      })
    })

    it('should_render_copy_button', async () => {
      render(<CustomSiteGuide pixelId={pixelId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /스크립트 복사/i })).toBeInTheDocument()
      })
    })

    it('should_render_capi_event_helper_examples', () => {
      render(<CustomSiteGuide pixelId={pixelId} />)

      expect(screen.getByText(/trackPurchase/i)).toBeInTheDocument()
      expect(screen.getByText(/trackAddToCart/i)).toBeInTheDocument()
    })
  })

  describe('스니펫 fetch', () => {
    it('should_fetch_snippet_from_api_on_mount', async () => {
      render(<CustomSiteGuide pixelId={pixelId} />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`/api/pixel/${pixelId}/snippet`)
      })
    })

    it('should_show_loading_state_while_fetching', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<CustomSiteGuide pixelId={pixelId} />)

      expect(screen.getByText(/불러오는 중/i)).toBeInTheDocument()
    })

    it('should_show_error_state_when_fetch_fails', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response)

      render(<CustomSiteGuide pixelId={pixelId} />)

      await waitFor(() => {
        expect(screen.getByText(/스크립트를 불러오는데 실패했습니다/i)).toBeInTheDocument()
      })
    })
  })

  describe('복사 기능', () => {
    it('should_copy_snippet_to_clipboard_when_copy_button_clicked', async () => {
      render(<CustomSiteGuide pixelId={pixelId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /스크립트 복사/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /스크립트 복사/i }))

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(mockSnippet)
      })
    })

    it('should_show_success_feedback_after_copy', async () => {
      render(<CustomSiteGuide pixelId={pixelId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /스크립트 복사/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /스크립트 복사/i }))

      await waitFor(() => {
        expect(screen.getByText(/복사되었습니다/i)).toBeInTheDocument()
      })
    })

    it('should_show_error_feedback_when_clipboard_fails', async () => {
      mockWriteText.mockRejectedValue(new Error('Clipboard error'))

      render(<CustomSiteGuide pixelId={pixelId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /스크립트 복사/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /스크립트 복사/i }))

      await waitFor(() => {
        expect(screen.getByText(/복사 실패/i)).toBeInTheDocument()
      })
    })
  })

  describe('접근성', () => {
    it('should_have_aria_label_on_code_block', async () => {
      render(<CustomSiteGuide pixelId={pixelId} />)

      await waitFor(() => {
        const codeBlock = screen.getByTestId('snippet-code')
        expect(codeBlock).toHaveAttribute('aria-label', '픽셀 설치 스크립트 코드')
      })
    })
  })
})
