/**
 * RuleAction 값 객체
 *
 * 자동 최적화 규칙이 트리거될 때 수행할 액션을 정의.
 * 순수 함수, 외부 의존성 없음, 불변성 보장.
 */

export type ActionType = 'PAUSE_CAMPAIGN' | 'REDUCE_BUDGET' | 'INCREASE_BUDGET' | 'ALERT_ONLY'
export type NotifyChannel = 'email' | 'slack' | 'in_app'

export interface ActionParams {
  percentage?: number
  notifyChannel?: NotifyChannel
}

export class RuleAction {
  private constructor(
    private readonly _type: ActionType,
    private readonly _params: ActionParams
  ) {}

  static create(type: ActionType, params: ActionParams): RuleAction {
    return new RuleAction(type, params)
  }

  /** 캠페인 일시중지 편의 팩토리 */
  static pauseCampaign(): RuleAction {
    return new RuleAction('PAUSE_CAMPAIGN', {})
  }

  /** 예산 축소 편의 팩토리 */
  static reduceBudget(percentage: number): RuleAction {
    return new RuleAction('REDUCE_BUDGET', { percentage })
  }

  /** 알림만 전송 편의 팩토리 */
  static alertOnly(channel: NotifyChannel = 'in_app'): RuleAction {
    return new RuleAction('ALERT_ONLY', { notifyChannel: channel })
  }

  get type(): ActionType {
    return this._type
  }

  get params(): ActionParams {
    return { ...this._params }
  }

  toJSON(): { type: ActionType; params: ActionParams } {
    return {
      type: this._type,
      params: { ...this._params },
    }
  }
}
