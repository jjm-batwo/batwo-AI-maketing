import { BudgetAlert } from '../entities/BudgetAlert'

/**
 * BudgetAlert Repository Interface
 *
 * 예산 알림 설정의 영속성 계층 추상화
 */
export interface IBudgetAlertRepository {
  /**
   * 캠페인 ID로 예산 알림 설정 조회
   */
  findByCampaignId(campaignId: string): Promise<BudgetAlert | null>

  /**
   * 새 예산 알림 설정 생성
   */
  create(alert: BudgetAlert): Promise<BudgetAlert>

  /**
   * 예산 알림 설정 업데이트
   */
  update(alert: BudgetAlert): Promise<BudgetAlert>

  /**
   * 예산 알림 설정 삭제 (캠페인 ID 기준)
   */
  delete(campaignId: string): Promise<void>

  /**
   * 활성화된 모든 예산 알림 조회
   */
  findAllEnabled(): Promise<BudgetAlert[]>
}
