'use client'

import { memo, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OptimizationRuleResponseDTO {
  id: string
  campaignId: string
  userId: string
  name: string
  ruleType: 'CPA_THRESHOLD' | 'ROAS_FLOOR' | 'BUDGET_PACE' | 'CREATIVE_FATIGUE'
  conditions: { metric: string; operator: string; value: number }[]
  actions: { type: string; params: Record<string, unknown> }[]
  isEnabled: boolean
  lastTriggeredAt: string | null
  triggerCount: number
  cooldownMinutes: number
  createdAt: string
  updatedAt: string
}

interface OptimizationRuleTableProps {
  rules: OptimizationRuleResponseDTO[]
  isLoading?: boolean
  onEdit: (rule: OptimizationRuleResponseDTO) => void
  onDelete: (id: string) => void
  onToggle: (id: string, isEnabled: boolean) => void
}

const RULE_TYPE_LABELS: Record<string, string> = {
  CPA_THRESHOLD: 'CPA 상한',
  ROAS_FLOOR: 'ROAS 하한',
  BUDGET_PACE: '예산 페이싱',
  CREATIVE_FATIGUE: '소재 피로도',
}

const RULE_TYPE_BADGE: Record<string, string> = {
  CPA_THRESHOLD: 'bg-red-500/15 text-red-600 border-red-200 dark:border-red-800',
  ROAS_FLOOR: 'bg-blue-500/15 text-blue-600 border-blue-200 dark:border-blue-800',
  BUDGET_PACE: 'bg-yellow-500/15 text-yellow-600 border-yellow-200 dark:border-yellow-800',
  CREATIVE_FATIGUE: 'bg-purple-500/15 text-purple-600 border-purple-200 dark:border-purple-800',
}

const METRIC_LABELS: Record<string, string> = {
  cpa: 'CPA',
  roas: 'ROAS',
  ctr: 'CTR',
  cpc: 'CPC',
  cvr: 'CVR',
  spend_pace: '지출 페이스',
}

const OPERATOR_LABELS: Record<string, string> = {
  gt: '초과',
  lt: '미만',
  gte: '이상',
  lte: '이하',
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  PAUSE_CAMPAIGN: '캠페인 일시중지',
  REDUCE_BUDGET: '예산 감소',
  INCREASE_BUDGET: '예산 증가',
  ALERT_ONLY: '알림만',
}

function formatConditionSummary(conditions: OptimizationRuleResponseDTO['conditions']): string {
  if (conditions.length === 0) return '-'
  return conditions
    .map((c) => {
      const metric = METRIC_LABELS[c.metric] || c.metric
      const operator = OPERATOR_LABELS[c.operator] || c.operator
      return `${metric} ${operator} ${c.value}`
    })
    .join(', ')
}

function formatActionSummary(actions: OptimizationRuleResponseDTO['actions']): string {
  if (actions.length === 0) return '-'
  return actions
    .map((a) => {
      const label = ACTION_TYPE_LABELS[a.type] || a.type
      if (a.type === 'REDUCE_BUDGET' || a.type === 'INCREASE_BUDGET') {
        const pct = a.params?.percentage
        return pct ? `${label} ${pct}%` : label
      }
      return label
    })
    .join(', ')
}

function formatLastTriggered(dateStr: string | null): string {
  if (!dateStr) return '미실행'
  const d = new Date(dateStr)
  const now = Date.now()
  const diff = now - d.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}

export const OptimizationRuleTable = memo(function OptimizationRuleTable({
  rules,
  isLoading = false,
  onEdit,
  onDelete,
  onToggle,
}: OptimizationRuleTableProps) {
  const handleToggle = useCallback(
    (id: string, current: boolean) => {
      onToggle(id, !current)
    },
    [onToggle]
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex animate-pulse gap-4 py-3 border-b border-border/30">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-4 w-28 rounded bg-muted" />
            <div className="h-4 w-10 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Zap className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-base font-semibold">아직 최적화 규칙이 없습니다</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          프리셋으로 빠르게 시작하거나 직접 만들어보세요. 규칙이 충족되면 자동으로 액션을 실행합니다.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="min-w-[160px]">규칙 이름</TableHead>
            <TableHead className="w-[120px]">유형</TableHead>
            <TableHead className="min-w-[180px]">조건</TableHead>
            <TableHead className="min-w-[160px]">액션</TableHead>
            <TableHead className="w-[80px] text-center">상태</TableHead>
            <TableHead className="w-[80px] text-right">트리거</TableHead>
            <TableHead className="w-[100px]">마지막 실행</TableHead>
            <TableHead className="w-[40px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id} className="group transition-colors">
              <TableCell>
                <span className="font-medium">{rule.name}</span>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs font-medium',
                    RULE_TYPE_BADGE[rule.ruleType]
                  )}
                >
                  {RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatConditionSummary(rule.conditions)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatActionSummary(rule.actions)}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={rule.isEnabled}
                  aria-label={`${rule.name} 규칙 ${rule.isEnabled ? '비활성화' : '활성화'}`}
                  onClick={() => handleToggle(rule.id, rule.isEnabled)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full border transition-colors',
                    rule.isEnabled
                      ? 'border-primary/40 bg-primary/20'
                      : 'border-muted-foreground/20 bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-background shadow transition-transform',
                      rule.isEnabled ? 'translate-x-5' : 'translate-x-1'
                    )}
                  />
                </button>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="text-sm font-medium">{rule.triggerCount.toLocaleString()}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {formatLastTriggered(rule.lastTriggeredAt)}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">메뉴 열기</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(rule)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(rule.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
})
