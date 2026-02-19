import { memo } from 'react'
import { Star } from 'lucide-react'

// UserAvatar(가짜 "User" 텍스트 아바타) 제거 — 수치 강조 방식으로 전환
const STAR_INDICES = [0, 1, 2, 3, 4] as const

export const SocialProofBadge = memo(function SocialProofBadge() {
  return (
    <div className="mt-10 flex items-center justify-center lg:justify-start gap-4">
      <div className="flex items-center gap-1.5">
        <div className="flex text-amber-400" role="img" aria-label="5점 만점에 4.9점">
          {STAR_INDICES.map((i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          ))}
        </div>
        <span className="text-sm font-bold">4.9</span>
      </div>
      <div className="h-4 w-px bg-border" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">1,200+</span> 사업자가 사용 중
      </p>
    </div>
  )
})
