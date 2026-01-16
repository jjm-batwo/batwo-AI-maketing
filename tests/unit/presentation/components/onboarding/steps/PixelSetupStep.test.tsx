import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PixelSetupStep } from '@presentation/components/onboarding/steps/PixelSetupStep'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'user-123',
        metaAccessToken: 'mock-token',
      },
    },
    status: 'authenticated',
  })),
}))

// Mock fetch for pixel API
global.fetch = vi.fn()

function createQueryClientWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return function QueryClientWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('PixelSetupStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render step title', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // Use getByRole with level to specifically target h2
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('픽셀 설치')
    })

    it('should render step description', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      expect(screen.getByText(/Meta 픽셀을 설치하여/i)).toBeInTheDocument()
    })
  })

  describe('pixel selection', () => {
    it('should show pixel selector when Meta is connected', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          pixels: [
            { id: 'pixel-1', metaPixelId: '123', name: 'Test Pixel 1' },
          ],
        }),
      } as Response)

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // Should show loading state initially (from PixelSelector)
      expect(screen.getByText(/픽셀을 불러오는 중/i)).toBeInTheDocument()
    })
  })

  describe('pixel benefits section', () => {
    it('should show pixel benefits list', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // Should have benefits section
      expect(screen.getByText(/픽셀 설치 효과/i)).toBeInTheDocument()
      expect(screen.getByText(/웹사이트 방문자 행동 추적/i)).toBeInTheDocument()
    })

    it('should show skip message', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // Should mention can be done later
      expect(screen.getByText(/나중에 설정에서도 가능합니다/i)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // h2 for main title
      const mainHeading = screen.getByRole('heading', { level: 2 })
      expect(mainHeading).toBeInTheDocument()

      // h4 for benefits section
      const subHeading = screen.getByRole('heading', { level: 4 })
      expect(subHeading).toHaveTextContent('픽셀 설치 효과')
    })
  })

  describe('when Meta is not connected', () => {
    it('should show warning message when metaAccessToken is missing', () => {
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            // No metaAccessToken
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      expect(screen.getByText(/먼저 Meta 계정을 연결해주세요/i)).toBeInTheDocument()
    })
  })

  describe('pixel selection and script display', () => {
    beforeEach(() => {
      // Reset to authenticated with Meta token
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            metaAccessToken: 'mock-token',
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('should show script code after pixel selection', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'pixel-1', metaPixelId: '123456789', name: 'Test Pixel' },
          ],
        }),
      } as Response)

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // Wait for pixels to load
      await waitFor(() => {
        expect(screen.getByText('Test Pixel')).toBeInTheDocument()
      })

      // Click on the pixel to select it
      fireEvent.click(screen.getByText('Test Pixel'))

      // Should show selected state
      await waitFor(() => {
        expect(screen.getByText(/선택됨/i)).toBeInTheDocument()
      })

      // Should show script code
      expect(screen.getByText(/<script/i)).toBeInTheDocument()
      expect(screen.getByText(/설치 방법/i)).toBeInTheDocument()
    })

    it('should allow changing pixel selection', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'pixel-1', metaPixelId: '123456789', name: 'Test Pixel' },
          ],
        }),
      } as Response)

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // Wait for pixels to load and select one
      await waitFor(() => {
        expect(screen.getByText('Test Pixel')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Test Pixel'))

      // Should show change button
      await waitFor(() => {
        expect(screen.getByText(/다른 픽셀 선택/i)).toBeInTheDocument()
      })

      // Click change button
      fireEvent.click(screen.getByText(/다른 픽셀 선택/i))

      // Should show pixel selector again (script code should be hidden)
      expect(screen.queryByText(/선택됨/i)).not.toBeInTheDocument()
    })

    it('should have copy button with accessible label', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'pixel-1', metaPixelId: '123456789', name: 'Test Pixel' },
          ],
        }),
      } as Response)

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // Wait for pixels to load and select one
      await waitFor(() => {
        expect(screen.getByText('Test Pixel')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Test Pixel'))

      // Should have copy button with aria-label
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /코드 복사/i })).toBeInTheDocument()
      })
    })
  })
})
