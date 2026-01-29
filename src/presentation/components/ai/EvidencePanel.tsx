'use client'

import { X, Database, BookOpen, TrendingUp, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ConfidenceIndicator } from './ConfidenceIndicator'

export interface Evidence {
  type: 'data' | 'research' | 'pattern' | 'inference'
  source?: string
  content: string
  confidence: number
}

interface EvidencePanelProps {
  title?: string
  evidence: Evidence[]
  isOpen: boolean
  onClose: () => void
  className?: string
}

const EVIDENCE_TYPE_CONFIG = {
  data: {
    label: '데이터',
    icon: Database,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-500/20',
    description: '실제 데이터 기반 근거',
  },
  research: {
    label: '연구',
    icon: BookOpen,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-500/20',
    description: '학술 연구 및 논문 기반',
  },
  pattern: {
    label: '패턴',
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-500/20',
    description: '관찰된 패턴 분석',
  },
  inference: {
    label: '추론',
    icon: Lightbulb,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-500/20',
    description: 'AI 논리적 추론',
  },
}

export function EvidencePanel({
  title = 'AI 근거 및 추론 과정',
  evidence,
  isOpen,
  onClose,
  className,
}: EvidencePanelProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[480px] bg-background border-l shadow-2xl z-50',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
        role="dialog"
        aria-labelledby="evidence-panel-title"
        aria-modal="true"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <h2
              id="evidence-panel-title"
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="패널 닫기"
              className="hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-4">
            {evidence.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                <Lightbulb className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">근거가 제공되지 않았습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evidence.map((item, index) => {
                  const config = EVIDENCE_TYPE_CONFIG[item.type]
                  const Icon = config.icon

                  return (
                    <div
                      key={index}
                      className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow"
                    >
                      {/* Type and Confidence Header */}
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'flex items-center justify-center w-8 h-8 rounded-full',
                              config.bgColor
                            )}
                          >
                            <Icon className={cn('h-4 w-4', config.color)} />
                          </div>
                          <div>
                            <Badge
                              variant="outline"
                              className="text-xs font-medium"
                            >
                              {config.label}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {config.description}
                            </p>
                          </div>
                        </div>
                        <ConfidenceIndicator
                          confidence={item.confidence}
                          showPercentage
                          size="sm"
                        />
                      </div>

                      {/* Source */}
                      {item.source && (
                        <>
                          <Separator />
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              출처
                            </p>
                            <p className="text-sm">{item.source}</p>
                          </div>
                        </>
                      )}

                      {/* Content */}
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          내용
                        </p>
                        <p className="text-sm leading-relaxed text-foreground">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              총 {evidence.length}개의 근거가 분석되었습니다
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
