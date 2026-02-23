import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PixelSetupStep } from '@presentation/components/onboarding/steps/PixelSetupStep'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { GlobalRole } from '@domain/value-objects/GlobalRole'
import { NextIntlClientProvider } from 'next-intl'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'user-123',
        metaAccessToken: 'mock-token',
        globalRole: 'USER',
      },
    },
    status: 'authenticated',
  })),
}))

// Mock next-intl with Korean translations
const mockTranslations: Record<string, Record<string, string>> = {
  'onboarding.pixelSetup': {
    'title': '픽셀 설치',
    'description': 'Meta 픽셀을 설치하여 광고 성과를 추적하세요',
    'connectFirst': '먼저 Meta 계정을 연결해주세요',
    'selected': '선택됨',
    'selectOther': '다른 픽셀 선택',
    'copyCode': '코드 복사',
    'installation.title': '설치 방법',
    'installation.description': '아래 코드를 웹사이트 <head> 태그에 붙여넣기하세요',
    'installation.skipMessage': '나중에 설정에서도 가능합니다',
    'benefits.title': '픽셀 설치 효과',
    'benefits.item1': '웹사이트 방문자 행동 추적',
    'benefits.item2': '광고 성과 측정',
    'benefits.item3': '고객 재방문 추적',
    'benefits.item4': '더 정확한 타겟팅',
    'selectPlatform': '쇼핑몰 플랫폼을 선택하세요',
  },
  'pixel': {
    'loading': '픽셀을 불러오는 중',
    'loadError': '픽셀 로드 실패',
    'unknownError': '알 수 없는 오류가 발생했습니다',
  },
}

vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl')
  return {
    ...actual,
    useTranslations: vi.fn((namespace: string) => {
      const messages = mockTranslations[namespace] || {}
      return (key: string) => messages[key] || key
    }),
  }
})

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
    return (
      <NextIntlClientProvider locale="ko" messages={{}}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </NextIntlClientProvider>
    )
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
          data: [
            { id: 'pixel-1', metaPixelId: '123', name: 'Test Pixel 1', isActive: true, setupMethod: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
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
            globalRole: GlobalRole.USER,
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

  describe('pixel selection and platform flow', () => {
    beforeEach(() => {
      // Reset to authenticated with Meta token
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            metaAccessToken: 'mock-token',
            globalRole: GlobalRole.USER,
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('should_show_platform_selector_after_pixel_selection', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'pixel-1', metaPixelId: '123456789', name: 'Test Pixel', isActive: true, setupMethod: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        }),
      } as Response)

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // 픽셀 로드 대기
      await waitFor(() => {
        expect(screen.getByText('Test Pixel')).toBeInTheDocument()
      })

      // 픽셀 선택
      fireEvent.click(screen.getByText('Test Pixel'))

      // 픽셀 선택 후 PlatformSelector가 표시되어야 함
      await waitFor(() => {
        expect(screen.getByText(/선택됨/i)).toBeInTheDocument()
      })

      // 플랫폼 목록이 표시되어야 함 (PlatformSelector의 카드들)
      expect(screen.getByText('카페24')).toBeInTheDocument()
      expect(screen.getByText('자체몰 (커스텀)')).toBeInTheDocument()
      expect(screen.getByText('네이버 스마트스토어')).toBeInTheDocument()
    })

    it('should_show_custom_site_guide_when_custom_platform_selected', async () => {
      vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
        const urlStr = url.toString()
        // 픽셀 목록 API
        if (urlStr.includes('/api/pixel') && !urlStr.includes('/snippet')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: [
                { id: 'pixel-1', metaPixelId: '123456789', name: 'Test Pixel', isActive: true, setupMethod: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              ],
            }),
          } as Response)
        }
        // 스니펫 API (CustomSiteGuide 내부 fetch)
        return Promise.resolve({
          ok: true,
          text: async () => '<script src="..."></script>',
        } as Response)
      })

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // 픽셀 선택
      await waitFor(() => {
        expect(screen.getByText('Test Pixel')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Test Pixel'))

      // 플랫폼 선택 대기
      await waitFor(() => {
        expect(screen.getByText('자체몰 (커스텀)')).toBeInTheDocument()
      })

      // 자체몰 선택
      fireEvent.click(screen.getByText('자체몰 (커스텀)'))

      // CustomSiteGuide가 렌더링되어야 함
      await waitFor(() => {
        expect(screen.getByText(/자체몰 픽셀 설치 가이드/i)).toBeInTheDocument()
      })
    })

    it('should_show_naver_guide_when_naver_platform_selected', async () => {
      vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
        const urlStr = url.toString()
        // 픽셀 목록 API
        if (urlStr.includes('/api/pixel') && !urlStr.includes('/snippet')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: [
                { id: 'pixel-1', metaPixelId: '123456789', name: 'Test Pixel', isActive: true, setupMethod: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
              ],
            }),
          } as Response)
        }
        // 스니펫 API (NaverGuide 내부 fetch)
        return Promise.resolve({
          ok: true,
          text: async () => '<script src="..."></script>',
        } as Response)
      })

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // 픽셀 선택
      await waitFor(() => {
        expect(screen.getByText('Test Pixel')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Test Pixel'))

      // 플랫폼 선택 대기
      await waitFor(() => {
        expect(screen.getByText('네이버 스마트스토어')).toBeInTheDocument()
      })

      // 네이버 선택
      fireEvent.click(screen.getByText('네이버 스마트스토어'))

      // NaverGuide가 렌더링되어야 함
      await waitFor(() => {
        expect(screen.getByText(/네이버 스마트스토어 픽셀 설치 가이드/i)).toBeInTheDocument()
      })
    })

    it('should_show_script_for_cafe24_platform', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'pixel-1', metaPixelId: '123456789', name: 'Test Pixel', isActive: true, setupMethod: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        }),
      } as Response)

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // 픽셀 선택
      await waitFor(() => {
        expect(screen.getByText('Test Pixel')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('Test Pixel'))

      // 플랫폼 선택 대기
      await waitFor(() => {
        expect(screen.getByText('카페24')).toBeInTheDocument()
      })

      // 카페24 선택
      fireEvent.click(screen.getByText('카페24'))

      // 스크립트 코드가 표시되어야 함
      await waitFor(() => {
        expect(screen.getByText(/설치 방법/i)).toBeInTheDocument()
        expect(screen.getByText(/<script/i)).toBeInTheDocument()
      })
    })

    it('should allow changing pixel selection', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'pixel-1', metaPixelId: '123456789', name: 'Test Pixel', isActive: true, setupMethod: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        }),
      } as Response)

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // 픽셀 로드 대기 후 선택
      await waitFor(() => {
        expect(screen.getByText('Test Pixel')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Test Pixel'))

      // 다른 픽셀 선택 버튼이 표시되어야 함
      await waitFor(() => {
        expect(screen.getByText(/다른 픽셀 선택/i)).toBeInTheDocument()
      })

      // 변경 버튼 클릭
      fireEvent.click(screen.getByText(/다른 픽셀 선택/i))

      // 픽셀 선택 화면으로 돌아가야 함 (선택됨 텍스트 사라짐)
      expect(screen.queryByText(/선택됨/i)).not.toBeInTheDocument()
    })

    it('should have copy button with accessible label after cafe24 selection', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            { id: 'pixel-1', metaPixelId: '123456789', name: 'Test Pixel', isActive: true, setupMethod: 'MANUAL', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        }),
      } as Response)

      render(<PixelSetupStep />, {
        wrapper: createQueryClientWrapper(),
      })

      // 픽셀 로드 대기 후 선택
      await waitFor(() => {
        expect(screen.getByText('Test Pixel')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Test Pixel'))

      // 카페24 선택
      await waitFor(() => {
        expect(screen.getByText('카페24')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('카페24'))

      // 복사 버튼에 aria-label이 있어야 함
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /코드 복사/i })).toBeInTheDocument()
      })
    })
  })
})
