import { memo } from 'react'

interface BrowserChromeProps {
  url?: string
}

export const BrowserChrome = memo(function BrowserChrome({ url = 'app.batwo.io/dashboard' }: BrowserChromeProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
      <div className="flex gap-1.5" role="presentation" aria-label="브라우저 제어 버튼">
        <div className="relative group/dot">
          <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-red-400 blur-sm opacity-0 group-hover/dot:opacity-50 transition-opacity" aria-hidden="true" />
          <div className="relative w-3.5 h-3.5 rounded-full bg-red-400/80" aria-hidden="true" />
        </div>
        <div className="relative group/dot">
          <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-amber-400 blur-sm opacity-0 group-hover/dot:opacity-50 transition-opacity" aria-hidden="true" />
          <div className="relative w-3.5 h-3.5 rounded-full bg-amber-400/80" aria-hidden="true" />
        </div>
        <div className="relative group/dot">
          <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-emerald-400 blur-sm opacity-0 group-hover/dot:opacity-50 transition-opacity" aria-hidden="true" />
          <div className="relative w-3.5 h-3.5 rounded-full bg-emerald-400/80" aria-hidden="true" />
        </div>
      </div>
      <div className="flex-1 mx-4">
        <div className="bg-background/50 rounded-md px-3 py-1 text-xs text-muted-foreground text-center font-mono border border-border/50 hover:border-primary/30 hover:bg-background/80 transition-colors flex items-center justify-center gap-2">
          <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {url}
        </div>
      </div>
    </div>
  )
})
