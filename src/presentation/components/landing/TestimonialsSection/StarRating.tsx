import { memo, useMemo } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
}

export const StarRating = memo(function StarRating({ rating }: StarRatingProps) {
  const stars = useMemo(() => Array.from({ length: 5 }), [])

  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating}점 만점에 ${rating}점`}>
      {stars.map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
})
