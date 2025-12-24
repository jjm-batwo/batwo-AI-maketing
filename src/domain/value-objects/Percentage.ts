export interface PercentageOptions {
  allowOver100?: boolean
}

export class Percentage {
  private constructor(private readonly _value: number) {}

  static fromValue(value: number, options: PercentageOptions = {}): Percentage {
    if (value < 0) {
      throw new Error('Percentage cannot be negative')
    }

    if (!options.allowOver100 && value > 100) {
      throw new Error('Percentage cannot exceed 100')
    }

    return new Percentage(value)
  }

  static fromDecimal(decimal: number, options: PercentageOptions = {}): Percentage {
    return Percentage.fromValue(decimal * 100, options)
  }

  get value(): number {
    return this._value
  }

  get decimal(): number {
    return this._value / 100
  }

  isZero(): boolean {
    return this._value === 0
  }

  format(decimalPlaces: number = 2): string {
    const rounded = Number(this._value.toFixed(decimalPlaces))
    return `${rounded}%`
  }

  equals(other: Percentage): boolean {
    return this._value === other._value
  }

  isLessThan(other: Percentage): boolean {
    return this._value < other._value
  }

  isGreaterThan(other: Percentage): boolean {
    return this._value > other._value
  }

  of(value: number): number {
    return (this._value / 100) * value
  }

  difference(other: Percentage): Percentage {
    const diff = Math.abs(this._value - other._value)
    return new Percentage(diff)
  }

  toJSON(): number {
    return this._value
  }
}
