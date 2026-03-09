import { describe, it, expect } from 'vitest'
import { TrackingHealthAnalyzer } from '@infrastructure/knowledge/analyzers/TrackingHealthAnalyzer'

describe('TrackingHealthAnalyzer', () => {
    const analyzer = new TrackingHealthAnalyzer()

    it('domain은 tracking_health여야 한다', () => {
        expect(analyzer.domain).toBe('tracking_health')
    })

    it('EMQ 점수가 6.0 미만이면 감점하고 CAPI 구축을 권고해야 한다', () => {
        const result = analyzer.analyze({
            metrics: { emqScore: 4.5 },
        })

        expect(result.score).toBeLessThan(60)
        expect(result.factors.some((f) => f.name.includes('EMQ') || f.name.includes('품질'))).toBe(true)
        expect(result.recommendations.some((r) => r.recommendation.includes('CAPI') || r.recommendation.includes('보강'))).toBe(true)
    })

    it('EMQ 점수가 높으면 최고 등급을 반환해야 한다', () => {
        const result = analyzer.analyze({
            metrics: { emqScore: 8.5 },
        })

        expect(result.grade).toMatch(/A|A\+/)
        expect(result.score).toBeGreaterThanOrEqual(80)
    })
})
