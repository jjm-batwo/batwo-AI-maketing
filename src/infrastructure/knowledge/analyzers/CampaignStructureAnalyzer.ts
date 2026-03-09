import { DomainAnalyzer, AnalysisInput } from '@application/ports/IKnowledgeBaseService'
import {
  KnowledgeDomain,
  DomainScore,
  ScoringFactor,
  DomainRecommendation,
  getGrade,
} from '@domain/value-objects/MarketingScience'

export class CampaignStructureAnalyzer implements DomainAnalyzer {
  readonly domain: KnowledgeDomain = 'campaign_structure'

  analyze(input: AnalysisInput): DomainScore {
    const weeklyConversions = input.metrics?.weeklyConversions ?? 50
    const adsetCount = input.metrics?.adsetCount ?? 1

    let score = 100
    const factors: ScoringFactor[] = []
    const recommendations: DomainRecommendation[] = []

    // 1. 학습 단계 통과 여부 (주간 50회)
    if (weeklyConversions < 50) {
      score -= 30
      factors.push({
        name: '학습 단계(Learning Phase) 지연',
        score: -30,
        weight: 0.5,
        explanation: `주간 전환수 ${weeklyConversions}회로 최소 기준인 50회에 미달하여 GEM 예측 모델이 최적화를 완료하지 못했습니다.`,
      })
      recommendations.push({
        domain: this.domain,
        priority: 'high',
        recommendation: '상위 퍼널 이벤트 기반 최적화 또는 타겟/게재위치 통합으로 데이터 집중',
        scientificBasis: '주 50회 전환 데이터 미달 시 머신러닝 최적화 실패율 대폭 상승',
        expectedImpact: '머신러닝 학습 통과 및 CPA 안정화',
        citations: [],
      })
    }

    // 2. 캠페인 파편화 (세트 개수 과다)
    if (adsetCount > 3) {
      score -= 30
      factors.push({
        name: '구조 파편화 (Fragmentation)',
        score: -30,
        weight: 0.5,
        explanation: `광고 세트가 ${adsetCount}개로 분산되어 계정 내 자기 잠식(Self-Cannibalization)이 발생하고 있습니다.`,
      })
      recommendations.push({
        domain: this.domain,
        priority: 'high',
        recommendation: 'Advantage+ 캠페인 등 단일 캠페인 구조로 예산 통폐합',
        scientificBasis:
          '캠페인/세트 수 축소만으로 CPA 최대 34% 절감 효과 검증 (2026 Meta Best Practice)',
        expectedImpact: 'CPM 단가 하락 및 데이터 볼륨 확보',
        citations: [],
      })
    }

    if (score === 100) {
      factors.push({
        name: '이상적인 계정 구조',
        score: 0,
        weight: 0.5,
        explanation:
          '파편화 없는 단일 구조와 풍부한 전환 데이터를 통해 알고리즘 효율을 극대화하고 있습니다.',
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
