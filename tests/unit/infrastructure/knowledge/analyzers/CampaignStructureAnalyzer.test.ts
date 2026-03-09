import { describe, it, expect } from 'vitest'
import { CampaignStructureAnalyzer } from '@infrastructure/knowledge/analyzers/CampaignStructureAnalyzer'

describe('CampaignStructureAnalyzer', () => {
    const analyzer = new CampaignStructureAnalyzer()

    it('domain은 campaign_structure여야 한다', () => {
        expect(analyzer.domain).toBe('campaign_structure')
    })

    it('주간 전환 수가 50회 미만이고 광고 세트가 많으면 감점하고 통합을 권고해야 한다', () => {
        const result = analyzer.analyze({
            metrics: { weeklyConversions: 20, adsetCount: 7 },
        })

        expect(result.score).toBeLessThan(60)
        expect(result.factors.some((f) => f.name.includes('학습') || f.name.includes('파편화'))).toBe(true)
        expect(result.recommendations.some((r) => r.recommendation.includes('통합') || r.recommendation.includes('단순화'))).toBe(true)
    })

    it('주간 전환 수가 충분하면 좋은 점수를 반환해야 한다', () => {
        const result = analyzer.analyze({
            metrics: { weeklyConversions: 100, adsetCount: 2 },
        })

        expect(result.score).toBeGreaterThanOrEqual(80)
    })
})
