'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { DashboardWidget } from '@domain/value-objects/DashboardWidget'

interface DashboardLayoutDTO {
  id: string
  userId: string
  name: string
  widgets: DashboardWidget[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface LayoutsResponse {
  layouts: DashboardLayoutDTO[]
}

interface LayoutResponse {
  layout: DashboardLayoutDTO
}

const QUERY_KEY = ['dashboard-layouts'] as const

export function useDashboardLayout() {
  const queryClient = useQueryClient()

  const {
    data: layoutData,
    isLoading,
    error,
  } = useQuery<LayoutsResponse>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('/api/dashboard/layouts')
      if (!res.ok) throw new Error('레이아웃을 불러오지 못했습니다')
      return res.json()
    },
  })

  const layouts = layoutData?.layouts ?? []
  const activeLayout = layouts.find(l => l.isDefault) ?? layouts[0] ?? null

  // 위젯 위치/설정 업데이트
  const updateMutation = useMutation({
    mutationFn: async (params: { id: string; widgets: DashboardWidget[] }) => {
      const res = await fetch(`/api/dashboard/layouts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets: params.widgets }),
      })
      if (!res.ok) throw new Error('레이아웃 업데이트에 실패했습니다')
      return res.json() as Promise<LayoutResponse>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  // 새 레이아웃 생성
  const createMutation = useMutation({
    mutationFn: async (params: { name: string; widgets?: DashboardWidget[] }) => {
      const res = await fetch('/api/dashboard/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '레이아웃 생성에 실패했습니다')
      }
      return res.json() as Promise<LayoutResponse>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  // 레이아웃 삭제
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/layouts/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '레이아웃 삭제에 실패했습니다')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  // 레이아웃 이름 변경
  const renameMutation = useMutation({
    mutationFn: async (params: { id: string; name: string }) => {
      const res = await fetch(`/api/dashboard/layouts/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: params.name }),
      })
      if (!res.ok) throw new Error('이름 변경에 실패했습니다')
      return res.json() as Promise<LayoutResponse>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  // 기본 레이아웃 변경
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/layouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      if (!res.ok) throw new Error('기본 레이아웃 변경에 실패했습니다')
      return res.json() as Promise<LayoutResponse>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return {
    layouts,
    activeLayout,
    isLoading,
    error,
    updateLayout: updateMutation.mutate,
    updateLayoutAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    createLayout: createMutation.mutate,
    createLayoutAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteLayout: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    renameLayout: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
    setDefaultLayout: setDefaultMutation.mutate,
    isSettingDefault: setDefaultMutation.isPending,
  }
}
