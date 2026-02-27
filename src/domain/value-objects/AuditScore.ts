import { Money } from './Money'

export type AuditGrade = 'A' | 'B' | 'C' | 'D' | 'F'

export interface AuditFinding {
  type: 'positive' | 'warning' | 'critical'
  message: string
}

export interface AuditRecommendation {
  priority: 'high' | 'medium' | 'low'
  message: string
  estimatedImpact: string
}

export interface AuditCategory {
  name: string
  score: number
  findings: AuditFinding[]
  recommendations: AuditRecommendation[]
}

export interface AuditScoreProps {
  overall: number
  categories: AuditCategory[]
  estimatedWaste: Money
  estimatedImprovement: Money
  grade: AuditGrade
}

export interface CampaignAuditData {
  campaignId: string
  campaignName: string
  status: string
  dailyBudget: number
  currency: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  /** 캠페인 생성 시각 (ISO 8601). 최근 캠페인의 conversions=0 오탐 방지에 사용 */
  createdTime?: string
}

/**
 * 광고 계정 감사 점수 값 객체 (불변)
 * 4개 카테고리(예산 효율성, 타겟팅 정확도, 크리에이티브 성과, 전환 추적)를 평가하여
 * 종합 점수와 등급을 산정한다.
 */
export class AuditScore {
  readonly overall: number
  readonly categories: AuditCategory[]
  readonly estimatedWaste: Money
  readonly estimatedImprovement: Money
  readonly grade: AuditGrade

  private constructor(props: AuditScoreProps) {
    this.overall = props.overall
    this.categories = props.categories
    this.estimatedWaste = props.estimatedWaste
    this.estimatedImprovement = props.estimatedImprovement
    this.grade = props.grade
    Object.freeze(this)
  }

  /**
   * 캠페인 인사이트 데이터를 기반으로 감사 점수를 평가한다.
   */
  static evaluate(campaignInsights: CampaignAuditData[]): AuditScore {
    const budgetCategory = AuditScore.evaluateBudgetEfficiency(campaignInsights)
    const targetingCategory = AuditScore.evaluateTargetingAccuracy(campaignInsights)
    const creativeCategory = AuditScore.evaluateCreativePerformance(campaignInsights)
    const conversionCategory = AuditScore.evaluateConversionTracking(campaignInsights)

    const categories = [budgetCategory, targetingCategory, creativeCategory, conversionCategory]
    const overall = Math.round(
      categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length
    )
    const grade = AuditScore.assignGrade(overall)

    // 낭비 추정: ROAS < 1.0인 캠페인의 총 지출
    const wastedSpend = campaignInsights
      .filter(c => c.spend > 0 && c.revenue / c.spend < 1.0)
      .reduce((sum, c) => sum + c.spend, 0)

    // 개선 추정: 낮은 CTR/CVR 캠페인 spend의 30%를 보수적 추가 수익으로 산정
    const improvableSpend = campaignInsights
      .filter(c => {
        const ctr = c.impressions > 0 ? c.clicks / c.impressions : 0
        const cvr = c.clicks > 0 ? c.conversions / c.clicks : 0
        return ctr < 0.005 || cvr < 0.01
      })
      .reduce((sum, c) => sum + c.spend, 0)

    const currency = campaignInsights[0]?.currency ?? 'KRW'

    return new AuditScore({
      overall,
      categories,
      estimatedWaste: Money.create(Math.round(wastedSpend), currency as 'KRW' | 'USD' | 'EUR' | 'JPY'),
      estimatedImprovement: Money.create(Math.round(improvableSpend * 0.3), currency as 'KRW' | 'USD' | 'EUR' | 'JPY'),
      grade,
    })
  }

  /**
   * 점수를 등급으로 변환한다.
   * A: 80-100, B: 60-79, C: 40-59, D: 20-39, F: 0-19
   */
  static assignGrade(score: number): AuditGrade {
    if (score >= 80) return 'A'
    if (score >= 60) return 'B'
    if (score >= 40) return 'C'
    if (score >= 20) return 'D'
    return 'F'
  }

