import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingWizard } from '@presentation/components/onboarding/OnboardingWizard'
import { useOnboardingStore } from '@presentation/stores/onboardingStore'

// Mock the store
vi.mock('@presentation/stores/onboardingStore', () => ({
  useOnboardingStore: vi.fn(),
}))

// Mock next-auth/react for MetaConnectStep
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}))

const mockStore = {
  currentStep: 1,
  totalSteps: 4,
  isCompleted: false,
  nextStep: vi.fn(),
  prevStep: vi.fn(),
  completeOnboarding: vi.fn(),
  skipOnboarding: vi.fn(),
  checkOnboardingStatus: vi.fn(),
  goToStep: vi.fn(),
  reset: vi.fn(),
}

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useOnboardingStore).mockReturnValue(mockStore)
  })

  describe('rendering', () => {
    it('should render welcome step initially', () => {
      render(<OnboardingWizard />)

      expect(screen.getByText(/바투에 오신 것을 환영합니다/i)).toBeInTheDocument()
    })

    it('should show progress indicator', () => {
      render(<OnboardingWizard />)

      expect(screen.getByText('1/4')).toBeInTheDocument()
    })

    it('should not render if onboarding completed', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        isCompleted: true,
      })

      const { container } = render(<OnboardingWizard />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('navigation', () => {
    it('should navigate to next step on button click', async () => {
      render(<OnboardingWizard />)

      const nextButton = screen.getByRole('button', { name: /다음/i })
      fireEvent.click(nextButton)

      expect(mockStore.nextStep).toHaveBeenCalled()
    })

    it('should show back button from step 2', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 2,
      })

      render(<OnboardingWizard />)

      expect(screen.getByRole('button', { name: /이전/i })).toBeInTheDocument()
    })

    it('should navigate back on back button click', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 2,
      })

      render(<OnboardingWizard />)

      const backButton = screen.getByRole('button', { name: /이전/i })
      fireEvent.click(backButton)

      expect(mockStore.prevStep).toHaveBeenCalled()
    })
  })

  describe('step content', () => {
    it('should render Meta connect step at step 2', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 2,
      })

      render(<OnboardingWizard />)

      expect(screen.getByText(/Meta 광고 계정 연결/i)).toBeInTheDocument()
    })

    it('should render pixel setup step at step 3', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 3,
      })

      render(<OnboardingWizard />)

      // Pixel setup step shows unique content
      expect(screen.getByText(/Meta 픽셀을 설치하여/i)).toBeInTheDocument()
      expect(screen.getByText(/픽셀 설치 효과/i)).toBeInTheDocument()
    })

    it('should render completion step at step 4', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 4,
      })

      render(<OnboardingWizard />)

      expect(screen.getByText(/설정이 완료되었습니다/i)).toBeInTheDocument()
    })
  })

  describe('completion', () => {
    it('should call onComplete when finish button clicked', () => {
      const onComplete = vi.fn()
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 4,
      })

      render(<OnboardingWizard onComplete={onComplete} />)

      const finishButton = screen.getByRole('button', { name: /시작하기/i })
      fireEvent.click(finishButton)

      expect(mockStore.completeOnboarding).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
    })
  })

  describe('skip functionality', () => {
    it('should show skip button', () => {
      render(<OnboardingWizard />)

      expect(screen.getByRole('button', { name: /건너뛰기/i })).toBeInTheDocument()
    })

    it('should call skipOnboarding when skip clicked', () => {
      render(<OnboardingWizard />)

      const skipButton = screen.getByRole('button', { name: /건너뛰기/i })
      fireEvent.click(skipButton)

      expect(mockStore.skipOnboarding).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper aria labels', () => {
      render(<OnboardingWizard />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-label',
        '온보딩 진행률'
      )
    })
  })
})
