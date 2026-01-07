'use client'

import { useState } from 'react'
import {
  MousePointerClick,
  ShoppingCart,
  Megaphone,
  Heart,
  UserPlus,
  Check,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAllCampaignTemplates,
  CampaignTemplate,
  CampaignTemplateId,
} from '@domain/value-objects/CampaignTemplate'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MousePointerClick,
  ShoppingCart,
  Megaphone,
  Heart,
  UserPlus,
}

interface TemplateSelectorProps {
  onSelect: (template: CampaignTemplate) => void
  selectedTemplateId?: CampaignTemplateId
  showTips?: boolean
}

function formatBudget(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function TemplateSelector({
  onSelect,
  selectedTemplateId,
  showTips = false,
}: TemplateSelectorProps) {
  const [hoveredTemplate, setHoveredTemplate] =
    useState<CampaignTemplateId | null>(null)
  const templates = getAllCampaignTemplates()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const Icon = iconMap[template.icon] || MousePointerClick
          const isSelected = selectedTemplateId === template.id
          const isHovered = hoveredTemplate === template.id

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              aria-label={`${template.name} 템플릿 선택`}
              className={cn(
                'relative flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all hover:border-primary hover:bg-primary/5',
                isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20'
              )}
            >
              {isSelected && (
                <div className="absolute right-3 top-3">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  getCategoryColor(template.category)
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <h3 className="font-medium">{template.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>

              <div className="mt-auto flex w-full items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  {template.category}
                </span>
                <span className="text-sm font-medium text-primary">
                  {formatBudget(template.suggestedDailyBudget)}/일
                </span>
              </div>

              {/* Tips tooltip */}
              {showTips && isHovered && (
                <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-lg border bg-popover p-3 shadow-lg">
                  <div className="flex items-center gap-2 border-b pb-2 text-sm font-medium">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <span>팁</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {template.tips.map((tip, index) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function getCategoryColor(category: string): string {
  switch (category) {
    case '트래픽':
      return 'bg-blue-100 text-blue-600'
    case '전환':
      return 'bg-green-100 text-green-600'
    case '인지도':
      return 'bg-purple-100 text-purple-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}
