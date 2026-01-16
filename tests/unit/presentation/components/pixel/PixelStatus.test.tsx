import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PixelStatus } from '@presentation/components/pixel/PixelStatus'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock fetch
global.fetch = vi.fn()

const mockActiveStatus = {
  pixelId: 'pixel-123',
  metaPixelId: '123456789012345',
  name: 'Test Pixel',
  isActive: true,
  setupMethod: 'MANUAL',
  operationalStatus: 'ACTIVE',
  hasReceivedEvents: true,
  eventCount: 150,
  lastEventAt: '2024-01-15T10:30:00.000Z',
}

const mockPendingStatus = {
  pixelId: 'pixel-456',
  metaPixelId: '123456789012346',
  name: 'Pending Pixel',
  isActive: true,
  setupMethod: 'MANUAL',
  operationalStatus: 'PENDING',
  hasReceivedEvents: false,
  eventCount: 0,
  lastEventAt: null,
}

const mockErrorStatus = {
  pixelId: 'pixel-789',
  metaPixelId: '123456789012347',
  name: 'Error Pixel',
  isActive: false,
  setupMethod: 'PLATFORM_API',
  operationalStatus: 'ERROR',
  hasReceivedEvents: false,
  eventCount: 0,
  lastEventAt: null,
  errorMessage: 'Connection to platform failed',
  platformStatus: 'ERROR',
}

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

describe('PixelStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('should show loading spinner while fetching', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<PixelStatus pixelId="pixel-123" />, {
        wrapper: createQueryClientWrapper(),
      })

      expect(screen.getByText(/상태 확인 중/i)).toBeInTheDocument()
    })
  })

  describe('active status', () => {
    it('should show active status badge', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockActiveStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-123" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/활성/i)).toBeInTheDocument()
      })
    })

    it('should display event count', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockActiveStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-123" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
        // Check for "이벤트" text in the event count section
        const eventLabels = screen.getAllByText(/이벤트/i)
        expect(eventLabels.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should display last event time', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockActiveStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-123" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/마지막 이벤트/i)).toBeInTheDocument()
      })
    })
  })

  describe('pending status', () => {
    it('should show pending status badge', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockPendingStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-456" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/대기중/i)).toBeInTheDocument()
      })
    })

    it('should show no events message', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockPendingStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-456" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/아직 이벤트가 수신되지 않았습니다/i)).toBeInTheDocument()
      })
    })
  })

  describe('error status', () => {
    it('should show error status badge', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockErrorStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-789" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        // Error status shows "오류" label - may have multiple (badge + error detail)
        const errorLabels = screen.getAllByText(/오류/i)
        expect(errorLabels.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('should display error message', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockErrorStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-789" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/Connection to platform failed/i)).toBeInTheDocument()
      })
    })
  })

  describe('fetch error', () => {
    it('should show error message when fetch fails', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      render(<PixelStatus pixelId="pixel-123" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/상태를 불러올 수 없습니다/i)).toBeInTheDocument()
      })
    })
  })

  describe('status indicators', () => {
    it('should show green indicator for active status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockActiveStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-123" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        const indicator = screen.getByTestId('status-indicator')
        // The indicator has bg-green-100 wrapper color for active status
        expect(indicator).toHaveClass('bg-green-100')
      })
    })

    it('should show yellow indicator for pending status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockPendingStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-456" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        const indicator = screen.getByTestId('status-indicator')
        expect(indicator).toHaveClass('bg-yellow-100')
      })
    })

    it('should show red indicator for error status', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockErrorStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-789" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        const indicator = screen.getByTestId('status-indicator')
        expect(indicator).toHaveClass('bg-red-100')
      })
    })
  })

  describe('compact mode', () => {
    it('should render in compact mode when prop is true', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockActiveStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-123" compact />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByTestId('pixel-status')).toHaveClass('compact')
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper aria labels', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockActiveStatus,
      } as Response)

      render(<PixelStatus pixelId="pixel-123" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument()
      })
    })
  })
})
