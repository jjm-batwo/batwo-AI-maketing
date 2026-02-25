'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import {
  OptimizationRuleTable,
  OptimizationRuleForm,
  RulePresetCards,
} from '@/presentation/components/optimization'
import type { OptimizationRuleResponseDTO } from '@/presentation/components/optimization'

interface Campaign {
  id: string
  name: string
  status: string
}

interface OptimizationRulesClientProps {
  initialRules: OptimizationRuleResponseDTO[]
  campaigns: Campaign[]
}

// Minimal local state management — no Zustand store needed
function useRulesState(initialRules: OptimizationRuleResponseDTO[]) {
  const [rules, setRules] = useState<OptimizationRuleResponseDTO[]>(initialRules)
  const [isLoading, setIsLoading] = useState(false)

  const refetch = useCallback(async (campaignId?: string) => {
    setIsLoading(true)
    try {
      const url = campaignId
        ? `/api/optimization-rules?campaignId=${campaignId}`
        : '/api/optimization-rules'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setRules(data.rules || [])
      }
    } catch {
      // silent fail — show stale data
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createRule = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/optimization-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('규칙 생성에 실패했습니다')
      const data = await res.json()
      setRules((prev) => [data.rule, ...prev])
      return data.rule
    },
    []
  )

  const updateRule = useCallback(
    async (id: string, payload: Record<string, unknown>) => {
      const res = await fetch(`/api/optimization-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('규칙 수정에 실패했습니다')
      const data = await res.json()
      setRules((prev) => prev.map((r) => (r.id === id ? data.rule : r)))
    },
    []
  )

  const deleteRule = useCallback(async (id: string) => {
    const res = await fetch(`/api/optimization-rules/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('규칙 삭제에 실패했습니다')
    setRules((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const toggleRule = useCallback(async (id: string, isEnabled: boolean) => {
    // Optimistic update
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled } : r)))
    try {
      const res = await fetch(`/api/optimization-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      })
      if (!res.ok) {
        // Revert on failure
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled: !isEnabled } : r)))
      }
    } catch {
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled: !isEnabled } : r)))
    }
  }, [])

  // Client-side revalidation on mount (ensures freshness after SSR hydration)
  useEffect(() => {
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { rules, isLoading, refetch, createRule, updateRule, deleteRule, toggleRule }
}

export function OptimizationRulesClient({
  initialRules,
  campaigns: initialCampaigns,
}: OptimizationRulesClientProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('ALL')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<OptimizationRuleResponseDTO | null>(null)
  const [presetsVisible, setPresetsVisible] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)

  // Client-side campaigns revalidation on mount
  useEffect(() => {
    fetch('/api/campaigns?pageSize=100')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.campaigns) {
          setCampaigns(
            data.campaigns.map((c: Campaign) => ({ id: c.id, name: c.name, status: c.status }))
          )
        }
      })
      .catch(() => {})
  }, [])

  const { rules, isLoading, refetch, createRule, updateRule, deleteRule, toggleRule } =
    useRulesState(initialRules)

  // Filter rules by selected campaign
  const filteredRules = useMemo(() => {
    if (selectedCampaignId === 'ALL') return rules
    return rules.filter((r) => r.campaignId === selectedCampaignId)
  }, [rules, selectedCampaignId])

  const handleCampaignChange = useCallback(
    async (value: string) => {
      setSelectedCampaignId(value)
      await refetch(value === 'ALL' ? undefined : value)
    },
    [refetch]
  )

  const handleOpenCreate = useCallback(() => {
    setEditingRule(null)
    setIsFormOpen(true)
  }, [])

  const handleEdit = useCallback((rule: OptimizationRuleResponseDTO) => {
    setEditingRule(rule)
    setIsFormOpen(true)
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('이 규칙을 삭제하시겠습니까?')) return
      await deleteRule(id)
    },
    [deleteRule]
  )

  const handleFormSubmit = useCallback(
    async (data: {
      name: string
      campaignId: string
      ruleType: string
      conditions: { metric: string; operator: string; value: string }[]
      actions: { type: string; params: { percentage?: string; notifyChannel?: string } }[]
      cooldownMinutes: number
    }) => {
      const payload = {
        ...data,
        conditions: data.conditions.map((c) => ({ ...c, value: Number(c.value) })),
        actions: data.actions.map((a) => ({
          type: a.type,
          params: {
            ...(a.params.percentage != null ? { percentage: Number(a.params.percentage) } : {}),
            ...(a.params.notifyChannel != null ? { notifyChannel: a.params.notifyChannel } : {}),
          },
        })),
      }

      if (editingRule) {
        await updateRule(editingRule.id, payload)
      } else {
        await createRule(payload)
      }
    },
    [editingRule, createRule, updateRule]
  )

  const handleApplyPreset = useCallback(
    async (preset: {
      name: string
      campaignId: string
      ruleType: string
      conditions: { metric: string; operator: string; value: number }[]
      actions: { type: string; params: Record<string, unknown> }[]
      cooldownMinutes: number
    }) => {
      await createRule(preset)
    },
    [createRule]
  )

  const defaultCampaignId =
    selectedCampaignId !== 'ALL' ? selectedCampaignId : campaigns[0]?.id || ''

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">최적화 규칙</h1>
          <p className="text-muted-foreground mt-2">
            조건이 충족되면 자동으로 액션을 실행하는 규칙을 관리하세요
          </p>
        </div>
        <Button size="lg" className="shadow-sm transition-all" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          규칙 추가
        </Button>
      </div>

      {/* Presets Section */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setPresetsVisible((v) => !v)}
          aria-expanded={presetsVisible}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">빠른 시작 프리셋</span>
          </div>
          {presetsVisible ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {presetsVisible && (
          <RulePresetCards campaigns={campaigns} onApplyPreset={handleApplyPreset} />
        )}
      </div>

      {/* Rules Table Section */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6">
        {/* Campaign Filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">캠페인 필터</span>
            <Select value={selectedCampaignId} onValueChange={handleCampaignChange}>
              <SelectTrigger className="w-[220px] bg-white/50 dark:bg-black/10 border-border/50">
                <SelectValue placeholder="전체 캠페인" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 캠페인</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground">
            {isLoading ? '불러오는 중...' : `규칙 ${filteredRules.length}개`}
          </span>
        </div>

        {/* Table */}
        <OptimizationRuleTable
          rules={filteredRules}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={toggleRule}
        />
      </div>

      {/* Create / Edit Form Dialog */}
      <OptimizationRuleForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        campaigns={campaigns}
        editingRule={editingRule}
        defaultCampaignId={defaultCampaignId}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}
