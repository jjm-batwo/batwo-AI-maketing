import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

import { useOnboardingStore } from '@presentation/stores/onboardingStore'

describe('onboardingStore', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    // Reset store state
    const { result } = renderHook(() => useOnboardingStore())
    act(() => {
      result.current.reset()
    })
  })

  describe('initialization', () => {
    it('should initialize with step 1 for new users', () => {
      const { result } = renderHook(() => useOnboardingStore())

      expect(result.current.currentStep).toBe(1)
      expect(result.current.isCompleted).toBe(false)
    })

    it('should have total of 3 steps', () => {
      const { result } = renderHook(() => useOnboardingStore())

      expect(result.current.totalSteps).toBe(3)
    })
  })

  describe('navigation', () => {
    it('should advance to next step', () => {
      const { result } = renderHook(() => useOnboardingStore())

      act(() => {
        result.current.nextStep()
      })

      expect(result.current.currentStep).toBe(2)
    })

    it('should not exceed total steps', () => {
      const { result } = renderHook(() => useOnboardingStore())

      act(() => {
        result.current.nextStep() // 2
        result.current.nextStep() // 3
        result.current.nextStep() // should stay at 3
      })

      expect(result.current.currentStep).toBe(3)
    })

    it('should go back to previous step', () => {
      const { result } = renderHook(() => useOnboardingStore())

      act(() => {
        result.current.nextStep() // 2
        result.current.prevStep() // 1
      })

      expect(result.current.currentStep).toBe(1)
    })

    it('should not go below step 1', () => {
      const { result } = renderHook(() => useOnboardingStore())

      act(() => {
        result.current.prevStep() // should stay at 1
      })

      expect(result.current.currentStep).toBe(1)
    })

    it('should go to specific step', () => {
      const { result } = renderHook(() => useOnboardingStore())

      act(() => {
        result.current.goToStep(3)
      })

      expect(result.current.currentStep).toBe(3)
    })
  })

  describe('completion', () => {
    it('should mark onboarding as complete', () => {
      const { result } = renderHook(() => useOnboardingStore())

      act(() => {
        result.current.completeOnboarding()
      })

      expect(result.current.isCompleted).toBe(true)
    })

    it('should persist completion status to localStorage', () => {
      const { result } = renderHook(() => useOnboardingStore())

      act(() => {
        result.current.completeOnboarding()
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'batwo_onboarding_completed',
        'true'
      )
    })

    it('should check localStorage for completion status on init', () => {
      localStorageMock.getItem.mockReturnValueOnce('true')

      const { result } = renderHook(() => useOnboardingStore())

      act(() => {
        result.current.checkOnboardingStatus()
      })

      expect(result.current.isCompleted).toBe(true)
    })
  })

  describe('skip functionality', () => {
    it('should skip onboarding and mark as completed', () => {
      const { result } = renderHook(() => useOnboardingStore())

      act(() => {
        result.current.skipOnboarding()
      })

      expect(result.current.isCompleted).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'batwo_onboarding_completed',
        'true'
      )
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useOnboardingStore())

      act(() => {
        result.current.nextStep()
        result.current.nextStep()
        result.current.completeOnboarding()
        result.current.reset()
      })

      expect(result.current.currentStep).toBe(1)
      expect(result.current.isCompleted).toBe(false)
    })
  })
})
