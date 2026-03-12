import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  /** 섹션 레이블 (소문자 트래킹 텍스트) */
  label?: string
  /** 섹션 제목 */
  title: string
  /** 섹션 설명 */
  description?: string
  /** 텍스트 정렬 */
  align?: 'center' | 'left'
  /** 하단 마진 제거 여부 */
  noMargin?: boolean
  className?: string
}

/**
 * 랜딩/대시보드 공통 섹션 헤더
 * label + h2 + description 패턴을 통합
 */
export function SectionHeader({
  label,
  title,
  description,
  align = 'center',
  noMargin = false,
  className,
}: SectionHeaderProps) {
  const isCenter = align === 'center'

  return (
    <div className={cn(isCenter ? 'text-center' : 'text-left', !noMargin && 'mb-16', className)}>
      {label && (
        <p
          className={cn(
            'text-xs font-semibold tracking-widest uppercase text-primary mb-3',
            isCenter && 'text-center'
          )}
        >
          {label}
        </p>
      )}
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">{title}</h2>
      {description && (
        <p
          className={cn(
            'text-lg text-muted-foreground',
            isCenter ? 'max-w-2xl mx-auto' : 'max-w-2xl'
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
