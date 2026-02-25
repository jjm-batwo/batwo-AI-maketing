'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OptimizationRuleResponseDTO } from './OptimizationRuleTable'

interface Campaign {
  id: string
  name: string
  status: string
}

interface RuleCondition {
  metric: string
  operator: string
  value: string
}

interface RuleAction {
  type: string
  params: {
    percentage?: string
    notifyChannel?: string
  }
}

interface OptimizationRuleFormData {
  name: string
  campaignId: string
  ruleType: string
  conditions: RuleCondition[]
  actions: RuleAction[]
  cooldownMinutes: number
}

interface OptimizationRuleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaigns: Campaign[]
  editingRule?: OptimizationRuleResponseDTO | null
  defaultCampaignId?: string
  onSubmit: (data: OptimizationRuleFormData) => Promise<void>
}

const RULE_TYPE_OPTIONS = [
  { value: 'CPA_THRESHOLD', label: 'CPA 상한' },
  { value: 'ROAS_FLOOR', label: 'ROAS 하한' },
  { value: 'BUDGET_PACE', label: '예산 페이싱' },
  { value: 'CREATIVE_FATIGUE', label: '소재 피로도' },
]

const METRIC_OPTIONS = [
  { value: 'cpa', label: 'CPA' },
  { value: 'roas', label: 'ROAS' },
  { value: 'ctr', label: 'CTR' },
  { value: 'cpc', label: 'CPC' },
  { value: 'cvr', label: 'CVR' },
  { value: 'spend_pace', label: '지출 페이스' },
]

const OPERATOR_OPTIONS = [
  { value: 'gt', label: '초과 (>)' },
  { value: 'lt', label: '미만 (<)' },
  { value: 'gte', label: '이상 (≥)' },
  { value: 'lte', label: '이하 (≤)' },
]

const ACTION_TYPE_OPTIONS = [
  { value: 'PAUSE_CAMPAIGN', label: '캠페인 일시중지' },
  { value: 'REDUCE_BUDGET', label: '예산 감소' },
  { value: 'INCREASE_BUDGET', label: '예산 증가' },
  { value: 'ALERT_ONLY', label: '알림만' },
]

const NOTIFY_CHANNEL_OPTIONS = [
  { value: 'inapp', label: '인앱 알림' },
  { value: 'email', label: '이메일' },
  { value: 'slack', label: '슬랙' },
]

const COOLDOWN_OPTIONS = [
  { value: 5, label: '5분' },
  { value: 15, label: '15분' },
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 120, label: '2시간' },
  { value: 360, label: '6시간' },
  { value: 720, label: '12시간' },
  { value: 1440, label: '24시간' },
]

const DEFAULT_CONDITION: RuleCondition = { metric: 'cpa', operator: 'gt', value: '' }
const DEFAULT_ACTION: RuleAction = { type: 'PAUSE_CAMPAIGN', params: {} }

function getInitialFormData(
  editingRule?: OptimizationRuleResponseDTO | null,
  defaultCampaignId?: string
): OptimizationRuleFormData {
  if (editingRule) {
    return {
      name: editingRule.name,
      campaignId: editingRule.campaignId,
      ruleType: editingRule.ruleType,
      conditions: editingRule.conditions.map((c) => ({
        metric: c.metric,
        operator: c.operator,
        value: String(c.value),
      })),
      actions: editingRule.actions.map((a) => ({
        type: a.type,
        params: {
          percentage: a.params?.percentage != null ? String(a.params.percentage) : undefined,
          notifyChannel: a.params?.notifyChannel != null ? String(a.params.notifyChannel) : undefined,
        },
      })),
      cooldownMinutes: editingRule.cooldownMinutes,
    }
  }
  return {
    name: '',
    campaignId: defaultCampaignId || '',
    ruleType: 'CPA_THRESHOLD',
    conditions: [{ ...DEFAULT_CONDITION }],
    actions: [{ ...DEFAULT_ACTION }],
    cooldownMinutes: 60,
  }
}

