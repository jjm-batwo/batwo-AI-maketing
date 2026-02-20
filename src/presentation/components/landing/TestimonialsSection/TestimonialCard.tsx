import { memo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Quote } from 'lucide-react'
import { StarRating } from './StarRating'
import type { Testimonial } from './testimonialData'

interface TestimonialCardProps {
  testimonial: Testimonial
}

export const TestimonialCard = memo(function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="group h-full bg-white border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-200 cursor-default">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Quote Icon */}
        <Quote
          className="h-8 w-8 text-primary/20 mb-4"
          aria-hidden="true"
        />

        {/* Content */}
        <blockquote className="text-slate-600 flex-1 mb-4 leading-relaxed font-medium">
          &ldquo;{testimonial.content}&rdquo;
        </blockquote>

        {/* Rating */}
        <StarRating rating={testimonial.rating} />

        {/* Metrics Badge */}
        {testimonial.metrics && (
          <div
            className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm w-fit"
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
          <Avatar className={testimonial.avatarColor}>
            <AvatarFallback className="text-white font-medium" aria-label={testimonial.name}>
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
