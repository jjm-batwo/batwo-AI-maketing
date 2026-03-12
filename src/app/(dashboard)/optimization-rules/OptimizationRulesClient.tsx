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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, ChevronDown, ChevronUp, Zap } from 'lucide-react'
import {
  OptimizationRuleTable,
  OptimizationRuleForm,
  RulePresetCards,
} from '@/presentation/components/optimization'
import type { OptimizationRuleResponseDTO } from '@/presentation/components/optimization'
import { useTranslations } from 'next-intl'
import { useUIStore } from '@/presentation/stores/uiStore'

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

  const createRule = useCallback(async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/optimization-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('규칙 생성에 실패했습니다')
    const data = await res.json()
    setRules((prev) => [data.rule, ...prev])
    return data.rule
  }, [])

  const updateRule = useCallback(async (id: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/optimization-rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('규칙 수정에 실패했습니다')
    const data = await res.json()
    setRules((prev) => prev.map((r) => (r.id === id ? data.rule : r)))
  }, [])

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
  const t = useTranslations()
  const announceToScreenReader = useUIStore((s) => s.announceToScreenReader)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('ALL')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<OptimizationRuleResponseDTO | null>(null)
  const [presetsVisible, setPresetsVisible] = useState(true)
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)

  // UX-03: AlertDialog state (replaces window.confirm)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)

  // Client-side campaigns revalidation on mount
  useEffect(() => {
    fetch('/api/campaigns?pageSize=100&status=ACTIVE')
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

  // UX-03: Open delete confirmation dialog instead of window.confirm
  const handleDelete = useCallback((id: string) => {
    setDeletingRuleId(id)
    setDeleteDialogOpen(true)
  }, [])

  // UX-03: Confirm delete action
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingRuleId) return
    await deleteRule(deletingRuleId)
    announceToScreenReader(t('accessibility.ruleDeleted'))
    setDeletingRuleId(null)
    setDeleteDialogOpen(false)
  }, [deletingRuleId, deleteRule, announceToScreenReader, t])

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
          <h1 className="text-3xl font-bold tracking-tight">{t('optimizationRules.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('optimizationRules.description')}</p>
        </div>
        <Button size="lg" className="shadow-sm transition-all" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('optimizationRules.addRule')}
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
            <span className="text-sm font-semibold">{t('optimizationRules.quickPresets')}</span>
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
            <span className="text-sm text-muted-foreground">
              {t('optimizationRules.campaignFilter')}
            </span>
            <Select value={selectedCampaignId} onValueChange={handleCampaignChange}>
              <SelectTrigger className="w-[220px] bg-white/50 dark:bg-black/10 border-border/50">
                <SelectValue placeholder={t('optimizationRules.allCampaigns')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('optimizationRules.allCampaigns')}</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground">
            {isLoading
              ? t('optimizationRules.loadingRules')
              : t('optimizationRules.ruleCount', { count: filteredRules.length })}
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

      {/* UX-03: Delete confirmation AlertDialog (replaces window.confirm) */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('optimizationRules.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('optimizationRules.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingRuleId(null)}>
              {t('optimizationRules.deleteCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('optimizationRules.deleteAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
