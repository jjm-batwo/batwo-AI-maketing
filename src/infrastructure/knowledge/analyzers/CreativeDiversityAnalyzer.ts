import { DomainAnalyzer, AnalysisInput } from '@application/ports/IKnowledgeBaseService'
import {
  KnowledgeDomain,
  DomainScore,
  ScoringFactor,
  DomainRecommendation,
  getGrade,
} from '@domain/value-objects/MarketingScience'

export class CreativeDiversityAnalyzer implements DomainAnalyzer {
  readonly domain: KnowledgeDomain = 'creative_diversity'

  analyze(input: AnalysisInput): DomainScore {
    const frequency = input.metrics?.frequency ?? 1.5
    const entityIdCount = input.creative?.entityIdCount ?? 5

    let score = 100
    const factors: ScoringFactor[] = []
    const recommendations: DomainRecommendation[] = []

    // 1. 피로도 분석 (Frequency)
    if (frequency > 3.5) {
      score -= 40
      factors.push({
        name: '광고 피로도 (Creative Fatigue)',
        score: -40,
        weight: 0.6,
        explanation:
          '동일 타겟 대상 노출 빈도가 3.5회를 초과하여 CPA 19% 상승 페널티 위험이 매우 큽니다.',
      })
      recommendations.push({
        domain: this.domain,
        priority: 'critical',
        recommendation: '긴급 소재 리프레시',
        scientificBasis: '빈도 3.5회 초과 시 Meta Lattice 랭킹 알고리즘에 의해 입찰 페널티 부과',
        expectedImpact: 'CPA 안정화 및 CPM 급등 방지',
        citations: [],
      })
    } else if (frequency > 2.5) {
      score -= 15
      factors.push({
        name: '피로도 누적 주의',
        score: -15,
        weight: 0.4,
        explanation: '노출 빈도가 2.5를 넘어 피로도가 누적되기 시작했습니다.',
      })
    } else {
      factors.push({
        name: '양호한 피로도',
        score: 0,
        weight: 0.4,
        explanation:
          '노출 빈도가 적절하게 관리되어 입찰 페널티 없이 탐색(Exploration)이 가능합니다.',
      })
    }

    // 2. Entity ID 다양성 분석
    if (entityIdCount < 4) {
      score -= 30
      factors.push({
        name: 'Entity ID 부족',
        score: -30,
        weight: 0.4,
        explanation: `현재 운용 가능한 이질적 크리에이티브(Entity ID) 개수가 ${entityIdCount}개로 매우 부족합니다.`,
      })
      recommendations.push({
        domain: this.domain,
        priority: 'high',
        recommendation:
          '시각적 스타일(UGC, 스튜디오, 텍스트 그래픽 등)이 완전히 다른 최소 10개의 신규 소재 확보',
        scientificBasis:
          'Andromeda 검색 인덱싱은 텍스트나 사소한 변경이 아닌, 완전히 다른 픽셀 패턴을 새로운 Entity ID로 인식함',
        expectedImpact: '광범위 타겟팅(Broad) 효율 극대화',
        citations: [],
      })
    } else if (entityIdCount >= 10) {
      score += 0 // maxScore constraint
      factors.push({
        name: '훌륭한 다양성 확보',
        score: 0,
        weight: 0.2,
        explanation:
          '10개 이상의 다채로운 Entity ID를 통해 알고리즘 학습에 필요한 충분한 재료를 제공하고 있습니다.',
      })
    } else {
      factors.push({
        name: '적정 수준의 다양성',
        score: 0,
        weight: 0.3,
        explanation:
          '최소한의 Entity ID를 확보 중이나, 성과 확장을 위해 시각적 스타일 다양화를 권장합니다.',
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
