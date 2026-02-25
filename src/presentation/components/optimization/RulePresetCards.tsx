'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ShieldAlert, TrendingDown, Bell, Zap, Loader2 } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: string
}

interface PresetDefinition {
  id: string
  icon: React.ElementType
  iconColor: string
  badgeColor: string
  title: string
  description: string
  ruleType: 'CPA_THRESHOLD' | 'ROAS_FLOOR' | 'BUDGET_PACE' | 'CREATIVE_FATIGUE'
  conditions: { metric: string; operator: string; value: number }[]
  actions: { type: string; params: Record<string, unknown> }[]
  cooldownMinutes: number
}

const PRESETS: PresetDefinition[] = [
  {
    id: 'cpa-pause',
    icon: ShieldAlert,
    iconColor: 'text-red-500',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800',
    title: 'CPA 상한 초과 시 일시중지',
    description: 'CPA가 15,000원을 초과하면 캠페인을 자동으로 일시중지합니다.',
    ruleType: 'CPA_THRESHOLD',
    conditions: [{ metric: 'cpa', operator: 'gt', value: 15000 }],
    actions: [{ type: 'PAUSE_CAMPAIGN', params: {} }],
    cooldownMinutes: 60,
  },
  {
    id: 'roas-reduce',
    icon: TrendingDown,
    iconColor: 'text-blue-500',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
    title: 'ROAS 하한 미달 시 예산 감소',
    description: 'ROAS가 1.0 미만으로 떨어지면 예산을 30% 감소시킵니다.',
    ruleType: 'ROAS_FLOOR',
    conditions: [{ metric: 'roas', operator: 'lt', value: 1.0 }],
    actions: [{ type: 'REDUCE_BUDGET', params: { percentage: 30 } }],
    cooldownMinutes: 120,
  },
  {
    id: 'budget-alert',
    icon: Bell,
    iconColor: 'text-yellow-500',
    badgeColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800',
    title: '예산 초과 소진 알림',
    description: '지출 페이스가 120%를 초과하면 인앱 알림을 발송합니다.',
    ruleType: 'BUDGET_PACE',
    conditions: [{ metric: 'spend_pace', operator: 'gt', value: 120 }],
    actions: [{ type: 'ALERT_ONLY', params: { notifyChannel: 'inapp' } }],
    cooldownMinutes: 30,
  },
]

interface ApplyPresetPayload {
  name: string
  campaignId: string
  ruleType: 'CPA_THRESHOLD' | 'ROAS_FLOOR' | 'BUDGET_PACE' | 'CREATIVE_FATIGUE'
  conditions: { metric: string; operator: string; value: number }[]
  actions: { type: string; params: Record<string, unknown> }[]
  cooldownMinutes: number
}

interface RulePresetCardsProps {
  campaigns: Campaign[]
  onApplyPreset: (preset: ApplyPresetPayload) => Promise<void>
}

export function RulePresetCards({ campaigns, onApplyPreset }: RulePresetCardsProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [applyingId, setApplyingId] = useState<string | null>(null)

  const handleApply = async (preset: PresetDefinition) => {
    if (!selectedCampaignId) return
    setApplyingId(preset.id)
    try {
      await onApplyPreset({
        name: preset.title,
        campaignId: selectedCampaignId,
        ruleType: preset.ruleType,
        conditions: preset.conditions,
        actions: preset.actions,
        cooldownMinutes: preset.cooldownMinutes,
      })
    } finally {
      setApplyingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">이커머스 기본 프리셋</span>
          <Badge variant="secondary" className="text-xs">
            {PRESETS.length}개
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">적용할 캠페인</span>
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="h-8 w-[200px] text-xs bg-white/50 dark:bg-black/10 border-border/50">
              <SelectValue placeholder="캠페인 선택..." />
            </SelectTrigger>
            <SelectContent>
              {campaigns.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                  캠페인이 없습니다
                </div>
              ) : (
                campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRESETS.map((preset) => {
          const Icon = preset.icon
          const isApplying = applyingId === preset.id

          return (
            <Card
              key={preset.id}
              className="border-border/50 transition-shadow hover:shadow-sm"
            >
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                      <Icon className={`h-4 w-4 ${preset.iconColor}`} />
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${preset.badgeColor}`}
                    >
                      {preset.ruleType === 'CPA_THRESHOLD' && 'CPA'}
                      {preset.ruleType === 'ROAS_FLOOR' && 'ROAS'}
                      {preset.ruleType === 'BUDGET_PACE' && '예산'}
                      {preset.ruleType === 'CREATIVE_FATIGUE' && '소재'}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-sm leading-snug mt-2">{preset.title}</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <CardDescription className="text-xs leading-relaxed">
                  {preset.description}
                </CardDescription>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
                  disabled={!selectedCampaignId || isApplying}
                  onClick={() => handleApply(preset)}
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      적용 중...
                    </>
                  ) : !selectedCampaignId ? (
                    '캠페인을 선택하세요'
                  ) : (
                    '이 프리셋 적용'
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
