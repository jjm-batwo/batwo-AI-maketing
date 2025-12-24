import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CampaignCreateForm } from '@/presentation/components/campaign/CampaignCreateForm'

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('CampaignCreateForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Step 1: 비즈니스 정보', () => {
    it('should render campaign name input', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      expect(screen.getByLabelText('캠페인 이름')).toBeInTheDocument()
    })

    it('should render objective selection', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      expect(screen.getByText('캠페인 목표')).toBeInTheDocument()
      expect(screen.getByText('트래픽')).toBeInTheDocument()
      expect(screen.getByText('전환')).toBeInTheDocument()
      expect(screen.getByText('브랜드 인지도')).toBeInTheDocument()
    })

    it('should show validation error for empty name', async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      const nextButton = screen.getByRole('button', { name: '다음' })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('캠페인 이름을 입력해주세요')).toBeInTheDocument()
      })
    })

    it('should proceed to step 2 with valid input', async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      await user.type(screen.getByLabelText('캠페인 이름'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음' }))

      await waitFor(() => {
        expect(screen.getByText('타겟 오디언스')).toBeInTheDocument()
      })
    })
  })

  describe('Step 2: 타겟 오디언스', () => {
    const goToStep2 = async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      await user.type(screen.getByLabelText('캠페인 이름'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음' }))
      await waitFor(() => {
        expect(screen.getByText('타겟 오디언스')).toBeInTheDocument()
      })
    }

    it('should render age range selector', async () => {
      await goToStep2()
      expect(screen.getByText('연령대')).toBeInTheDocument()
    })

    it('should render gender selector', async () => {
      await goToStep2()
      expect(screen.getByText('성별')).toBeInTheDocument()
    })

    it('should render location selector', async () => {
      await goToStep2()
      expect(screen.getByText('지역')).toBeInTheDocument()
    })

    it('should allow going back to step 1', async () => {
      await goToStep2()
      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: '이전' }))

      await waitFor(() => {
        expect(screen.getByLabelText('캠페인 이름')).toBeInTheDocument()
      })
    })
  })

  describe('Step 3: 예산 설정', () => {
    it('should render daily budget input', async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      // Navigate to step 3
      await user.type(screen.getByLabelText('캠페인 이름'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음' }))
      await waitFor(() => screen.getByText('타겟 오디언스'))
      await user.click(screen.getByRole('button', { name: '다음' }))

      await waitFor(() => {
        expect(screen.getByText('예산 설정')).toBeInTheDocument()
        expect(screen.getByLabelText('일일 예산')).toBeInTheDocument()
      })
    })

    it('should validate minimum budget', async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      // Navigate to step 3
      await user.type(screen.getByLabelText('캠페인 이름'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음' }))
      await waitFor(() => screen.getByText('타겟 오디언스'))
      await user.click(screen.getByRole('button', { name: '다음' }))
      await waitFor(() => screen.getByLabelText('일일 예산'))

      await user.clear(screen.getByLabelText('일일 예산'))
      await user.type(screen.getByLabelText('일일 예산'), '1000')
      await user.click(screen.getByRole('button', { name: '다음' }))

      await waitFor(() => {
        expect(
          screen.getByText('최소 일일 예산은 10,000원입니다')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Step 4: 최종 확인', () => {
    it('should display summary of all inputs', async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      // Fill step 1
      await user.type(screen.getByLabelText('캠페인 이름'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음' }))

      // Step 2
      await waitFor(() => screen.getByText('타겟 오디언스'))
      await user.click(screen.getByRole('button', { name: '다음' }))

      // Step 3
      await waitFor(() => screen.getByLabelText('일일 예산'))
      await user.clear(screen.getByLabelText('일일 예산'))
      await user.type(screen.getByLabelText('일일 예산'), '50000')
      await user.click(screen.getByRole('button', { name: '다음' }))

      // Step 4 - Review
      await waitFor(() => {
        expect(screen.getByText('최종 확인')).toBeInTheDocument()
        expect(screen.getByText('테스트 캠페인')).toBeInTheDocument()
        expect(screen.getByText('전환')).toBeInTheDocument()
        expect(screen.getByText('50,000원')).toBeInTheDocument()
      })
    })

    it('should call onSubmit with correct data', async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      // Navigate through all steps
      await user.type(screen.getByLabelText('캠페인 이름'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음' }))

      await waitFor(() => screen.getByText('타겟 오디언스'))
      await user.click(screen.getByRole('button', { name: '다음' }))

      await waitFor(() => screen.getByLabelText('일일 예산'))
      await user.clear(screen.getByLabelText('일일 예산'))
      await user.type(screen.getByLabelText('일일 예산'), '50000')
      await user.click(screen.getByRole('button', { name: '다음' }))

      await waitFor(() => screen.getByText('최종 확인'))
      await user.click(screen.getByRole('button', { name: '캠페인 생성' }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '테스트 캠페인',
            objective: 'CONVERSIONS',
            dailyBudget: 50000,
          })
        )
      })
    })
  })

  describe('취소', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      await user.click(screen.getByRole('button', { name: '취소' }))
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('쿼터 체크', () => {
    it('should show quota exceeded message when limit reached', () => {
      render(
        <CampaignCreateForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          quotaExceeded
        />,
        { wrapper: TestWrapper }
      )

      expect(
        screen.getByText('이번 주 캠페인 생성 횟수를 모두 사용했어요')
      ).toBeInTheDocument()
    })

    it('should disable submit button when quota exceeded', async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          quotaExceeded
        />,
        { wrapper: TestWrapper }
      )

      // Navigate to step 4 to see submit button
      await user.type(screen.getByLabelText('캠페인 이름'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음' }))
      await waitFor(() => screen.getByText('타겟 오디언스'))
      await user.click(screen.getByRole('button', { name: '다음' }))
      await waitFor(() => screen.getByLabelText('일일 예산'))
      await user.clear(screen.getByLabelText('일일 예산'))
      await user.type(screen.getByLabelText('일일 예산'), '50000')
      await user.click(screen.getByRole('button', { name: '다음' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '캠페인 생성' })).toBeDisabled()
      })
    })
  })

  describe('진행 표시', () => {
    it('should show step indicator', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      expect(screen.getByText('1/4')).toBeInTheDocument()
    })

    it('should update step indicator on navigation', async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      await user.type(screen.getByLabelText('캠페인 이름'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음' }))

      await waitFor(() => {
        expect(screen.getByText('2/4')).toBeInTheDocument()
      })
    })
  })
})
