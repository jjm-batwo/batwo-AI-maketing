import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CampaignFilters {
  status: 'ALL' | 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'COMPLETED'
  sortBy:
    | 'createdAt'
    | 'name'
    | 'spend'
    | 'roas'
    | 'ctr'
    | 'cpc'
    | 'cpa'
    | 'cvr'
    | 'cpm'
    | 'reach'
    | 'impressions'
    | 'clicks'
    | 'conversions'
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

// AI 가이드 추천 데이터 인터페이스
interface GuideRecommendation {
  formData: {
    objective?: string
    dailyBudget?: number
    campaignMode?: string
  }
  context?: string // AI 추천 이유
  timestamp: number
}

type ColumnKey =
  | 'spend'
  | 'roas'
  | 'ctr'
  | 'cpc'
  | 'cpa'
  | 'cvr'
  | 'cpm'
  | 'reach'
  | 'impressions'
  | 'clicks'
  | 'conversions'
  | 'createdAt'



// 기본 컬럼 순서 (드래그 정렬 가능)
const defaultColumnOrder: ColumnKey[] = [
  'spend',
  'roas',
  'ctr',
  'cpc',
  'cpa',
  'cvr',
  'cpm',
  'reach',
  'impressions',
  'clicks',
  'conversions',
  'createdAt',
]

// Column preset type
interface ColumnPreset {
  id: string
  name: string
  visibleColumns: Record<ColumnKey, boolean>
  columnOrder: ColumnKey[]
  createdAt: number
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

  // AI 가이드 추천 (비영속적)
  guideRecommendation: GuideRecommendation | null
  setGuideRecommendation: (recommendation: GuideRecommendation) => void
  clearGuideRecommendation: () => void

  // Table column settings (persisted)
  visibleColumns: Record<ColumnKey, boolean>
  setVisibleColumn: (column: ColumnKey, visible: boolean) => void
  resetVisibleColumns: () => void
  // Table column order (persisted) - for drag-and-drop reordering
  columnOrder: ColumnKey[]
  setColumnOrder: (order: ColumnKey[]) => void
  moveColumn: (fromIndex: number, toIndex: number) => void
  resetColumnOrder: () => void

  // Column presets (persisted) - save/load custom column configurations
  columnPresets: ColumnPreset[]
  saveColumnPreset: (name: string) => void
  loadColumnPreset: (presetId: string) => void
  deleteColumnPreset: (presetId: string) => void
}

const defaultFilters: CampaignFilters = {
  status: 'ALL',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  searchQuery: '',
}

const defaultVisibleColumns: Record<ColumnKey, boolean> = {
  spend: true,
  roas: true,
  ctr: true,
  cpc: true,
  cpa: true,
  cvr: true,
  cpm: true,
  reach: true,
  impressions: true,
  clicks: true,
  conversions: true,
  createdAt: true,
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

      // AI 가이드 추천 (비영속적 - persist에서 제외됨)
      guideRecommendation: null,
      setGuideRecommendation: (recommendation) => set({ guideRecommendation: recommendation }),
      clearGuideRecommendation: () => set({ guideRecommendation: null }),

      // Table column settings (persisted)
      visibleColumns: defaultVisibleColumns,
      setVisibleColumn: (column, visible) =>
        set((state) => ({
          visibleColumns: { ...state.visibleColumns, [column]: visible },
        })),
      resetVisibleColumns: () => set({ visibleColumns: defaultVisibleColumns }),

      // Table column order (persisted)
      columnOrder: defaultColumnOrder,
      setColumnOrder: (order) => set({ columnOrder: order }),
      moveColumn: (fromIndex, toIndex) =>
        set((state) => {
          const newOrder = [...state.columnOrder]
          const [moved] = newOrder.splice(fromIndex, 1)
          newOrder.splice(toIndex, 0, moved)
          return { columnOrder: newOrder }
        }),
      resetColumnOrder: () => set({ columnOrder: defaultColumnOrder }),


      // Column presets (persisted)
      columnPresets: [],
      saveColumnPreset: (name) =>
        set((state) => {
          const newPreset: ColumnPreset = {
            id: crypto.randomUUID(),
            name,
            visibleColumns: { ...state.visibleColumns },
            columnOrder: [...state.columnOrder],
            createdAt: Date.now(),
          }
          return { columnPresets: [...state.columnPresets, newPreset] }
        }),
      loadColumnPreset: (presetId) =>
        set((state) => {
          const preset = state.columnPresets.find((p) => p.id === presetId)
          if (preset) {
            return {
              visibleColumns: { ...preset.visibleColumns },
              columnOrder: [...preset.columnOrder],
            }
          }
          return state
        }),
      deleteColumnPreset: (presetId) =>
        set((state) => ({
          columnPresets: state.columnPresets.filter((p) => p.id !== presetId),
        })),
    }),
    {
      name: 'campaign-store',
      partialize: (state) => ({
        formDraft: state.formDraft,
        currentStep: state.currentStep,
        visibleColumns: state.visibleColumns,
        columnOrder: state.columnOrder,

        columnPresets: state.columnPresets,
      }),
      merge: (persistedState: unknown, currentState: CampaignState) => {
        const persisted = persistedState as Partial<CampaignState> || {}
        
        // 저장된 visibleColumns에 누락된 새 컬럼을 기본값으로 병합
        const mergedVisibleColumns: Record<ColumnKey, boolean> = {
          ...currentState.visibleColumns,
          ...(persisted.visibleColumns || {}),
        }

        // 저장된 columnOrder에 누락된 새 컬럼 추가
        const persistedOrder = persisted.columnOrder || []
        const currentOrder = currentState.columnOrder
        const missingColumns = currentOrder.filter(col => !persistedOrder.includes(col))
        const mergedColumnOrder = [...persistedOrder, ...missingColumns]

        return {
          ...currentState,
          ...persisted,
          visibleColumns: mergedVisibleColumns,
          columnOrder: mergedColumnOrder.length > 0 ? mergedColumnOrder : currentOrder,
        }
      },
    }
  )
)

export type { ColumnKey, ColumnPreset }
export { defaultVisibleColumns, defaultColumnOrder }
