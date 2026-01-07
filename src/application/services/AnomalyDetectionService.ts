import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { KPI } from '@domain/entities/KPI'

export type AnomalyType = 'spike' | 'drop' | 'trend_change' | 'budget_anomaly'
export type AnomalySeverity = 'critical' | 'warning' | 'info'

export interface Anomaly {
  id: string
  campaignId: string
  campaignName: string
  type: AnomalyType
  severity: AnomalySeverity
  metric: string
  currentValue: number
  previousValue: number
  changePercent: number
  message: string
  detectedAt: Date
}

export interface AnomalyDetectionConfig {
  spikeThreshold: number // Percentage change to consider a spike (default: 50)
  dropThreshold: number // Percentage change to consider a drop (default: -30)
  budgetWarningThreshold: number // Budget usage percentage for warning (default: 80)
  minDataPoints: number // Minimum data points needed for trend analysis
}

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  spikeThreshold: 50,
  dropThreshold: -30,
  budgetWarningThreshold: 80,
  minDataPoints: 3,
}

export class AnomalyDetectionService {
  private readonly config: AnomalyDetectionConfig

  constructor(
    private readonly kpiRepository: IKPIRepository,
    private readonly campaignRepository: ICampaignRepository,
    config: Partial<AnomalyDetectionConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async detectAnomalies(userId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = []

    // Get all active campaigns for the user
    const campaigns = await this.campaignRepository.findByUserId(userId)
    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE')

    for (const campaign of activeCampaigns) {
      const campaignAnomalies = await this.detectCampaignAnomalies(campaign.id, campaign.name)
      anomalies.push(...campaignAnomalies)
    }

    // Sort by severity (critical first)
    return this.sortBySeverity(anomalies)
  }

  async detectCampaignAnomalies(
    campaignId: string,
    campaignName: string
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = []

    // Get recent KPIs for the campaign (last 7 days)
    const kpis = await this.kpiRepository.findByCampaignId(campaignId)
    if (kpis.length < 2) {
      return anomalies // Not enough data for comparison
    }

    // Sort by date descending
    const sortedKpis = [...kpis].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    )

    const latest = sortedKpis[0]
    const previous = sortedKpis[1]

    // Check for CPA anomalies
    const latestCpa = this.getCpaValue(latest)
    const previousCpa = this.getCpaValue(previous)
    if (latestCpa !== null && previousCpa !== null && previousCpa > 0) {
      const cpaChange = ((latestCpa - previousCpa) / previousCpa) * 100
      if (cpaChange >= this.config.spikeThreshold) {
        anomalies.push(this.createAnomaly({
          campaignId,
          campaignName,
          type: 'spike',
          severity: 'critical',
          metric: 'CPA',
          currentValue: latestCpa,
          previousValue: previousCpa,
          changePercent: cpaChange,
          message: `CPA가 ${cpaChange.toFixed(0)}% 급등했습니다. 광고 효율성을 점검해주세요.`,
        }))
      }
    }

    // Check for CTR anomalies
    const latestCtr = this.getCtrValue(latest)
    const previousCtr = this.getCtrValue(previous)
    if (latestCtr !== null && previousCtr !== null && previousCtr > 0) {
      const ctrChange = ((latestCtr - previousCtr) / previousCtr) * 100
      if (ctrChange <= this.config.dropThreshold) {
        anomalies.push(this.createAnomaly({
          campaignId,
          campaignName,
          type: 'drop',
          severity: 'warning',
          metric: 'CTR',
          currentValue: latestCtr,
          previousValue: previousCtr,
          changePercent: ctrChange,
          message: `CTR이 ${Math.abs(ctrChange).toFixed(0)}% 감소했습니다. 광고 소재를 검토해보세요.`,
        }))
      }
    }

    // Check for ROAS anomalies
    const latestRoas = latest.calculateROAS()
    const previousRoas = previous.calculateROAS()
    if (latestRoas > 0 || previousRoas > 0) {
      if (previousRoas > 0) {
        const roasChange = ((latestRoas - previousRoas) / previousRoas) * 100
        if (roasChange <= this.config.dropThreshold) {
          anomalies.push(this.createAnomaly({
            campaignId,
            campaignName,
            type: 'drop',
            severity: 'critical',
            metric: 'ROAS',
            currentValue: latestRoas,
            previousValue: previousRoas,
            changePercent: roasChange,
            message: `ROAS가 ${Math.abs(roasChange).toFixed(0)}% 감소했습니다. 타겟팅과 입찰 전략을 검토해주세요.`,
          }))
        } else if (roasChange >= this.config.spikeThreshold) {
          // Positive anomaly - ROAS spike is good!
          anomalies.push(this.createAnomaly({
            campaignId,
            campaignName,
            type: 'spike',
            severity: 'info',
            metric: 'ROAS',
            currentValue: latestRoas,
            previousValue: previousRoas,
            changePercent: roasChange,
            message: `ROAS가 ${roasChange.toFixed(0)}% 상승했습니다! 이 전략을 유지하세요.`,
          }))
        }
      }
    }

    // Check for spend anomalies (sudden increase)
    const latestSpend = latest.spend.amount
    const previousSpend = previous.spend.amount
    if (latestSpend > 0 && previousSpend > 0) {
      const spendChange = ((latestSpend - previousSpend) / previousSpend) * 100
      if (spendChange >= this.config.spikeThreshold * 1.5) {
        anomalies.push(this.createAnomaly({
          campaignId,
          campaignName,
          type: 'budget_anomaly',
          severity: 'warning',
          metric: '지출',
          currentValue: latestSpend,
          previousValue: previousSpend,
          changePercent: spendChange,
          message: `일일 지출이 ${spendChange.toFixed(0)}% 증가했습니다. 예산 설정을 확인해주세요.`,
        }))
      }
    }

    // Check for conversion drop
    if (latest.conversions > 0 || previous.conversions > 0) {
      if (previous.conversions > 0) {
        const convChange =
          ((latest.conversions - previous.conversions) / previous.conversions) * 100
        if (convChange <= this.config.dropThreshold * 1.5) {
          anomalies.push(this.createAnomaly({
            campaignId,
            campaignName,
            type: 'drop',
            severity: 'critical',
            metric: '전환',
            currentValue: latest.conversions,
            previousValue: previous.conversions,
            changePercent: convChange,
            message: `전환 수가 ${Math.abs(convChange).toFixed(0)}% 감소했습니다. 랜딩 페이지와 타겟팅을 점검해주세요.`,
          }))
        }
      }
    }

    return anomalies
  }

  private getCpaValue(kpi: KPI): number | null {
    const cpa = kpi.calculateCPA()
    return cpa.amount > 0 ? cpa.amount : null
  }

  private getCtrValue(kpi: KPI): number | null {
    const ctr = kpi.calculateCTR()
    return ctr.value
  }

  private createAnomaly(params: Omit<Anomaly, 'id' | 'detectedAt'>): Anomaly {
    return {
      ...params,
      id: `anomaly_${params.campaignId}_${params.metric}_${Date.now()}`,
      detectedAt: new Date(),
    }
  }

  private sortBySeverity(anomalies: Anomaly[]): Anomaly[] {
    const severityOrder: Record<AnomalySeverity, number> = {
      critical: 0,
      warning: 1,
      info: 2,
    }
    return anomalies.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    )
  }
}
