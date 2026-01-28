import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Quote } from 'lucide-react'
import { StarRating } from './StarRating'
import type { Testimonial } from './testimonialData'

interface TestimonialCardProps {
  testimonial: Testimonial
}

export const TestimonialCard = memo(function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="group h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 cursor-default">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Quote Icon */}
        <Quote
          className="h-8 w-8 text-primary/20 mb-4 transition-all duration-300 group-hover:text-primary/40 group-hover:scale-110"
          aria-hidden="true"
        />

        {/* Content */}
        <blockquote className="text-muted-foreground flex-1 mb-4">
          &ldquo;{testimonial.content}&rdquo;
        </blockquote>

        {/* Rating */}
        <StarRating rating={testimonial.rating} />

        {/* Metrics Badge */}
        {testimonial.metrics && (
          <div
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm w-fit transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105"
            role="status"
            aria-label={`${testimonial.metrics.label} ${testimonial.metrics.value}`}
          >
            <span className="font-semibold" aria-hidden="true">
              {testimonial.metrics.value}
            </span>
            <span aria-hidden="true">{testimonial.metrics.label}</span>
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t">
          <Avatar>
            <AvatarImage src={testimonial.avatar} alt={`${testimonial.name} 프로필 사진`} />
            <AvatarFallback aria-label={testimonial.name}>
              {testimonial.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{testimonial.name}</div>
            <div className="text-sm text-muted-foreground">
              {testimonial.role} <span aria-hidden="true">·</span> {testimonial.company}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
