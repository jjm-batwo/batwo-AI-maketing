import { memo } from 'react'
import { Sparkles } from 'lucide-react'
import type { DashboardTab } from './dashboardData'

interface AIInsightProps {
  title: string
  content: string
  activeTab: DashboardTab
}

export const AIInsight = memo(function AIInsight({ title, content, activeTab }: AIInsightProps) {
  return (
    <div
      key={`${activeTab}-insight`}
      className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 rounded-lg border border-green-200/50 dark:border-green-900/50 shadow-sm animate-fade-in"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1 bg-green-100 dark:bg-green-900/50 rounded-full mt-0.5 shrink-0" aria-hidden="true">
          <Sparkles className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-0.5">
            {title}
          </p>
          <p className="text-[11px] leading-relaxed text-green-700 dark:text-green-400/80">
            {content}
          </p>
        </div>
      </div>
    </div>
  )
})
