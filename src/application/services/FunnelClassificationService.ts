import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { type FunnelStage, OBJECTIVE_TO_FUNNEL, FUNNEL_STAGE_LABELS } from '@domain/value-objects/FunnelStage'

type FunnelStageOrAuto = FunnelStage | 'auto'

interface StageSpend {
  stage: FunnelStageOrAuto
  spend: number
}

export class FunnelClassificationService {
  classifyFunnelStage(objective: CampaignObjective): FunnelStage {
    return OBJECTIVE_TO_FUNNEL[objective]
  }

  classifyWithAdvantage(
    objective: CampaignObjective,
    hasAdvantageConfig: boolean
  ): FunnelStageOrAuto {
    if (hasAdvantageConfig) return 'auto'
    return this.classifyFunnelStage(objective)
  }

  calculateBudgetRatios(stages: StageSpend[]): Map<FunnelStageOrAuto, number> {
    const totalExcludingAuto = stages
      .filter(s => s.stage !== 'auto')
      .reduce((sum, s) => sum + s.spend, 0)

    const ratios = new Map<FunnelStageOrAuto, number>()

    for (const { stage, spend } of stages) {
      if (stage === 'auto') {
        ratios.set('auto', 0)
      } else {
        ratios.set(stage, totalExcludingAuto > 0 ? (spend / totalExcludingAuto) * 100 : 0)
      }
    }

    return ratios
  }

  getStageLabel(stage: FunnelStageOrAuto): string {
    return FUNNEL_STAGE_LABELS[stage]
  }
}
