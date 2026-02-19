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

  // 크리에이티브 필수 필드 채우기 헬퍼
  const fillCreativeFields = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByPlaceholderText('예: 봄맞이 특별 할인 최대 50%'), '테스트 헤드라인')
    await user.type(screen.getByPlaceholderText('광고에 표시될 메인 텍스트를 입력하세요'), '테스트 광고 본문')
  }

  describe('Step 1: 캠페인 유형', () => {
    it('should render campaign type selection as first step', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      // CardTitle과 Label에 모두 "캠페인 유형"이 존재
      const elements = screen.getAllByText('캠페인 유형')
      expect(elements.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Advantage+ 쇼핑')).toBeInTheDocument()
      expect(screen.getByText('수동 설정')).toBeInTheDocument()
    })

    it('should default to Advantage+ mode', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      expect(screen.getByText('AI가 타겟팅, 배치, 예산을 자동으로 최적화합니다')).toBeInTheDocument()
    })

    it('should render campaign name input', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      expect(screen.getByPlaceholderText('예: 2026년 봄 신상품 프로모션')).toBeInTheDocument()
    })

    it('should render objective selection', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      expect(screen.getByText('캠페인 목표')).toBeInTheDocument()
      expect(screen.getByText('트래픽')).toBeInTheDocument()
      // '전환'은 기본 선택된 objective에도 있으므로 getAllByText 사용
      expect(screen.getAllByText('전환').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('브랜드 인지도')).toBeInTheDocument()
    })

    it('should show validation error for empty name', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      const user = userEvent.setup()

      const nameInput = screen.getByPlaceholderText('예: 2026년 봄 신상품 프로모션')
      await user.clear(nameInput)
      await user.click(screen.getByText('다음'))

      await waitFor(() => {
        expect(screen.getByText('캠페인 이름을 입력해주세요')).toBeInTheDocument()
      })
    })

    it('should proceed to step 2 with valid input in Advantage+ mode', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      const user = userEvent.setup()

      await user.type(screen.getByPlaceholderText('예: 2026년 봄 신상품 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('다음'))

      await waitFor(() => {
        expect(screen.getByText('예산 & 일정')).toBeInTheDocument()
      })
    })
  })

  describe('Step 2: 예산 & 일정 (Advantage+ 모드)', () => {
    const goToBudgetStep = async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      await user.type(screen.getByPlaceholderText('예: 2026년 봄 신상품 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('다음'))
      await waitFor(() => screen.getByText('예산 & 일정'))
      return user
    }

    it('should render daily budget input', async () => {
      await goToBudgetStep()
      expect(screen.getByText('예산 & 일정')).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /일일 예산/ })).toBeInTheDocument()
    })

    it('should validate minimum budget', async () => {
      const user = await goToBudgetStep()

      await user.clear(screen.getByRole('spinbutton', { name: /일일 예산/ }))
      await user.type(screen.getByRole('spinbutton', { name: /일일 예산/ }), '1000')
      await user.click(screen.getByText('다음'))

      await waitFor(() => {
        // formatBudget은 Intl.NumberFormat으로 ₩10,000 형식 출력
        expect(screen.getByText(/최소 일일 예산은/)).toBeInTheDocument()
      })
    })

    it('should allow going back to step 1', async () => {
      const user = await goToBudgetStep()
      await user.click(screen.getByText('이전'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('예: 2026년 봄 신상품 프로모션')).toBeInTheDocument()
      })
    })
  })

  describe('수동 모드 전환', () => {
    it('should switch to 6-step flow when Manual mode is selected', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      const user = userEvent.setup()

      await user.click(screen.getByText('수동 설정'))

      expect(screen.getByText('1/6')).toBeInTheDocument()
    })

    it('should show target audience as step 2 in Manual mode', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      const user = userEvent.setup()

      await user.click(screen.getByText('수동 설정'))
      await user.type(screen.getByPlaceholderText('예: 2026년 봄 신상품 프로모션'), '수동 캠페인')
      await user.click(screen.getByText('다음'))

      await waitFor(() => {
        expect(screen.getByText('타겟 오디언스')).toBeInTheDocument()
      })
    })
  })

  describe('최종 검토 (Advantage+ 모드)', () => {
    const goToReviewStep = async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      // Step 1: 캠페인 유형
      await user.type(screen.getByPlaceholderText('예: 2026년 봄 신상품 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('다음'))
      await waitFor(() => screen.getByText('예산 & 일정'))

      // Step 2: 예산
      await user.clear(screen.getByRole('spinbutton', { name: /일일 예산/ }))
      await user.type(screen.getByRole('spinbutton', { name: /일일 예산/ }), '50000')
      await user.click(screen.getByText('다음'))
      await waitFor(() => screen.getByText('크리에이티브'))

      // Step 3: 크리에이티브 필수 필드 입력
      await fillCreativeFields(user)
      await user.click(screen.getByText('다음'))
      await waitFor(() => screen.getByText('검토 & 제출'))
      return user
    }

    it('should display summary of campaign info', async () => {
      await goToReviewStep()

      expect(screen.getByText('최종 확인')).toBeInTheDocument()
      expect(screen.getByText('테스트 캠페인')).toBeInTheDocument()
      expect(screen.getByText('50,000원')).toBeInTheDocument()
    })

    it('should show Advantage+ info banner', async () => {
      await goToReviewStep()

      expect(screen.getByText(/AI가 타겟팅, 배치, 예산을 자동으로 최적화합니다/)).toBeInTheDocument()
    })

    it('should call onSubmit with correct data', async () => {
      const user = await goToReviewStep()
      await user.click(screen.getByText('캠페인 생성'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '테스트 캠페인',
            objective: 'CONVERSIONS',
            dailyBudget: 50000,
            campaignMode: 'ADVANTAGE_PLUS',
          })
        )
      })
    })
  })

  describe('취소', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )

      const user = userEvent.setup()
      await user.click(screen.getByText('취소'))
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('쿼터 체크', () => {
    it('should show quota exceeded message on last step', async () => {
      const user = userEvent.setup()
      render(
        <CampaignCreateForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          quotaExceeded
        />,
        { wrapper: TestWrapper }
      )

      // 마지막 단계까지 이동
      await user.type(screen.getByPlaceholderText('예: 2026년 봄 신상품 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('다음'))
      await waitFor(() => screen.getByText('예산 & 일정'))

      await user.clear(screen.getByRole('spinbutton', { name: /일일 예산/ }))
      await user.type(screen.getByRole('spinbutton', { name: /일일 예산/ }), '50000')
      await user.click(screen.getByText('다음'))
      await waitFor(() => screen.getByText('크리에이티브'))

      await fillCreativeFields(user)
      await user.click(screen.getByText('다음'))
      await waitFor(() => screen.getByText('검토 & 제출'))

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

      // 마지막 단계까지 이동
      await user.type(screen.getByPlaceholderText('예: 2026년 봄 신상품 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('다음'))
      await waitFor(() => screen.getByText('예산 & 일정'))

      await user.clear(screen.getByRole('spinbutton', { name: /일일 예산/ }))
      await user.type(screen.getByRole('spinbutton', { name: /일일 예산/ }), '50000')
      await user.click(screen.getByText('다음'))
      await waitFor(() => screen.getByText('크리에이티브'))

      await fillCreativeFields(user)
      await user.click(screen.getByText('다음'))
      await waitFor(() => screen.getByText('검토 & 제출'))

      expect(screen.getByText('캠페인 생성')).toBeDisabled()
    })
  })

  describe('진행 표시', () => {
    it('should show step indicator with Advantage+ total steps', () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      expect(screen.getByText('1/4')).toBeInTheDocument()
    })

    it('should update step indicator on navigation', async () => {
      render(
        <CampaignCreateForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
        { wrapper: TestWrapper }
      )
      const user = userEvent.setup()

      await user.type(screen.getByPlaceholderText('예: 2026년 봄 신상품 프로모션'), '테스트 캠페인')
      await user.click(screen.getByText('다음'))

      await waitFor(() => {
        expect(screen.getByText('2/4')).toBeInTheDocument()
      })
    })
  })
})