  /**
   * 예산 효율성 평가: ROAS < 1.0인 캠페인 비율 기반
   */
  private static evaluateBudgetEfficiency(campaigns: CampaignAuditData[]): AuditCategory {
    const findings: AuditFinding[] = []
    const recommendations: AuditRecommendation[] = []

    const lowRoasCampaigns = campaigns.filter(c => c.spend > 0 && c.revenue / c.spend < 1.0)
    const lowRoasRatio = campaigns.length > 0 ? lowRoasCampaigns.length / campaigns.length : 0

    // 점수: ROAS 1 미만 비율이 낮을수록 높은 점수
    const score = Math.round(Math.max(0, 100 - lowRoasRatio * 100))

    if (lowRoasCampaigns.length === 0) {
      findings.push({
        type: 'positive',
        message: '모든 캠페인이 ROAS 1.0 이상을 달성하고 있습니다.',
      })
    } else {
      lowRoasCampaigns.forEach(c => {
        const roas = c.spend > 0 ? (c.revenue / c.spend).toFixed(2) : '0.00'
        findings.push({
          type: 'critical',
          message: `캠페인 "${c.campaignName}"의 ROAS가 ${roas}로 1.0 미만입니다.`,
        })
      })
      recommendations.push({
        priority: 'high',
        message: `ROAS가 1.0 미만인 ${lowRoasCampaigns.length}개 캠페인을 일시중지하고 예산을 성과 좋은 캠페인에 집중하세요.`,
        estimatedImpact: `월 ₩${Math.round(lowRoasCampaigns.reduce((s, c) => s + c.spend, 0)).toLocaleString()} 낭비 절감 예상`,
      })
    }

    return { name: '예산 효율성', score, findings, recommendations }
  }

