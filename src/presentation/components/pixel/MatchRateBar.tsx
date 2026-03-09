'use client'

import { cn } from '@/lib/utils'

interface MatchRateBarProps {
    /** matchRate (0~1), null이면 데이터 없음 */
    matchRate: number | null
    /** 컴팩트 모드 (높이 축소) */
    compact?: boolean
}

/**
 * matchRate(EMQ 근사치) 시각화 프로그레스 바
 *
 * 색상:
 * - ≥60% → green
 * - 40~59% → yellow
 * - <40% → red
 * - null → gray (데이터 수집 중)
 */
export function MatchRateBar({ matchRate, compact = false }: MatchRateBarProps) {
    if (matchRate === null) {
        return (
            <div data-testid="match-rate-bar" className="match-rate-bar unknown">
                <div
                    className={cn(
                        'w-full rounded-full bg-gray-200',
                        compact ? 'h-2' : 'h-3'
                    )}
                >
                    <div
                        className={cn(
                            'rounded-full bg-gray-400',
                            compact ? 'h-2' : 'h-3'
                        )}
                        style={{ width: '0%' }}
                    />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    데이터 수집 중
                </p>
            </div>
        )
    }

    const percentage = Math.round(matchRate * 100)

    const getColorClass = (rate: number) => {
        if (rate >= 0.6) return 'bg-green-500'
        if (rate >= 0.4) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    const getTextColorClass = (rate: number) => {
        if (rate >= 0.6) return 'text-green-700'
        if (rate >= 0.4) return 'text-yellow-700'
        return 'text-red-700'
    }

    return (
        <div data-testid="match-rate-bar" className={cn('match-rate-bar', matchRate < 0.6 ? (matchRate < 0.4 ? 'critical' : 'warning') : 'healthy')}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">이벤트 매칭률</span>
                <span className={cn('text-sm font-bold', getTextColorClass(matchRate))}>
                    {percentage}%
                </span>
            </div>
            <div
                className={cn(
                    'w-full rounded-full bg-gray-200',
                    compact ? 'h-2' : 'h-3'
                )}
            >
                <div
                    className={cn(
                        'rounded-full transition-all duration-500',
                        getColorClass(matchRate),
                        compact ? 'h-2' : 'h-3'
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    )
}
