import { BudgetAlert } from '@/domain/entities/BudgetAlert'
import { IBudgetAlertRepository } from '@/domain/repositories/IBudgetAlertRepository'
import { IKPIRepository } from '@/domain/repositories/IKPIRepository'

export type BudgetStatus = 'normal' | 'warning' | 'exceeded'

export interface BudgetStatusResult {
  status: BudgetStatus
  spendPercent: number
  shouldAlert: boolean
  thresholdPercent?: number
}

export interface CreateAlertInput {
  campaignId: string
  thresholdPercent: number
}

export interface UpdateAlertInput {
  campaignId: string
  thresholdPercent?: number
  isEnabled?: boolean
}

/**
 * BudgetAlertService
 *
 * 캠페인 예산 알림 관련 비즈니스 로직을 처리하는 애플리케이션 서비스
 */
export class BudgetAlertService {
  constructor(
    private readonly budgetAlertRepo: IBudgetAlertRepository,
    private readonly kpiRepo: IKPIRepository
  ) {}

  /**
   * 새 예산 알림 생성
   */
  async createAlert(input: CreateAlertInput): Promise<BudgetAlert> {
    // 임계값 검증
    if (input.thresholdPercent < 1 || input.thresholdPercent > 100) {
      throw new Error('임계값은 1-100 사이여야 합니다')
    }

    // 기존 알림 확인
    const existing = await this.budgetAlertRepo.findByCampaignId(input.campaignId)
    if (existing) {
      throw new Error('이 캠페인에 이미 예산 알림이 설정되어 있습니다')
    }

    const alert = BudgetAlert.create({
      campaignId: input.campaignId,
      thresholdPercent: input.thresholdPercent,
      isEnabled: true,
    })

    return this.budgetAlertRepo.create(alert)
  }

  /**
   * 예산 알림 업데이트
   */
  async updateAlert(input: UpdateAlertInput): Promise<BudgetAlert> {
    const alert = await this.budgetAlertRepo.findByCampaignId(input.campaignId)
    if (!alert) {
      throw new Error('예산 알림 설정을 찾을 수 없습니다')
    }

    let updatedAlert = alert

    if (input.thresholdPercent !== undefined) {
      updatedAlert = updatedAlert.updateThreshold(input.thresholdPercent)
    }

    if (input.isEnabled !== undefined) {
      updatedAlert = input.isEnabled ? updatedAlert.enable() : updatedAlert.disable()
    }

    return this.budgetAlertRepo.update(updatedAlert)
  }

  /**
   * 알림 활성화/비활성화 토글
   */
  async toggleAlert(campaignId: string, isEnabled: boolean): Promise<BudgetAlert> {
    const alert = await this.budgetAlertRepo.findByCampaignId(campaignId)
    if (!alert) {
      throw new Error('예산 알림 설정을 찾을 수 없습니다')
    }

    const updatedAlert = isEnabled ? alert.enable() : alert.disable()
    return this.budgetAlertRepo.update(updatedAlert)
  }

  /**
   * 예산 상태 확인
   *
   * @param campaignId 캠페인 ID
   * @param dailyBudget 일일 예산 (원)
   * @returns 예산 상태 결과
   */
  async checkBudgetStatus(
    campaignId: string,
    dailyBudget: number
  ): Promise<BudgetStatusResult> {
    const alert = await this.budgetAlertRepo.findByCampaignId(campaignId)

    // 오늘 날짜 기준 누적 지출액 조회
    const today = new Date()
    const spend = await this.kpiRepo.getCumulativeSpend(campaignId, today)

    // 소진율 계산
    const spendPercent = dailyBudget > 0 ? Math.round((spend / dailyBudget) * 100) : 0

    // 상태 결정
    let status: BudgetStatus = 'normal'
    if (spendPercent >= 100) {
      status = 'exceeded'
    } else if (alert && spendPercent >= alert.thresholdPercent) {
      status = 'warning'
    } else if (!alert && spendPercent >= 80) {
      // 알림 설정이 없어도 80% 이상이면 warning
      status = 'warning'
    }

    // 알림 발송 여부 결정
    const shouldAlert =
      alert !== null &&
      alert.isEnabled &&
      (status === 'warning' || status === 'exceeded') &&
      !alert.hasAlertedToday()

    return {
      status,
      spendPercent,
      shouldAlert,
      thresholdPercent: alert?.thresholdPercent,
    }
  }

  /**
   * 알림 발송 완료 표시
   */
  async markAsAlerted(campaignId: string): Promise<BudgetAlert> {
    const alert = await this.budgetAlertRepo.findByCampaignId(campaignId)
    if (!alert) {
      throw new Error('예산 알림 설정을 찾을 수 없습니다')
    }

    const alertedAlert = alert.markAsAlerted()
    return this.budgetAlertRepo.update(alertedAlert)
  }

  /**
   * 예산 알림 삭제
   */
  async deleteAlert(campaignId: string): Promise<void> {
    await this.budgetAlertRepo.delete(campaignId)
  }

  /**
   * 캠페인의 예산 알림 조회
   */
  async getAlert(campaignId: string): Promise<BudgetAlert | null> {
    return this.budgetAlertRepo.findByCampaignId(campaignId)
  }
}
