import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PixelSelector } from '@presentation/components/pixel/PixelSelector'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock fetch
global.fetch = vi.fn()

const mockPixels = [
  {
    id: 'pixel-1',
    metaPixelId: '123456789012345',
    name: 'Test Pixel 1',
    isActive: true,
    setupMethod: 'MANUAL',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'pixel-2',
    metaPixelId: '123456789012346',
    name: 'Test Pixel 2',
    isActive: true,
    setupMethod: 'PLATFORM_API',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
]

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

describe('PixelSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render loading state initially', () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<PixelSelector onSelect={vi.fn()} />, {
        wrapper: createQueryClientWrapper(),
      })

      expect(screen.getByText(/픽셀을 불러오는 중/i)).toBeInTheDocument()
    })

    it('should render pixel list when data is loaded', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPixels }),
      } as Response)

      render(<PixelSelector onSelect={vi.fn()} />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText('Test Pixel 1')).toBeInTheDocument()
        expect(screen.getByText('Test Pixel 2')).toBeInTheDocument()
      })
    })

    it('should show empty state when no pixels exist', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      } as Response)

      render(<PixelSelector onSelect={vi.fn()} />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/등록된 픽셀이 없습니다/i)).toBeInTheDocument()
      })
    })

    it('should show error state when fetch fails', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

      render(<PixelSelector onSelect={vi.fn()} />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/픽셀을 불러오는데 실패했습니다/i)).toBeInTheDocument()
      })
    })
  })

  describe('selection', () => {
    it('should call onSelect when pixel is clicked', async () => {
      const onSelect = vi.fn()
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPixels }),
      } as Response)

      render(<PixelSelector onSelect={onSelect} />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText('Test Pixel 1')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Test Pixel 1'))

      expect(onSelect).toHaveBeenCalledWith(mockPixels[0])
    })

    it('should highlight selected pixel', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPixels }),
      } as Response)

      render(<PixelSelector onSelect={vi.fn()} selectedPixelId="pixel-1" />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        const selectedItem = screen.getByText('Test Pixel 1').closest('[data-selected]')
        expect(selectedItem).toHaveAttribute('data-selected', 'true')
      })
    })
  })

  describe('display information', () => {
    it('should display Meta pixel ID', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPixels }),
      } as Response)

      render(<PixelSelector onSelect={vi.fn()} />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/123456789012345/)).toBeInTheDocument()
      })
    })

    it('should display setup method badge', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPixels }),
      } as Response)

      render(<PixelSelector onSelect={vi.fn()} />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText(/수동 설치/i)).toBeInTheDocument()
        expect(screen.getByText(/플랫폼 연동/i)).toBeInTheDocument()
      })
    })
  })

  describe('create new pixel', () => {
    it('should show create pixel button', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPixels }),
      } as Response)

      render(<PixelSelector onSelect={vi.fn()} showCreateButton />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /새 픽셀 등록/i })).toBeInTheDocument()
      })
    })

    it('should call onCreate when create button clicked', async () => {
      const onCreate = vi.fn()
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPixels }),
      } as Response)

      render(<PixelSelector onSelect={vi.fn()} showCreateButton onCreate={onCreate} />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /새 픽셀 등록/i })).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /새 픽셀 등록/i }))

      expect(onCreate).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper aria labels', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPixels }),
      } as Response)

      render(<PixelSelector onSelect={vi.fn()} />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByRole('list', { name: /픽셀 목록/i })).toBeInTheDocument()
      })
    })

    it('should be keyboard navigable', async () => {
      const onSelect = vi.fn()
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockPixels }),
      } as Response)

      render(<PixelSelector onSelect={onSelect} />, {
        wrapper: createQueryClientWrapper(),
      })

      await waitFor(() => {
        expect(screen.getByText('Test Pixel 1')).toBeInTheDocument()
      })

      const firstPixel = screen.getByText('Test Pixel 1').closest('button')
      firstPixel?.focus()
      fireEvent.keyDown(firstPixel!, { key: 'Enter' })

      expect(onSelect).toHaveBeenCalled()
    })
  })
})
