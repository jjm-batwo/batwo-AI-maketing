import { memo } from 'react'

export const GradientBackground = memo(function GradientBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[80px] opacity-20 mix-blend-multiply dark:mix-blend-screen will-change-[opacity]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[80px] opacity-20 mix-blend-multiply dark:mix-blend-screen will-change-[opacity]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px] opacity-10" />
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] [mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]" />
    </div>
  )
})
