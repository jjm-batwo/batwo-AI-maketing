import { memo } from 'react'

export const BrowserChrome = memo(function BrowserChrome() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
      <div className="flex gap-1.5" role="presentation" aria-label="브라우저 제어 버튼">
        <div className="w-3 h-3 rounded-full bg-red-400/80" aria-hidden="true" />
        <div className="w-3 h-3 rounded-full bg-amber-400/80" aria-hidden="true" />
        <div className="w-3 h-3 rounded-full bg-emerald-400/80" aria-hidden="true" />
      </div>
      <div className="flex-1 mx-4">
        <div className="bg-background/50 rounded-md px-3 py-1 text-xs text-muted-foreground text-center font-mono border border-border/50">
          app.batwo.io/dashboard
        </div>
      </div>
    </div>
  )
})
