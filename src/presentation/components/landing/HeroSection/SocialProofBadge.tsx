import { memo } from 'react'
import { Star } from 'lucide-react'

const USER_AVATARS = [1, 2, 3, 4] as const
const STAR_INDICES = [0, 1, 2, 3, 4] as const

export const SocialProofBadge = memo(function SocialProofBadge() {
  return (
    <div className="mt-10 flex items-center justify-center lg:justify-start gap-5">
      <div className="flex -space-x-3" role="group" aria-label="사용자 프로필">
        {USER_AVATARS.map((i) => (
          <UserAvatar key={i} index={i} />
        ))}
        <div
          className="w-9 h-9 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground relative z-0"
          aria-label="1,000명 이상의 추가 사용자"
        >
          <span aria-hidden="true">+1k</span>
        </div>
      </div>
      <div className="text-sm">
        <div className="flex items-center gap-1 mb-0.5">
          <div className="flex text-amber-400" role="img" aria-label="5점 만점에 4.9점">
            {STAR_INDICES.map((i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            ))}
          </div>
          <span className="font-bold">4.9/5.0</span>
        </div>
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">1,200+</span> 마케터가 선택한 솔루션
        </p>
      </div>
    </div>
  )
})

interface UserAvatarProps {
  index: number
}

const UserAvatar = memo(function UserAvatar({ index }: UserAvatarProps) {
  return (
    <div
      className="w-9 h-9 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-indigo-400 to-purple-500 shadow-sm relative"
      style={{ zIndex: 10 - index }}
      aria-label={`사용자 ${index}`}
    >
      <span aria-hidden="true">User</span>
    </div>
  )
})
