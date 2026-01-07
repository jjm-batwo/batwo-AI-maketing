import { create } from 'zustand'

const STORAGE_KEY = 'batwo_onboarding_completed'

interface OnboardingState {
  currentStep: number
  totalSteps: number
  isCompleted: boolean

  // Navigation
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void

  // Completion
  completeOnboarding: () => void
  skipOnboarding: () => void
  checkOnboardingStatus: () => boolean

  // Reset
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 1,
  totalSteps: 3,
  isCompleted: false,

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
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    set({ isCompleted: true })
  },

  skipOnboarding: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    set({ isCompleted: true })
  },

  checkOnboardingStatus: () => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(STORAGE_KEY) === 'true'
      set({ isCompleted: completed })
      return completed
    }
    return false
  },

  reset: () => {
    set({
      currentStep: 1,
      isCompleted: false,
    })
  },
}))
