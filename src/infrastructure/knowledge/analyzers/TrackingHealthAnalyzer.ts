import { DomainAnalyzer, AnalysisInput } from '@application/ports/IKnowledgeBaseService'
import {
    KnowledgeDomain,
    DomainScore,
    ScoringFactor,
    DomainRecommendation,
    getGrade,
} from '@domain/value-objects/MarketingScience'

export class TrackingHealthAnalyzer implements DomainAnalyzer {
    readonly domain: KnowledgeDomain = 'tracking_health'

    analyze(input: AnalysisInput): DomainScore {
        // 기본적으로 건강하다고 가정하되 CAPI 점수를 통해 판별
        const emqScore = input.metrics?.emqScore ?? 8.0

        let score = 100
        const factors: ScoringFactor[] = []
        const recommendations: DomainRecommendation[] = []

        if (emqScore < 6.0) {
            score -= 50
            factors.push({
                name: '낮은 이벤트 매칭 품질 (EMQ)',
                score: -50,
                weight: 0.8,
                explanation: `EMQ 점수가 ${emqScore}점으로 매우 낮아 전환 학습 시그널이 대규모 누락되고 있습니다.`,
            })
            recommendations.push({
                domain: this.domain,
                priority: 'critical',
                recommendation: 'CAPI(Conversions API) 구축 및 하이브리드 이벤트 전송 환경 세팅',
                scientificBasis: 'CAPI 및 퀄리티 높은 매칭 파라미터는 쿠키리스 시대 Lattice 랭킹 시그널 복원의 핵심',
                expectedImpact: '보이지 않던 전환 성과 가시화 및 알고리즘 타겟팅 정확도 향상',
                citations: [],
            })
            recommendations.push({
                domain: this.domain,
                priority: 'high',
                recommendation: '해시된 이메일 등 가능한 모든 고객 파라미터(fbp, fbc 등) 보강 전송',
                scientificBasis: '사용자 데이터 파라미터 개수가 늘어날수록 EMQ 점수 상승',
                expectedImpact: '플랫폼 내 노출 대비 전환 성과 직접 매칭 증가',
                citations: [],
            })
        } else if (emqScore < 8.0) {
            score -= 20
            factors.push({
                name: '매칭 품질 개선 여지',
                score: -20,
                weight: 0.5,
                explanation: `EMQ 점수가 ${emqScore}점으로 양호하나, 추가 파라미터를 통해 고도화 가능합니다.`,
            })
        } else {
            factors.push({
                name: '완벽한 트래킹 건전성',
                score: 0,
                weight: 0.5,
                explanation: 'EMQ 8.0 이상의 우수한 매칭 품질로 쿠키리스 환경에서도 강력한 전환 시그널을 알고리즘에 전달 중입니다.',
            })
        }

        score = Math.max(0, Math.min(100, score))

        return {
            domain: this.domain,
            score,
            maxScore: 100,
            grade: getGrade(score),
            factors,
            citations: [],
            recommendations,
        }
    }
}
