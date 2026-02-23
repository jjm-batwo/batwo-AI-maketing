import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NaverGuide } from '@presentation/components/pixel/guides/NaverGuide'

// clipboard API mock
const mockWriteText = vi.fn()
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

// fetch mock
global.fetch = vi.fn()

describe('NaverGuide', () => {
  const mockPixelId = 'pixel-abc-123'
  const mockPixelCode = '1234567890'

  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteText.mockResolvedValue(undefined)
  })

  // -------------------------
  // 렌더링 기본 구조
  // -------------------------
  describe('rendering', () => {
    it('should_render_naver_guide_title', () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => '<script src="https://batwo.ai/api/pixel/pixel-abc-123/tracker.js"></script>',
      } as Response)

      render(<NaverGuide pixelId={mockPixelId} pixelCode={mockPixelCode} />)

      expect(screen.getByRole('heading', { name: /네이버 스마트스토어/i })).toBeInTheDocument()
    })

    it('should_render_all_five_steps', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => '<script src="https://batwo.ai/api/pixel/pixel-abc-123/tracker.js"></script>',
      } as Response)

      render(<NaverGuide pixelId={mockPixelId} pixelCode={mockPixelCode} />)

      // 5단계 모두 렌더링 확인
      expect(screen.getByText(/네이버 스마트스토어 관리자에 로그인/i)).toBeInTheDocument()
      expect(screen.getByText(/쇼핑몰 관리.*디자인.*외부 스크립트 관리/i)).toBeInTheDocument()
      expect(screen.getByText(/공통 스크립트/i)).toBeInTheDocument()
      expect(screen.getByText(/저장을 클릭/i)).toBeInTheDocument()
      expect(screen.getByText(/설치가 완료되었습니다/i)).toBeInTheDocument()
    })

    it('should_render_24hour_notice_in_step5', () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => '<script></script>',
      } as Response)

      render(<NaverGuide pixelId={mockPixelId} />)

      expect(screen.getByText(/최대 24시간/i)).toBeInTheDocument()
    })
  })

  // -------------------------
  // snippet fetch 및 코드 블록
  // -------------------------
  describe('snippet fetch', () => {
    it('should_fetch_snippet_from_api_using_pixelId', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => '<script src="https://batwo.ai/api/pixel/pixel-abc-123/tracker.js"></script>',
      } as Response)

      render(<NaverGuide pixelId={mockPixelId} />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`/api/pixel/${mockPixelId}/snippet`)
      })
    })

    it('should_display_fetched_snippet_in_code_block', async () => {
      const snippetCode = '<script src="https://batwo.ai/api/pixel/pixel-abc-123/tracker.js"></script>'
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => snippetCode,
      } as Response)

      render(<NaverGuide pixelId={mockPixelId} />)

      await waitFor(() => {
        const codeBlock = screen.getByTestId('naver-snippet-code')
        expect(codeBlock.textContent).toContain('tracker.js')
      })
    })

    it('should_show_loading_state_while_fetching', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<NaverGuide pixelId={mockPixelId} />)

      expect(screen.getByTestId('naver-snippet-loading')).toBeInTheDocument()
    })
  })

  // -------------------------
  // 복사 기능
  // -------------------------
  describe('copy functionality', () => {
    it('should_copy_snippet_to_clipboard_when_copy_button_clicked', async () => {
      const snippetCode = '<script src="https://batwo.ai/api/pixel/pixel-abc-123/tracker.js"></script>'
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => snippetCode,
      } as Response)

      render(<NaverGuide pixelId={mockPixelId} />)

      await waitFor(() => {
        expect(screen.getByTestId('naver-snippet-code')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /복사/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(snippetCode)
      })
    })

    it('should_show_check_icon_after_successful_copy', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => '<script></script>',
      } as Response)

      render(<NaverGuide pixelId={mockPixelId} />)

      await waitFor(() => {
        expect(screen.getByTestId('naver-snippet-code')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /복사/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText(/복사됨/i)).toBeInTheDocument()
      })
    })

    it('should_show_error_state_when_clipboard_fails', async () => {
      mockWriteText.mockRejectedValue(new Error('Clipboard denied'))
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => '<script></script>',
      } as Response)

      render(<NaverGuide pixelId={mockPixelId} />)

      await waitFor(() => {
        expect(screen.getByTestId('naver-snippet-code')).toBeInTheDocument()
      })

      const copyButton = screen.getByRole('button', { name: /복사/i })
      fireEvent.click(copyButton)

      await waitFor(() => {
        expect(screen.getByText(/복사 실패/i)).toBeInTheDocument()
      })
    })
  })

  // -------------------------
  // 트러블슈팅 섹션
  // -------------------------
  describe('troubleshooting section', () => {
    it('should_render_troubleshooting_section', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<NaverGuide pixelId={mockPixelId} />)

      expect(screen.getByText(/동작하지 않을 경우/i)).toBeInTheDocument()
    })

    it('should_show_inline_alternative_snippet_warning', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<NaverGuide pixelId={mockPixelId} pixelCode={mockPixelCode} />)

      // 트러블슈팅 섹션 열기
      fireEvent.click(screen.getByText(/동작하지 않을 경우/i))

      expect(screen.getByText(/외부 도메인이 차단/i)).toBeInTheDocument()
    })

    it('should_display_inline_fbq_snippet_when_pixelCode_provided', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<NaverGuide pixelId={mockPixelId} pixelCode={mockPixelCode} />)

      // 트러블슈팅 섹션 열기
      fireEvent.click(screen.getByText(/동작하지 않을 경우/i))

      const inlineBlock = screen.getByTestId('naver-inline-snippet')
      expect(inlineBlock.textContent).toContain(mockPixelCode)
      expect(inlineBlock.textContent).toContain('fbq')
    })
  })

  // -------------------------
  // 접근성
  // -------------------------
  describe('accessibility', () => {
    it('should_have_accessible_step_list', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<NaverGuide pixelId={mockPixelId} />)

      const stepList = screen.getByRole('list', { name: /설치 단계/i })
      expect(stepList).toBeInTheDocument()
    })

    it('should_have_proper_aria_label_on_code_copy_button', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: async () => '<script></script>',
      } as Response)

      render(<NaverGuide pixelId={mockPixelId} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /스크립트 복사/i })).toBeInTheDocument()
      })
    })
  })
})
