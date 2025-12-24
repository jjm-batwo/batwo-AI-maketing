import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CampaignFilters {
  status: 'ALL' | 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'COMPLETED'
  sortBy: 'createdAt' | 'name' | 'spend' | 'roas'
  sortOrder: 'asc' | 'desc'
  searchQuery: string
}

interface CampaignFormDraft {
  name?: string
  objective?: string
  targetAudience?: {
    ageMin?: number
    ageMax?: number
    gender?: 'ALL' | 'MALE' | 'FEMALE'
    locations?: string[]
    interests?: string[]
  }
  dailyBudget?: number
  startDate?: string
  endDate?: string
}

interface CampaignState {
  // Filters
  filters: CampaignFilters
  setFilters: (filters: Partial<CampaignFilters>) => void
  resetFilters: () => void

  // Selected campaigns
  selectedCampaignIds: string[]
  selectCampaign: (id: string) => void
  deselectCampaign: (id: string) => void
  selectAllCampaigns: (ids: string[]) => void
  clearSelection: () => void

  // Form draft (persisted)
  formDraft: CampaignFormDraft | null
  saveFormDraft: (draft: CampaignFormDraft) => void
  clearFormDraft: () => void

  // Current step in create form
  currentStep: number
  setCurrentStep: (step: number) => void
}

const defaultFilters: CampaignFilters = {
  status: 'ALL',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  searchQuery: '',
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set) => ({
      // Filters
      filters: defaultFilters,
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),

      // Selected campaigns
      selectedCampaignIds: [],
      selectCampaign: (id) =>
        set((state) => ({
          selectedCampaignIds: state.selectedCampaignIds.includes(id)
            ? state.selectedCampaignIds
            : [...state.selectedCampaignIds, id],
        })),
      deselectCampaign: (id) =>
        set((state) => ({
          selectedCampaignIds: state.selectedCampaignIds.filter((cid) => cid !== id),
        })),
      selectAllCampaigns: (ids) => set({ selectedCampaignIds: ids }),
      clearSelection: () => set({ selectedCampaignIds: [] }),

      // Form draft
      formDraft: null,
      saveFormDraft: (draft) =>
        set((state) => ({
          formDraft: { ...state.formDraft, ...draft },
        })),
      clearFormDraft: () => set({ formDraft: null, currentStep: 1 }),

      // Current step
      currentStep: 1,
      setCurrentStep: (step) => set({ currentStep: step }),
    }),
    {
      name: 'campaign-store',
      partialize: (state) => ({
        formDraft: state.formDraft,
        currentStep: state.currentStep,
      }),
    }
  )
)
