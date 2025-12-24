import { create } from 'zustand'

interface QuotaState {
  // Dialog visibility
  isQuotaExceededDialogOpen: boolean
  exceededQuotaType: 'campaigns' | 'aiReports' | 'apiCalls' | 'adSpend' | null
  openQuotaExceededDialog: (type: 'campaigns' | 'aiReports' | 'apiCalls' | 'adSpend') => void
  closeQuotaExceededDialog: () => void

  // Upgrade modal
  isUpgradeModalOpen: boolean
  openUpgradeModal: () => void
  closeUpgradeModal: () => void

  // Warning thresholds (percentage)
  warningThreshold: number
  criticalThreshold: number
  setWarningThreshold: (threshold: number) => void
  setCriticalThreshold: (threshold: number) => void

  // Dismissed warnings (won't show again until reset)
  dismissedWarnings: Set<string>
  dismissWarning: (quotaType: string) => void
  resetDismissedWarnings: () => void
}

export const useQuotaStore = create<QuotaState>((set) => ({
  // Dialog visibility
  isQuotaExceededDialogOpen: false,
  exceededQuotaType: null,
  openQuotaExceededDialog: (type) =>
    set({
      isQuotaExceededDialogOpen: true,
      exceededQuotaType: type,
    }),
  closeQuotaExceededDialog: () =>
    set({
      isQuotaExceededDialogOpen: false,
      exceededQuotaType: null,
    }),

  // Upgrade modal
  isUpgradeModalOpen: false,
  openUpgradeModal: () => set({ isUpgradeModalOpen: true }),
  closeUpgradeModal: () => set({ isUpgradeModalOpen: false }),

  // Thresholds
  warningThreshold: 80,
  criticalThreshold: 95,
  setWarningThreshold: (threshold) => set({ warningThreshold: threshold }),
  setCriticalThreshold: (threshold) => set({ criticalThreshold: threshold }),

  // Dismissed warnings
  dismissedWarnings: new Set(),
  dismissWarning: (quotaType) =>
    set((state) => ({
      dismissedWarnings: new Set(state.dismissedWarnings).add(quotaType),
    })),
  resetDismissedWarnings: () => set({ dismissedWarnings: new Set() }),
}))
