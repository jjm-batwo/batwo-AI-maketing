import { describe, it, expect } from 'vitest'
import { CreativeDiversityAnalyzer } from '@infrastructure/knowledge/analyzers/CreativeDiversityAnalyzer'

describe('CreativeDiversityAnalyzer', () => {
    const analyzer = new CreativeDiversityAnalyzer()

    it('domain은 creative_diversity여야 한다', () => {
        expect(analyzer.domain).toBe('creative_diversity')
    })

    it('피로도가 높으면 감점하고 리프레시를 권고해야 한다', () => {
        const result = analyzer.analyze({
            metrics: { frequency: 4.0 },
            creative: { entityIdCount: 3 },
        })

        expect(result.score).toBeLessThan(50)
        expect(result.factors.some((f) => f.name.includes('피로도') || f.name.includes('Fatigue'))).toBe(true)
        expect(result.recommendations.some((r) => r.recommendation.includes('리프레시') || r.recommendation.includes('Entity ID'))).toBe(true)
    })

    it('Entity ID가 충분하고 빈도가 적절하면 A+ 등급을 반환해야 한다', () => {
        const result = analyzer.analyze({
            metrics: { frequency: 2.0 },
            creative: { entityIdCount: 15 },
        })

        expect(result.grade).toBe('A+')
        expect(result.score).toBeGreaterThanOrEqual(90)
    })
})
