import type { IAIService } from '@application/ports/IAIService'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { TargetAudience } from '@domain/entities/Campaign'

/**
 * Campaign data interface for creative analysis
 */
interface CampaignForAnalysis {
  name: string
  targetAudience?: TargetAudience
}

/**
 * 크리에이티브 테스트 추천 타입
 */
export interface CreativeTestRecommendation {
  currentAnalysis: {
    weakestElement: 'headline' | 'primary_text' | 'description' | 'cta'
    currentPerformance: { ctr: number; cvr: number }
    hypothesis: string
  }
  recommendedTest: {
    controlElement: string
    variants: {
      text: string
      hypothesis: string
      hookType: string
    }[]
    recommendedDuration: string
    minSampleSize: number
    expectedLift: string
  }
  testDesign: {
    metric: string
    confidenceLevel: number
    minimumDetectableEffect: number
  }
}

/**
 * 현재 성과 메트릭
 */
interface CurrentMetrics {
  ctr: number
  cvr: number
  impressions: number
  clicks: number
  conversions: number
  spend: number
}

/**
 * 크리에이티브 테스트 추천 서비스
 *
 * 캠페인의 현재 성과를 분석하여 A/B 테스트 설계를 추천합니다.
 */
export class CreativeTestRecommendationService {
  constructor(
    private readonly aiService: IAIService,
    private readonly campaignRepository: ICampaignRepository,
    private readonly kpiRepository: IKPIRepository
  ) {}

  /**
   * 캠페인에 대한 전체 테스트 추천 생성
   */
  async designTest(campaignId: string): Promise<CreativeTestRecommendation> {
    // 1. 캠페인 조회
    const campaign = await this.campaignRepository.findById(campaignId)
    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // 2. 최신 KPI 조회
    const latestKPI = await this.kpiRepository.findLatestByCampaignId(campaignId)
    if (!latestKPI) {
      throw new Error('No KPI data available for campaign')
    }

    // 3. 현재 성과 메트릭 계산
    const currentMetrics: CurrentMetrics = {
      ctr: latestKPI.calculateCTR().value,
      cvr:
        latestKPI.clicks > 0
          ? (latestKPI.conversions / latestKPI.clicks) * 100
          : 0,
      impressions: latestKPI.impressions,
      clicks: latestKPI.clicks,
      conversions: latestKPI.conversions,
      spend: latestKPI.spend.amount,
    }

    // 4. 현재 크리에이티브 분석 (약점 식별)
    const currentAnalysis = this.analyzeCurrentCreative(currentMetrics)

    // 5. AI를 사용하여 변형 생성
    const variants = await this.aiService.generateCreativeVariants({
      element: currentAnalysis.weakestElement,
      currentText: this.getCurrentElementText(
        currentAnalysis.weakestElement,
        campaign
      ),
      productContext: campaign.name,
      targetAudience: this.formatTargetAudience(campaign.targetAudience),
      weaknessAnalysis: currentAnalysis.hypothesis,
    })

    // 6. 샘플 사이즈 계산
    const minSampleSize = this.calculateSampleSize(
      currentMetrics.ctr,
      10, // 10% 최소 감지 효과
      95 // 95% 신뢰수준
    )

    // 7. 권장 기간 계산
    const recommendedDuration = this.calculateTestDuration(
      minSampleSize,
      currentMetrics.impressions
    )

    // 8. 종합 추천 반환
    return {
      currentAnalysis: {
        weakestElement: currentAnalysis.weakestElement,
        currentPerformance: {
          ctr: currentMetrics.ctr,
          cvr: currentMetrics.cvr,
        },
        hypothesis: currentAnalysis.hypothesis,
      },
      recommendedTest: {
        controlElement: this.getCurrentElementText(
          currentAnalysis.weakestElement,
          campaign
        ),
        variants,
        recommendedDuration,
        minSampleSize,
        expectedLift: this.estimateExpectedLift(currentAnalysis.weakestElement),
      },
      testDesign: {
        metric: currentAnalysis.weakestElement === 'headline' ? 'CTR' : 'CVR',
        confidenceLevel: 95,
        minimumDetectableEffect: 10,
      },
    }
  }

