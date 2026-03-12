import { memo } from 'react'
import { Sparkles } from 'lucide-react'
interface AIInsightProps {
  title: string
  content: string
}

export const AIInsight = memo(function AIInsight({ title, content }: AIInsightProps) {
  return (
    <div
      className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200/50 shadow-sm transition-all duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1 bg-green-100 rounded-full mt-0.5 shrink-0" aria-hidden="true">
          <Sparkles className="h-3.5 w-3.5 text-green-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-green-800 mb-0.5">{title}</p>
          <p className="text-[11px] leading-relaxed text-green-700">{content}</p>
        </div>
      </div>
    </div>
  )
})