  /**
   * 타겟팅 정확도 평가: CTR 기반
   * CTR < 0.5%면 타겟팅 부정확, CTR > 2%면 우수
   */
  private static evaluateTargetingAccuracy(campaigns: CampaignAuditData[]): AuditCategory {
    const findings: AuditFinding[] = []
    const recommendations: AuditRecommendation[] = []

    const campaignsWithImpressions = campaigns.filter(c => c.impressions > 0)
    if (campaignsWithImpressions.length === 0) {
      return {
        name: '타겟팅 정확도',
        score: 0,
        findings: [{ type: 'warning', message: '노출 데이터가 없어 타겟팅을 평가할 수 없습니다.' }],
        recommendations: [],
      }
    }

    const lowCtrCampaigns = campaignsWithImpressions.filter(
      c => c.clicks / c.impressions < 0.005
    )
    const highCtrCampaigns = campaignsWithImpressions.filter(
      c => c.clicks / c.impressions > 0.02
    )

    const goodRatio = highCtrCampaigns.length / campaignsWithImpressions.length
    const badRatio = lowCtrCampaigns.length / campaignsWithImpressions.length
    const score = Math.round(Math.min(100, Math.max(0, 100 - badRatio * 80 + goodRatio * 20)))

    highCtrCampaigns.forEach(c => {
      const ctr = ((c.clicks / c.impressions) * 100).toFixed(2)
      findings.push({
        type: 'positive',
        message: `캠페인 "${c.campaignName}"의 CTR이 ${ctr}%로 우수합니다.`,
      })
    })

    lowCtrCampaigns.forEach(c => {
      const ctr = ((c.clicks / c.impressions) * 100).toFixed(2)
      findings.push({
        type: 'warning',
        message: `캠페인 "${c.campaignName}"의 CTR이 ${ctr}%로 낮습니다. 타겟팅 재검토가 필요합니다.`,
      })
    })

    if (lowCtrCampaigns.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: 'CTR이 낮은 캠페인의 타겟팅 조건(연령대, 관심사, 지역)을 재설정하세요.',
        estimatedImpact: 'CTR 0.5%p 개선 시 클릭 수 2배 증가 예상',
      })
    }

    return { name: '타겟팅 정확도', score, findings, recommendations }
  }

  /**
   * 크리에이티브 성과 평가: CVR 기반
   * CVR < 1%면 개선 필요, CVR > 3%면 우수
   */
  private static evaluateCreativePerformance(campaigns: CampaignAuditData[]): AuditCategory {
    const findings: AuditFinding[] = []
    const recommendations: AuditRecommendation[] = []

    const campaignsWithClicks = campaigns.filter(c => c.clicks > 0)
    if (campaignsWithClicks.length === 0) {
      return {
        name: '크리에이티브 성과',
        score: 0,
        findings: [{ type: 'warning', message: '클릭 데이터가 없어 크리에이티브를 평가할 수 없습니다.' }],
        recommendations: [],
      }
    }

    const lowCvrCampaigns = campaignsWithClicks.filter(
      c => c.conversions / c.clicks < 0.01
    )
    const highCvrCampaigns = campaignsWithClicks.filter(
      c => c.conversions / c.clicks > 0.03
    )

    const badRatio = lowCvrCampaigns.length / campaignsWithClicks.length
    const goodRatio = highCvrCampaigns.length / campaignsWithClicks.length
    const score = Math.round(Math.min(100, Math.max(0, 100 - badRatio * 80 + goodRatio * 20)))

    highCvrCampaigns.forEach(c => {
      const cvr = ((c.conversions / c.clicks) * 100).toFixed(2)
      findings.push({
        type: 'positive',
        message: `캠페인 "${c.campaignName}"의 전환율이 ${cvr}%로 우수합니다.`,
      })
    })

    lowCvrCampaigns.forEach(c => {
      const cvr = ((c.conversions / c.clicks) * 100).toFixed(2)
      findings.push({
        type: 'warning',
        message: `캠페인 "${c.campaignName}"의 전환율이 ${cvr}%로 낮습니다. 크리에이티브 개선이 필요합니다.`,
      })
    })

    if (lowCvrCampaigns.length > 0) {
      recommendations.push({
        priority: 'medium',
        message: '전환율이 낮은 캠페인의 광고 이미지, 카피, CTA를 A/B 테스트로 개선하세요.',
        estimatedImpact: 'CVR 1%p 개선 시 동일 예산 대비 전환 수 50% 증가 예상',
      })
    }

    return { name: '크리에이티브 성과', score, findings, recommendations }
  }

  /**
   * 전환 추적 평가: conversions가 0인 캠페인 = 전환 추적 미설정
   * 단, 최근 7일 이내 생성된 캠페인은 데이터 수집 중으로 간주하여 warning 처리
   */
  private static evaluateConversionTracking(campaigns: CampaignAuditData[]): AuditCategory {
    const findings: AuditFinding[] = []
    const recommendations: AuditRecommendation[] = []

    const RECENT_CAMPAIGN_DAYS = 7
    const recentThreshold = Date.now() - RECENT_CAMPAIGN_DAYS * 24 * 60 * 60 * 1000

    const untrackedCampaigns = campaigns.filter(c => c.conversions === 0)

    if (untrackedCampaigns.length === 0) {
      findings.push({
        type: 'positive',
        message: '모든 캠페인에 전환 추적이 설정되어 있습니다.',
      })
      return { name: '전환 추적', score: 100, findings, recommendations }
    }

    // conversions=0인 캠페인을 최근/오래된 두 그룹으로 분류
    const recentCampaigns = untrackedCampaigns.filter(
      c => c.createdTime && new Date(c.createdTime).getTime() > recentThreshold
    )
    const staleUntrackedCampaigns = untrackedCampaigns.filter(
      c => !c.createdTime || new Date(c.createdTime).getTime() <= recentThreshold
    )

    // 최근 캠페인: 데이터 수집 중 (warning)
    recentCampaigns.forEach(c => {
      findings.push({
        type: 'warning',
        message: `캠페인 "${c.campaignName}"은 최근 생성되어 데이터 수집 중입니다. 7일 후 다시 확인하세요.`,
      })
    })

    // 오래된 캠페인 또는 createdTime 없음: 전환 추적 미설정 (critical)
    staleUntrackedCampaigns.forEach(c => {
      findings.push({
        type: 'critical',
        message: `캠페인 "${c.campaignName}"에 전환 추적이 설정되어 있지 않습니다.`,
      })
    })

    if (staleUntrackedCampaigns.length > 0) {
      recommendations.push({
        priority: 'high',
        message: '전환 추적이 없는 캠페인에 Meta 픽셀 이벤트(Purchase, AddToCart 등)를 연결하세요.',
        estimatedImpact: '전환 데이터 확보 시 자동 최적화로 ROAS 평균 30% 개선 예상',
      })
    }

    // 점수 계산: recent 캠페인은 50% 가중 (완전 무시도 아니고 critical도 아닌 중간값)
    const effectiveTracked = campaigns.length - staleUntrackedCampaigns.length - recentCampaigns.length * 0.5
    const trackedRatio = effectiveTracked / campaigns.length
    const score = Math.round(trackedRatio * 100)

    return { name: '전환 추적', score, findings, recommendations }
  }

  toJSON(): AuditScoreProps {
    return {
      overall: this.overall,
      categories: this.categories,
      estimatedWaste: this.estimatedWaste,
      estimatedImprovement: this.estimatedImprovement,
      grade: this.grade,
    }
  }
}
