/**
 * BudgetAlert Entity
 *
 * 캠페인의 예산 소진 알림 설정을 관리하는 엔티티
 * 불변성을 보장하며 메서드는 새 인스턴스를 반환
 */
export interface BudgetAlertProps {
  id?: string
  campaignId: string
  thresholdPercent: number // 1-100
  isEnabled: boolean
  alertedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export class BudgetAlert {
  readonly id: string
  readonly campaignId: string
  readonly thresholdPercent: number
  readonly isEnabled: boolean
  readonly alertedAt: Date | null
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: Required<Omit<BudgetAlertProps, 'alertedAt'>> & { alertedAt: Date | null }) {
    this.id = props.id
    this.campaignId = props.campaignId
    this.thresholdPercent = props.thresholdPercent
    this.isEnabled = props.isEnabled
    this.alertedAt = props.alertedAt
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    Object.freeze(this)
  }

  /**
   * 새 BudgetAlert 인스턴스 생성
   */
  static create(props: BudgetAlertProps): BudgetAlert {
    const now = new Date()

    if (props.thresholdPercent < 1 || props.thresholdPercent > 100) {
      throw new Error('임계값은 1-100 사이여야 합니다')
    }

    return new BudgetAlert({
      id: props.id || crypto.randomUUID(),
      campaignId: props.campaignId,
      thresholdPercent: props.thresholdPercent,
      isEnabled: props.isEnabled ?? true,
      alertedAt: props.alertedAt ?? null,
      createdAt: props.createdAt || now,
      updatedAt: props.updatedAt || now,
    })
  }

  /**
   * 임계값 업데이트 (새 인스턴스 반환)
   */
  updateThreshold(thresholdPercent: number): BudgetAlert {
    if (thresholdPercent < 1 || thresholdPercent > 100) {
      throw new Error('임계값은 1-100 사이여야 합니다')
    }

    return new BudgetAlert({
      id: this.id,
      campaignId: this.campaignId,
      thresholdPercent,
      isEnabled: this.isEnabled,
      alertedAt: this.alertedAt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  /**
   * 알림 활성화 (새 인스턴스 반환)
   */
  enable(): BudgetAlert {
    return new BudgetAlert({
      id: this.id,
      campaignId: this.campaignId,
      thresholdPercent: this.thresholdPercent,
      isEnabled: true,
      alertedAt: this.alertedAt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  /**
   * 알림 비활성화 (새 인스턴스 반환)
   */
  disable(): BudgetAlert {
    return new BudgetAlert({
      id: this.id,
      campaignId: this.campaignId,
      thresholdPercent: this.thresholdPercent,
      isEnabled: false,
      alertedAt: this.alertedAt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  /**
   * 알림 발송 시점 기록 (새 인스턴스 반환)
   */
  markAsAlerted(): BudgetAlert {
    return new BudgetAlert({
      id: this.id,
      campaignId: this.campaignId,
      thresholdPercent: this.thresholdPercent,
      isEnabled: this.isEnabled,
      alertedAt: new Date(),
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  /**
   * 알림 상태 초기화 (새 인스턴스 반환)
   */
  resetAlertStatus(): BudgetAlert {
    return new BudgetAlert({
      id: this.id,
      campaignId: this.campaignId,
      thresholdPercent: this.thresholdPercent,
      isEnabled: this.isEnabled,
      alertedAt: null,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  /**
   * 오늘 이미 알림이 발송되었는지 확인
   */
  hasAlertedToday(): boolean {
    if (!this.alertedAt) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const alertedDate = new Date(this.alertedAt)
    alertedDate.setHours(0, 0, 0, 0)

    return alertedDate.getTime() === today.getTime()
  }
}
