import type { IConversionEventRepository } from '@domain/repositories/IConversionEventRepository'
import {
  FUNNEL_STAGES,
  type FunnelData,
  type FunnelStageData,
} from '@domain/value-objects/FunnelStage'

export class ConversionFunnelService {
  constructor(private readonly conversionEventRepository: IConversionEventRepository) {}

  async getFunnel(pixelId: string, period: string): Promise<FunnelData> {
    const startDate = this.periodToDate(period)

    const counts = await Promise.all(
      FUNNEL_STAGES.map(async (stage) => ({
        stage,
        ...(await this.conversionEventRepository.countByEventName(pixelId, stage, startDate)),
      }))
    )

    const stages: FunnelStageData[] = counts.map((c, i) => {
      const prevCount = i === 0 ? c.count : counts[i - 1].count
      const conversionRate = prevCount > 0 ? (c.count / prevCount) * 100 : i === 0 ? 100 : 0
      return {
        stage: c.stage,
        count: c.count,
        value: c.value,
        conversionRate: Math.round(conversionRate * 10) / 10,
        dropOffRate: Math.round((100 - conversionRate) * 10) / 10,
      }
    })

    const firstCount = stages[0]?.count || 0
    const lastCount = stages[stages.length - 1]?.count || 0

    return {
      pixelId,
      period,
      stages,
      overallConversionRate: firstCount > 0 ? Math.round((lastCount / firstCount) * 1000) / 10 : 0,
      totalValue: stages.reduce((sum, s) => sum + s.value, 0),
    }
  }

  private periodToDate(period: string): Date {
    const now = new Date()
    const days = parseInt(period) || 30
    now.setDate(now.getDate() - days)
    return now
  }
}
