import { memo } from 'react'

// 단순화된 radial gradient — 복수의 blur 원 제거, 단일 중앙 광원으로 통일
export const GradientBackground = memo(function GradientBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/8 rounded-full blur-[150px]" />
    </div>
  )
})