  /**
   * 현재 크리에이티브 요소 중 가장 약한 부분 식별
   */
  private analyzeCurrentCreative(
    currentMetrics: CurrentMetrics
  ): {
    weakestElement: 'headline' | 'primary_text' | 'description' | 'cta'
    hypothesis: string
  } {
    // 업계 평균 벤치마크 (간소화된 버전)
    const BENCHMARK_CTR = 1.5 // 1.5%
    const BENCHMARK_CVR = 2.0 // 2.0%

    const ctrRatio = currentMetrics.ctr / BENCHMARK_CTR
    const cvrRatio = currentMetrics.cvr / BENCHMARK_CVR

    // CTR이 낮으면 헤드라인 문제 (이미지는 별도 관리)
    if (ctrRatio < 0.7) {
      return {
        weakestElement: 'headline',
        hypothesis:
          'CTR이 업계 평균보다 낮습니다. 헤드라인이 사용자의 관심을 충분히 끌지 못하고 있을 가능성이 있습니다.',
      }
    }

    // CVR이 낮으면 본문/CTA 문제
    if (cvrRatio < 0.7) {
      return {
        weakestElement: 'primary_text',
        hypothesis:
          'CVR이 업계 평균보다 낮습니다. 본문 텍스트가 클릭한 사용자를 전환으로 이끌지 못하고 있을 가능성이 있습니다.',
      }
    }

    // 둘 다 평균 이하
    if (ctrRatio < 1.0 && cvrRatio < 1.0) {
      return {
        weakestElement: 'cta',
        hypothesis:
          '전반적인 성과가 평균 수준입니다. CTA를 더 명확하고 설득력 있게 개선하면 전환율을 높일 수 있습니다.',
      }
    }

    // 기본: 항상 개선 여지가 있음
    return {
      weakestElement: 'description',
      hypothesis:
        '전반적인 성과는 양호하지만, 상세 설명을 개선하여 추가적인 성과 향상을 기대할 수 있습니다.',
    }
  }

  /**
   * 통계적으로 유의미한 최소 샘플 사이즈 계산
   *
   * 공식: n = (Z_α/2 + Z_β)^2 * 2p(1-p) / (p*mde)^2
   * - Z_α/2: 신뢰수준에 따른 Z값 (95% = 1.96)
   * - Z_β: 검정력에 따른 Z값 (80% = 0.84)
   * - p: 기준 전환율
   * - mde: 최소 감지 효과 (%)
   */
  private calculateSampleSize(
    baselineRate: number,
    mdePercent: number,
    confidenceLevel: number
  ): number {
    const p = baselineRate / 100 // 비율로 변환
    const mde = mdePercent / 100

    // 신뢰수준에 따른 Z값
    const zAlpha = confidenceLevel === 95 ? 1.96 : 2.576 // 95% or 99%
    const zBeta = 0.84 // 80% 검정력

    // 샘플 사이즈 계산
    const numerator = Math.pow(zAlpha + zBeta, 2) * 2 * p * (1 - p)
    const denominator = Math.pow(p * mde, 2)

    const sampleSize = Math.ceil(numerator / denominator)

    // 최소값 보정 (너무 작으면 신뢰할 수 없음)
    return Math.max(sampleSize, 1000)
  }

  /**
   * 테스트 권장 기간 계산
   */
  private calculateTestDuration(
    minSampleSize: number,
    avgDailyImpressions: number
  ): string {
    if (avgDailyImpressions === 0) {
      return '14-21일 (트래픽 데이터 부족)'
    }

    const daysNeeded = Math.ceil(minSampleSize / avgDailyImpressions)

    // 최소 7일, 최대 30일
    const adjustedDays = Math.max(7, Math.min(daysNeeded, 30))

    if (adjustedDays <= 7) return '7-10일'
    if (adjustedDays <= 14) return '14일'
    if (adjustedDays <= 21) return '14-21일'
    return '21-30일'
  }

  /**
   * 요소별 예상 개선율 추정
   */
  private estimateExpectedLift(
    element: 'headline' | 'primary_text' | 'description' | 'cta'
  ): string {
    switch (element) {
      case 'headline':
        return '10-20% CTR 개선 예상'
      case 'primary_text':
        return '5-15% CVR 개선 예상'
      case 'cta':
        return '10-20% CVR 개선 예상'
      case 'description':
        return '5-10% CVR 개선 예상'
      default:
        return '10-15% 개선 예상'
    }
  }

  /**
   * 캠페인에서 현재 요소 텍스트 추출 (플레이스홀더)
   */
  private getCurrentElementText(
    element: 'headline' | 'primary_text' | 'description' | 'cta',
    campaign: CampaignForAnalysis
  ): string {
    // 실제 구현에서는 캠페인 데이터에서 추출
    // 현재는 플레이스홀더 텍스트 반환
    switch (element) {
      case 'headline':
        return campaign.name
      case 'primary_text':
        return `${campaign.name} - 지금 바로 시작하세요`
      case 'description':
        return '자세한 내용은 지금 확인하세요'
      case 'cta':
        return '자세히 보기'
      default:
        return campaign.name
    }
  }

  /**
   * 타겟 오디언스를 문자열로 포맷
   */
  private formatTargetAudience(targetAudience?: TargetAudience): string {
    if (!targetAudience) {
      return '일반 대중'
    }

    const parts: string[] = []

    if (targetAudience.ageMin && targetAudience.ageMax) {
      parts.push(`${targetAudience.ageMin}-${targetAudience.ageMax}세`)
    }

    if (targetAudience.genders && targetAudience.genders.length > 0) {
      const genderStr =
        targetAudience.genders[0] === 'all'
          ? '남녀 모두'
          : targetAudience.genders.join(', ')
      parts.push(genderStr)
    }

    if (targetAudience.interests && targetAudience.interests.length > 0) {
      parts.push(`관심사: ${targetAudience.interests.slice(0, 3).join(', ')}`)
    }

    return parts.join(', ') || '일반 대중'
  }
}
