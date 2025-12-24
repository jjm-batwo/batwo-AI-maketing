import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface Modal {
  id: string
  component: string
  props?: Record<string, unknown>
}

interface UIState {
  // Sidebar
  isSidebarOpen: boolean
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
  collapseSidebar: () => void
  expandSidebar: () => void

  // Mobile menu
  isMobileMenuOpen: boolean
  toggleMobileMenu: () => void
  closeMobileMenu: () => void

  // Toast notifications
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void

  // Modals
  modals: Modal[]
  openModal: (modal: Omit<Modal, 'id'>) => void
  closeModal: (id: string) => void
  closeAllModals: () => void

  // Loading states
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Dashboard period
  dashboardPeriod: '7d' | '30d' | '90d'
  setDashboardPeriod: (period: '7d' | '30d' | '90d') => void
}

let toastId = 0
let modalId = 0

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  isSidebarOpen: true,
  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  collapseSidebar: () => set({ isSidebarCollapsed: true }),
  expandSidebar: () => set({ isSidebarCollapsed: false }),

  // Mobile menu
  isMobileMenuOpen: false,
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  // Toast notifications
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++toastId}`
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    // Auto-remove after duration
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),

  // Modals
  modals: [],
  openModal: (modal) => {
    const id = `modal-${++modalId}`
    set((state) => ({
      modals: [...state.modals, { ...modal, id }],
    }))
  },
  closeModal: (id) =>
    set((state) => ({
      modals: state.modals.filter((m) => m.id !== id),
    })),
  closeAllModals: () => set({ modals: [] }),

  // Loading
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  // Theme
  theme: 'system',
  setTheme: (theme) => set({ theme }),

  // Dashboard
  dashboardPeriod: '7d',
  setDashboardPeriod: (period) => set({ dashboardPeriod: period }),
}))
