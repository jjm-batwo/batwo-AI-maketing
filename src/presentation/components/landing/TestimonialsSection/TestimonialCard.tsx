import { memo } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StarRating } from './StarRating'
import type { Testimonial } from './testimonialData'

interface TestimonialCardProps {
  testimonial: Testimonial
}

function renderWithHighlight(content: string, highlight: string) {
  const idx = content.indexOf(highlight)
  if (idx === -1) return <span>{content}</span>

  return (
    <>
      {content.slice(0, idx)}
      <span className="text-primary font-semibold">{highlight}</span>
      {content.slice(idx + highlight.length)}
    </>
  )
}

export const TestimonialCard = memo(function TestimonialCard({
  testimonial,
}: TestimonialCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 cursor-default break-inside-avoid mb-5">
      {/* Stars */}
      <StarRating rating={testimonial.rating} />

      {/* Content with highlight */}
      <blockquote className="mt-3 mb-4 text-sm text-gray-600 leading-relaxed">
        {renderWithHighlight(testimonial.content, testimonial.highlight)}
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <Avatar className={`w-9 h-9 ${testimonial.avatarColor}`}>
          <AvatarFallback className="text-white text-xs font-semibold" aria-label={testimonial.name}>
            {testimonial.name.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
          <p className="text-xs text-muted-foreground">
            {testimonial.role} · {testimonial.company}
          </p>
        </div>
      </div>
    </div>
  )
})