export function OptimizationRuleForm({
  open,
  onOpenChange,
  campaigns,
  editingRule,
  defaultCampaignId,
  onSubmit,
}: OptimizationRuleFormProps) {
  const isEditing = !!editingRule
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<OptimizationRuleFormData>(() =>
    getInitialFormData(editingRule, defaultCampaignId)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when dialog opens or editing target changes
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData(editingRule, defaultCampaignId))
      setErrors({})
    }
  }, [open, editingRule, defaultCampaignId])

  const updateField = <K extends keyof OptimizationRuleFormData>(
    key: K,
    value: OptimizationRuleFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }))
    }
  }

  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { ...DEFAULT_CONDITION }],
    }))
  }

  const removeCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }))
  }

  const updateCondition = (index: number, field: keyof RuleCondition, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.conditions]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, conditions: updated }
    })
  }

  const updateAction = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.actions]
      if (field === 'type') {
        updated[index] = { type: value, params: {} }
      } else if (field === 'percentage' || field === 'notifyChannel') {
        updated[index] = {
          ...updated[index],
          params: { ...updated[index].params, [field]: value },
        }
      }
      return { ...prev, actions: updated }
    })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = '규칙 이름을 입력하세요'
    if (!formData.campaignId) newErrors.campaignId = '캠페인을 선택하세요'
    if (formData.conditions.length === 0) newErrors.conditions = '조건을 하나 이상 추가하세요'
    formData.conditions.forEach((c, i) => {
      if (!c.value || isNaN(Number(c.value))) {
        newErrors[`condition_${i}_value`] = '유효한 숫자를 입력하세요'
      }
    })
    if (formData.actions.length === 0) newErrors.actions = '액션을 하나 이상 추가하세요'
    formData.actions.forEach((a, i) => {
      if ((a.type === 'REDUCE_BUDGET' || a.type === 'INCREASE_BUDGET') && !a.params.percentage) {
        newErrors[`action_${i}_percentage`] = '비율을 입력하세요'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? '규칙 수정' : '최적화 규칙 추가'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* 규칙 이름 */}
          <div className="space-y-1.5">
            <Label htmlFor="rule-name">
              규칙 이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rule-name"
              placeholder="예: CPA 15,000원 초과 시 일시중지"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* 캠페인 선택 (생성 시에만) */}
          {!isEditing && (
            <div className="space-y-1.5">
              <Label>
                캠페인 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.campaignId}
                onValueChange={(v) => updateField('campaignId', v)}
              >
                <SelectTrigger className={cn(errors.campaignId && 'border-destructive')}>
                  <SelectValue placeholder="캠페인 선택..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.campaignId && (
                <p className="text-xs text-destructive">{errors.campaignId}</p>
              )}
            </div>
          )}

          {/* 규칙 유형 */}
          <div className="space-y-1.5">
            <Label>규칙 유형</Label>
            <Select
              value={formData.ruleType}
              onValueChange={(v) => updateField('ruleType', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RULE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 조건 빌더 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                조건 <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary hover:bg-primary/5"
                onClick={addCondition}
              >
                <Plus className="mr-1 h-3 w-3" />
                조건 추가
              </Button>
            </div>
            {errors.conditions && (
              <p className="text-xs text-destructive">{errors.conditions}</p>
            )}
            <div className="space-y-2">
              {formData.conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 p-3"
                >
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <Select
                      value={condition.metric}
                      onValueChange={(v) => updateCondition(index, 'metric', v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METRIC_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={(v) => updateCondition(index, 'operator', v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATOR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="space-y-0.5">
                      <Input
                        type="number"
                        placeholder="값"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        className={cn(
                          'h-8 text-xs',
                          errors[`condition_${index}_value`] && 'border-destructive'
                        )}
                      />
                      {errors[`condition_${index}_value`] && (
                        <p className="text-[10px] text-destructive leading-tight">
                          {errors[`condition_${index}_value`]}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCondition(index)}
                    disabled={formData.conditions.length === 1}
                    aria-label="조건 삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 액션 설정 */}
          <div className="space-y-2">
            <Label>액션</Label>
            {errors.actions && <p className="text-xs text-destructive">{errors.actions}</p>}
            <div className="space-y-2">
              {formData.actions.map((action, index) => (
                <div
                  key={index}
                  className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3"
                >
                  <Select
                    value={action.type}
                    onValueChange={(v) => updateAction(index, 'type', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* 액션별 추가 파라미터 */}
                  {(action.type === 'REDUCE_BUDGET' || action.type === 'INCREASE_BUDGET') && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">
                        비율 (%)
                      </Label>
                      <div className="flex-1 space-y-0.5">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          placeholder="예: 30"
                          value={action.params.percentage || ''}
                          onChange={(e) => updateAction(index, 'percentage', e.target.value)}
                          className={cn(
                            'h-8 text-xs',
                            errors[`action_${index}_percentage`] && 'border-destructive'
                          )}
                        />
                        {errors[`action_${index}_percentage`] && (
                          <p className="text-[10px] text-destructive">
                            {errors[`action_${index}_percentage`]}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {action.type === 'ALERT_ONLY' && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">
                        알림 채널
                      </Label>
                      <Select
                        value={action.params.notifyChannel || 'inapp'}
                        onValueChange={(v) => updateAction(index, 'notifyChannel', v)}
                      >
                        <SelectTrigger className="h-8 flex-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFY_CHANNEL_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 쿨다운 */}
          <div className="space-y-1.5">
            <Label>쿨다운 (재실행 대기 시간)</Label>
            <Select
              value={String(formData.cooldownMinutes)}
              onValueChange={(v) => updateField('cooldownMinutes', Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COOLDOWN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              규칙이 한 번 실행된 후 다시 실행되기까지의 최소 대기 시간입니다.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting} className="shadow-sm">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? '수정 중...' : '생성 중...'}
                </>
              ) : isEditing ? (
                '수정 완료'
              ) : (
                '규칙 생성'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
