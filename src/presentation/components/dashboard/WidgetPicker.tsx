'use client'

import { memo, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ALL_WIDGET_TYPES,
  WIDGET_TYPE_LABELS,
  WIDGET_DEFAULT_SIZES,
  type WidgetType,
  type DashboardWidget,
} from '@domain/value-objects/DashboardWidget'
import {
  BarChart3,
  LineChart,
  Filter,
  Target,
  Brain,
  Table2,
  PieChart,
  PiggyBank,
  AlertTriangle,
  Plus,
} from 'lucide-react'

const WIDGET_ICONS: Record<WidgetType, React.ComponentType<{ className?: string }>> = {
  kpi_card: BarChart3,
  kpi_chart: LineChart,
  funnel: Filter,
  benchmark: Target,
  ai_insights: Brain,
  campaign_table: Table2,
  donut_chart: PieChart,
  savings: PiggyBank,
  anomaly_alert: AlertTriangle,
}

const WIDGET_DESCRIPTIONS: Record<WidgetType, string> = {
  kpi_card: '단일 KPI 메트릭을 카드 형태로 표시합니다',
  kpi_chart: '기간별 KPI 추이를 차트로 시각화합니다',
  funnel: '전환 퍼널 단계별 성과를 보여줍니다',
  benchmark: '업종 평균 대비 성과를 비교합니다',
  ai_insights: 'AI가 자동 분석한 인사이트를 표시합니다',
  campaign_table: '캠페인 요약 테이블을 표시합니다',
  donut_chart: '캠페인 상태 분포를 도넛 차트로 보여줍니다',
  savings: '최적화로 절감한 예산을 표시합니다',
  anomaly_alert: '이상 탐지 결과를 실시간으로 표시합니다',
}

const WIDGET_CATEGORIES = {
  metrics: { label: '메트릭', types: ['kpi_card', 'kpi_chart'] as WidgetType[] },
  analysis: { label: '분석', types: ['funnel', 'benchmark', 'donut_chart'] as WidgetType[] },
  ai: { label: 'AI', types: ['ai_insights', 'anomaly_alert'] as WidgetType[] },
  overview: { label: '개요', types: ['campaign_table', 'savings'] as WidgetType[] },
}

interface WidgetPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddWidget: (widget: DashboardWidget) => void
  existingWidgetTypes: WidgetType[]
}

export const WidgetPicker = memo(function WidgetPicker({
  open,
  onOpenChange,
  onAddWidget,
  existingWidgetTypes,
}: WidgetPickerProps) {
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null)

  const handleAdd = useCallback(() => {
    if (!selectedType) return

    const defaultSize = WIDGET_DEFAULT_SIZES[selectedType]
    const widget: DashboardWidget = {
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: selectedType,
      position: {
        x: 0,
        y: Infinity, // react-grid-layout will auto-place at the bottom
        w: defaultSize.w,
        h: defaultSize.h,
      },
      config: {},
    }

    onAddWidget(widget)
    setSelectedType(null)
    onOpenChange(false)
  }, [selectedType, onAddWidget, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">위젯 추가</DialogTitle>
          <DialogDescription>
            대시보드에 추가할 위젯을 선택하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {Object.entries(WIDGET_CATEGORIES).map(([key, category]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                {category.label}
                <Badge variant="secondary" className="text-xs">
                  {category.types.length}
                </Badge>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {category.types.map(type => {
                  const Icon = WIDGET_ICONS[type]
                  const isSelected = selectedType === type
                  const isExisting =
                    existingWidgetTypes.includes(type) &&
                    type !== 'kpi_card' // kpi_card는 여러 개 가능

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      disabled={isExisting}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-4 text-left transition-all',
                        isSelected &&
                          'border-primary bg-primary/5 ring-2 ring-primary/20',
                        !isSelected && !isExisting &&
                          'border-border hover:border-primary/40 hover:bg-accent/50',
                        isExisting &&
                          'opacity-50 cursor-not-allowed border-border bg-muted/30',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {WIDGET_TYPE_LABELS[type]}
                          </span>
                          {isExisting && (
                            <Badge variant="secondary" className="text-xs">
                              추가됨
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {WIDGET_DESCRIPTIONS[type]}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          기본 크기: {WIDGET_DEFAULT_SIZES[type].w}×{WIDGET_DEFAULT_SIZES[type].h}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedType}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})
