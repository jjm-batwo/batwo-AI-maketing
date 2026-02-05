import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingWizard } from '@presentation/components/onboarding/OnboardingWizard'
import { useOnboardingStore } from '@presentation/stores/onboardingStore'
import { NextIntlClientProvider } from 'next-intl'

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

// Mock next-intl with Korean translations
const mockTranslations: Record<string, Record<string, string>> = {
  'onboarding': {
    'steps.start': '바투에 오신 것을 환영합니다',
    'steps.metaConnect': 'Meta 광고 계정 연결',
    'steps.pixelSetup': '픽셀 설치',
    'steps.complete': '설정이 완료되었습니다',
    'buttons.next': '다음',
    'buttons.previous': '이전',
    'buttons.skip': '건너뛰기',
    'buttons.start': '시작하기',
    'aria.wizard': '온보딩 위저드',
    'aria.progress': '온보딩 진행률',
  },
  'onboarding.welcome': {
    'title': '바투에 오신 것을 환영합니다',
    'description': 'AI 마케팅 자동화 시작하기',
    'feature1.title': '자동화된 광고 캠페인',
    'feature1.description': 'Meta 광고를 자동으로 관리하세요',
    'feature2.title': '실시간 성과 분석',
    'feature2.description': 'AI가 분석한 인사이트를 받아보세요',
  },
  'onboarding.metaConnect': {
    'title': 'Meta 광고 계정 연결',
  },
  'onboarding.pixelSetup': {
    'title': '픽셀 설치',
    'description': 'Meta 픽셀을 설치하여 광고 성과를 추적하세요',
    'benefits.title': '픽셀 설치 효과',
  },
  'onboarding.completion': {
    'title': '설정이 완료되었습니다',
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

const mockStore = {
  currentStep: 1,
  totalSteps: 4,
  isCompleted: false,
  _hasHydrated: true,
  nextStep: vi.fn(),
  prevStep: vi.fn(),
  completeOnboarding: vi.fn(),
  skipOnboarding: vi.fn(),
  checkOnboardingStatus: vi.fn(),
  goToStep: vi.fn(),
  reset: vi.fn(),
}

function createIntlWrapper() {
  return function IntlWrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale="ko" messages={{}}>
        {children}
      </NextIntlClientProvider>
    )
  }
}

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useOnboardingStore).mockReturnValue(mockStore)
  })

  describe('rendering', () => {
    it('should render welcome step initially', () => {
      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      // WelcomeStep has unique content (description and features)
      expect(screen.getByText(/자동화된 광고 캠페인/i)).toBeInTheDocument()
    })

    it('should show progress indicator', () => {
      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      expect(screen.getByText('1/4')).toBeInTheDocument()
    })

    it('should not render if onboarding completed', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        isCompleted: true,
      })

      const { container } = render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      expect(container.firstChild).toBeNull()
    })
  })

  describe('navigation', () => {
    it('should navigate to next step on button click', async () => {
      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      const nextButton = screen.getByRole('button', { name: /다음/i })
      fireEvent.click(nextButton)

      expect(mockStore.nextStep).toHaveBeenCalled()
    })

    it('should show back button from step 2', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 2,
      })

      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      expect(screen.getByRole('button', { name: /이전/i })).toBeInTheDocument()
    })

    it('should navigate back on back button click', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 2,
      })

      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

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

      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      // Check for unique content of Meta Connect step
      expect(screen.getByText(/permissions.adsRead.title/i)).toBeInTheDocument()
    })

    it('should render pixel setup step at step 3', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 3,
      })

      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      // Pixel setup step shows unique content
      expect(screen.getByText(/Meta 픽셀을 설치하여/i)).toBeInTheDocument()
      expect(screen.getByText(/픽셀 설치 효과/i)).toBeInTheDocument()
    })

    it('should render completion step at step 4', () => {
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 4,
      })

      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      // Check for unique completion step content (the next steps section)
      expect(screen.getByText(/nextSteps.title/i)).toBeInTheDocument()
    })
  })

  describe('completion', () => {
    it('should call onComplete when finish button clicked', () => {
      const onComplete = vi.fn()
      vi.mocked(useOnboardingStore).mockReturnValue({
        ...mockStore,
        currentStep: 4,
      })

      render(<OnboardingWizard onComplete={onComplete} />, {
        wrapper: createIntlWrapper(),
      })

      const finishButton = screen.getByRole('button', { name: /시작하기/i })
      fireEvent.click(finishButton)

      expect(mockStore.completeOnboarding).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
    })
  })

  describe('skip functionality', () => {
    it('should show skip button', () => {
      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      expect(screen.getByRole('button', { name: /건너뛰기/i })).toBeInTheDocument()
    })

    it('should call skipOnboarding when skip clicked', () => {
      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      const skipButton = screen.getByRole('button', { name: /건너뛰기/i })
      fireEvent.click(skipButton)

      expect(mockStore.skipOnboarding).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper aria labels', () => {
      render(<OnboardingWizard />, {
        wrapper: createIntlWrapper(),
      })

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-label',
        '온보딩 진행률'
      )
    })
  })
})
