// Advantage+ 캠페인 설정 값 객체
export interface AdvantageConfigProps {
  advantageBudget: boolean    // 캠페인 레벨 예산 자동 최적화
  advantageAudience: boolean  // AI 타겟팅 자동화
  advantagePlacement: boolean // 자동 배치
}

export class AdvantageConfig {
  private constructor(
    private readonly _advantageBudget: boolean,
    private readonly _advantageAudience: boolean,
    private readonly _advantagePlacement: boolean,
  ) {}

  static create(props: AdvantageConfigProps): AdvantageConfig {
    return new AdvantageConfig(
      props.advantageBudget,
      props.advantageAudience,
      props.advantagePlacement,
    )
  }

  get advantageBudget(): boolean {
    return this._advantageBudget
  }

  get advantageAudience(): boolean {
    return this._advantageAudience
  }

  get advantagePlacement(): boolean {
    return this._advantagePlacement
  }

  // 3개 레버 모두 true면 Advantage+ 캠페인
  isAdvantagePlus(): boolean {
    return this._advantageBudget && this._advantageAudience && this._advantagePlacement
  }

  toJSON(): AdvantageConfigProps {
    return {
      advantageBudget: this._advantageBudget,
      advantageAudience: this._advantageAudience,
      advantagePlacement: this._advantagePlacement,
    }
  }
}
