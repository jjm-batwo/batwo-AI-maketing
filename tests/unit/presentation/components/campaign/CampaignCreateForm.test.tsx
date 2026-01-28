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

  // Helper to skip template selection (step 0)
  const skipTemplateSelection = async () => {
    const user = userEvent.setup()
    await user.click(screen.getByText('템플릿 없이 직접 설정하기'))
    await waitFor(
      () => {
        expect(screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션')).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
    return user
  }

  describe('Step 0: 템플릿 선택', () => {
    it('should render template selection as first step', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      expect(screen.getByText('빠른 시작')).toBeInTheDocument()
      expect(screen.getByText('템플릿 없이 직접 설정하기')).toBeInTheDocument()
    })

    it('should show template selector with tips', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      expect(screen.getByText('템플릿을 선택하면 목표, 예산, 타겟이 자동으로 설정됩니다')).toBeInTheDocument()
    })

    it('should not show step indicator on step 0', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      expect(screen.queryByText('0/4')).not.toBeInTheDocument()
      expect(screen.queryByText('1/4')).not.toBeInTheDocument()
    })
  })

  describe('Step 1: 비즈니스 정보', () => {
    it('should render campaign name input after skipping template', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      await skipTemplateSelection()
      expect(screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션')).toBeInTheDocument()
    })

    it('should render objective selection after skipping template', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      await skipTemplateSelection()
      expect(screen.getByText('캠페인 목표')).toBeInTheDocument()
      expect(screen.getByText('트래픽')).toBeInTheDocument()
      expect(screen.getByText('전환')).toBeInTheDocument()
      expect(screen.getByText('브랜드 인지도')).toBeInTheDocument()
    })

    it('should show validation error for empty name', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      const user = await skipTemplateSelection()

      const nextButton = screen.getByRole('button', { name: '다음 단계로 이동' })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('캠페인 이름을 입력해주세요')).toBeInTheDocument()
      })
    })

    it('should proceed to step 2 with valid input', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      const user = await skipTemplateSelection()

      await user.type(screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))

      await waitFor(() => {
        expect(screen.getByText('2단계: 타겟 오디언스')).toBeInTheDocument()
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
      // Skip template selection
      await user.click(screen.getByText('템플릿 없이 직접 설정하기'))
      await waitFor(() => screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션'))
      await user.type(screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))
      await waitFor(() => {
        expect(screen.getByText('2단계: 타겟 오디언스')).toBeInTheDocument()
      })
      return user
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
      const user = await goToStep2()
      await user.click(screen.getByRole('button', { name: '이전 단계로 이동' }))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션')).toBeInTheDocument()
      })
    })
  })

  describe('Step 3: 예산 설정', () => {
    const goToStep3 = async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      // Skip template selection and navigate to step 3
      await user.click(screen.getByText('템플릿 없이 직접 설정하기'))
      await waitFor(() => screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션'))
      await user.type(screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))
      await waitFor(() => screen.getByText('2단계: 타겟 오디언스'))
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))
      await waitFor(() => screen.getByRole('spinbutton', { name: /일일 예산/ }))
      return user
    }

    it('should render daily budget input', async () => {
      await goToStep3()
      expect(screen.getByText('3단계: 예산 설정')).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /일일 예산/ })).toBeInTheDocument()
    })

    it('should validate minimum budget', async () => {
      const user = await goToStep3()

      await user.clear(screen.getByRole('spinbutton', { name: /일일 예산/ }))
      await user.type(screen.getByRole('spinbutton', { name: /일일 예산/ }), '1000')
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))

      await waitFor(() => {
        expect(
          screen.getByText('최소 일일 예산은 10,000원입니다')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Step 4: 최종 확인', () => {
    const goToStep4 = async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      // Skip template and navigate through all steps
      await user.click(screen.getByText('템플릿 없이 직접 설정하기'))
      await waitFor(() => screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션'))
      await user.type(screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))
      await waitFor(() => screen.getByText('2단계: 타겟 오디언스'))
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))
      await waitFor(() => screen.getByRole('spinbutton', { name: /일일 예산/ }))
      await user.clear(screen.getByRole('spinbutton', { name: /일일 예산/ }))
      await user.type(screen.getByRole('spinbutton', { name: /일일 예산/ }), '50000')
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))
      await waitFor(() => screen.getByText('4단계: 최종 확인'))
      return user
    }

    it('should display summary of all inputs', async () => {
      await goToStep4()

      expect(screen.getByText('4단계: 최종 확인')).toBeInTheDocument()
      expect(screen.getByText('테스트 캠페인')).toBeInTheDocument()
      expect(screen.getByText('전환')).toBeInTheDocument()
      expect(screen.getByText('50,000원')).toBeInTheDocument()
    })

    it('should call onSubmit with correct data', async () => {
      const user = await goToStep4()
      await user.click(screen.getByRole('button', { name: '캠페인 생성하기' }))

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
    it('should call onCancel when cancel button is clicked on step 0', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      // Cancel button not visible on step 0 (template selection has no cancel)
      // Skip to step 1 first
      const user = await skipTemplateSelection()
      await user.click(screen.getByRole('button', { name: '캠페인 생성 취소' }))
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('쿼터 체크', () => {
    it('should show quota exceeded message when limit reached', async () => {
      render(
        <CampaignCreateForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          quotaExceeded
        />,
        { wrapper: TestWrapper }
      )

      // Quota message is shown on any step
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

      // Skip template and navigate to step 4 to see submit button
      await user.click(screen.getByText('템플릿 없이 직접 설정하기'))
      await waitFor(() => screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션'))
      await user.type(screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))
      await waitFor(() => screen.getByText('2단계: 타겟 오디언스'))
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))
      await waitFor(() => screen.getByRole('spinbutton', { name: /일일 예산/ }))
      await user.clear(screen.getByRole('spinbutton', { name: /일일 예산/ }))
      await user.type(screen.getByRole('spinbutton', { name: /일일 예산/ }), '50000')
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '캠페인 생성하기' })).toBeDisabled()
      })
    })
  })

  describe('진행 표시', () => {
    it('should show step indicator after skipping template', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      await skipTemplateSelection()

      expect(screen.getByText('1/4')).toBeInTheDocument()
    })

    it('should update step indicator on navigation', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      const user = await skipTemplateSelection()

      await user.type(screen.getByPlaceholderText('예: 2024년 크리스마스 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('전환'))
      await user.click(screen.getByRole('button', { name: '다음 단계로 이동' }))

      await waitFor(() => {
        expect(screen.getByText('2/4')).toBeInTheDocument()
      })
    })
  })
})
