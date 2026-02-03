import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const STORAGE_KEY = 'batwo_onboarding'

interface OnboardingState {
  currentStep: number
  totalSteps: number
  isCompleted: boolean
  _hasHydrated: boolean

  // Navigation
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void

  // Completion
  completeOnboarding: () => void
  skipOnboarding: () => void

  // Hydration
  setHasHydrated: (state: boolean) => void

  // Reset
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      totalSteps: 4,  // 1: Welcome, 2: Meta 연결, 3: 픽셀 설치, 4: Completion
      isCompleted: false,
      _hasHydrated: false,

      nextStep: () => {
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.totalSteps),
        }))
      },

      prevStep: () => {
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        }))
      },

      goToStep: (step: number) => {
        const { totalSteps } = get()
        set({
          currentStep: Math.max(1, Math.min(step, totalSteps)),
        })
      },

      completeOnboarding: () => {
        set({ isCompleted: true })
      },

      skipOnboarding: () => {
        set({ isCompleted: true })
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state })
      },

      reset: () => {
        set({
          currentStep: 1,
          isCompleted: false,
        })
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isCompleted: state.isCompleted,
        currentStep: state.currentStep,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
