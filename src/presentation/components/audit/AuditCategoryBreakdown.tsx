'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

interface Finding {
  type: string  // 'positive' | 'warning' | 'critical'
  message: string
}

interface Recommendation {
  priority: string  // 'high' | 'medium' | 'low'
  message: string
  estimatedImpact: string
}

interface Category {
  name: string
  score: number
  findings: Finding[]
  recommendations: Recommendation[]
}

interface AuditCategoryBreakdownProps {
  categories: Category[]
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-blue-600'
  if (score >= 40) return 'text-amber-600'
  if (score >= 20) return 'text-orange-600'
  return 'text-red-600'
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  if (score >= 20) return 'bg-orange-500'
  return 'bg-red-500'
}

function FindingIcon({ type }: { type: string }) {
  if (type === 'positive') {
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex-shrink-0"
        aria-label="긍정적"
      >
        ✓
      </span>
    )
  }
  if (type === 'warning') {
    return (
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold flex-shrink-0"
        aria-label="주의"
      >
        ⚠
      </span>
    )
  }
  // critical
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold flex-shrink-0"
      aria-label="심각"
    >
      ✕
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === 'high') {
    return (
      <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
        높음
      </Badge>
    )
  }
  if (priority === 'medium') {
    return (
      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
        중간
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
      낮음
    </Badge>
  )
}

export function AuditCategoryBreakdown({ categories }: AuditCategoryBreakdownProps) {
  return (
    <div className="w-full space-y-2">
      <h2 className="text-lg font-bold text-foreground mb-4">카테고리별 분석</h2>
      <Accordion type="multiple" className="w-full space-y-2">
        {categories.map((category, index) => (
          <AccordionItem
            key={index}
            value={`category-${index}`}
            className="rounded-lg border border-border bg-card px-4 data-[state=open]:shadow-sm"
          >
            <AccordionTrigger
              className="hover:no-underline py-4"
              aria-label={`${category.name} 카테고리 상세보기, 점수 ${category.score}점`}
            >
              <div className="flex items-center gap-4 w-full mr-4">
                <span className="font-semibold text-foreground text-left flex-1">
                  {category.name}
                </span>
                {/* 점수 바 */}
                <div className="flex items-center gap-2 w-36 flex-shrink-0">
                  <div
                    className="flex-1 h-2 rounded-full bg-muted overflow-hidden"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(category.score)}`}
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-10 text-right ${getScoreColor(category.score)}`}>
                    {category.score}
                  </span>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="pb-4 space-y-4">
              {/* Findings */}
              {category.findings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">진단 결과</h3>
                  <ul className="space-y-2" role="list">
                    {category.findings.map((finding, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2">
                        <FindingIcon type={finding.type} />
                        <span className="text-sm text-foreground leading-snug">
                          {finding.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {category.recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">개선 권고사항</h3>
                  <ul className="space-y-3" role="list">
                    {category.recommendations.map((rec, rIndex) => (
                      <li
                        key={rIndex}
                        className="rounded-md bg-muted/50 p-3 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={rec.priority} />
                          <span className="text-sm font-medium text-foreground">
                            {rec.message}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-1">
                          예상 효과: {rec.estimatedImpact}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
