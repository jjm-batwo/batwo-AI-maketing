'use client'

import { memo } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface HierarchyBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export const HierarchyBreadcrumb = memo(function HierarchyBreadcrumb({
  items,
  className,
}: HierarchyBreadcrumbProps) {
  return (
    <nav aria-label="계층 탐색" className={cn('flex items-center gap-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            {isLast ? (
              <span className="font-semibold text-foreground">{item.label}</span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
              >
                {item.label}
              </button>
            )}
          </span>
        )
      })}
    </nav>
  )
})
