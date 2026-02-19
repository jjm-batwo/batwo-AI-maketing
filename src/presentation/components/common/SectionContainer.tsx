import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionContainerProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  id?: string
}

/**
 * 랜딩/대시보드 섹션 래퍼 공통 컴포넌트
 * 일관된 패딩, 최대 너비, 타이틀 레이아웃을 제공
 */
export function SectionContainer({ children, title, description, className, id }: SectionContainerProps) {
  return (
    <section id={id} className={cn('py-20 md:py-32', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || description) && (
          <div className="text-center mb-16">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{title}</h2>
            )}
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
