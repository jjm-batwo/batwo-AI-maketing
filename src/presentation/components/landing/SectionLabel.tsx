import { cn } from '@/lib/utils'

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        'text-xs font-semibold tracking-widest uppercase text-primary mb-3',
        className
      )}
    >
      {children}
    </p>
  )
}
