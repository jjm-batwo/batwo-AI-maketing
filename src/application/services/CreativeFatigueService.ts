import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import type { FatigueLevel } from '@application/dto/report/EnhancedReportSections'

interface FatigueScoreInput {
  frequency: number
  currentCtr: number
  initialCtr: number
  activeDays: number
}

interface BrandingAdjustResult {
  score: number
  fatigueLevel: FatigueLevel
  note?: string
}

interface TrendAdjustResult {
  fatigueLevel: FatigueLevel
}

export class CreativeFatigueService {
  /**
   * 피로도 점수 계산 (0-100)
   * Frequency Factor 40 + CTR Decay 40 + Duration 20 = 100
   */
  calculateFatigueScore(input: FatigueScoreInput): number {
    const freqFactor = Math.min(40, Math.max(0, ((input.frequency - 1.0) / 4.0) * 40))

    const ctrDecay = input.initialCtr > 0
      ? Math.max(0, ((input.initialCtr - input.currentCtr) / input.initialCtr) * 100)
      : 0
    const ctrFactor = Math.min(40, ctrDecay)

    const durFactor = Math.min(20, Math.max(0, ((input.activeDays - 7) / 23) * 20))

    return Math.round(freqFactor + ctrFactor + durFactor)
  }

  getFatigueLevel(score: number): FatigueLevel {
    if (score <= 30) return 'healthy'
    if (score <= 60) return 'warning'
    return 'critical'
  }

  adjustFatigueForBranding(
    score: number,
    objective: CampaignObjective,
    currentCtr: number,
    initialCtr: number
  ): BrandingAdjustResult {
    if (objective === CampaignObjective.AWARENESS) {
      const ctrDecayPercent = initialCtr > 0
        ? ((initialCtr - currentCtr) / initialCtr) * 100
        : 0

      if (ctrDecayPercent < 10) {
        const adjustedScore = Math.max(0, score - 20)
        return {
          score: adjustedScore,
          fatigueLevel: this.getFatigueLevel(adjustedScore),
          note: '브랜딩 캠페인: 반복 노출이 브랜드 인지에 긍정적일 수 있음',
        }
      }
    }

    return { score, fatigueLevel: this.getFatigueLevel(score) }
  }

  adjustForRecentTrend(
    score: number,
    ctrTrend: number[]
  ): TrendAdjustResult {
    const level = this.getFatigueLevel(score)

    if (level !== 'critical' || ctrTrend.length < 3) {
      return { fatigueLevel: level }
    }

    const last3 = ctrTrend.slice(-3)
    const isRising = last3[0] < last3[1] && last3[1] < last3[2]

    if (isRising) {
      return { fatigueLevel: 'warning' }
    }

    return { fatigueLevel: level }
  }
}
