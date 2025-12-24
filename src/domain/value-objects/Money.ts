export type Currency = 'KRW' | 'USD' | 'EUR' | 'JPY'

const VALID_CURRENCIES: Currency[] = ['KRW', 'USD', 'EUR', 'JPY']

export class Money {
  private constructor(
    private readonly _amount: number,
    private readonly _currency: Currency
  ) {}

  static create(amount: number, currency: Currency = 'KRW'): Money {
    if (amount < 0) {
      throw new Error('Amount cannot be negative')
    }

    if (!VALID_CURRENCIES.includes(currency)) {
      throw new Error('Invalid currency')
    }

    return new Money(amount, currency)
  }

  get amount(): number {
    return this._amount
  }

  get currency(): Currency {
    return this._currency
  }

  add(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error('Cannot add money with different currencies')
    }

    return new Money(this._amount + other._amount, this._currency)
  }

  subtract(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error('Cannot subtract money with different currencies')
    }

    if (this._amount < other._amount) {
      throw new Error('Insufficient amount')
    }

    return new Money(this._amount - other._amount, this._currency)
  }

  multiply(factor: number): Money {
    const result = this._amount * factor
    // For KRW, round to nearest integer
    const rounded = this._currency === 'KRW' ? Math.round(result) : Math.round(result * 100) / 100

    return new Money(rounded, this._currency)
  }

  format(locale: string = 'ko-KR'): string {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency,
      minimumFractionDigits: this._currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: this._currency === 'KRW' ? 0 : 2,
    })

    return formatter.format(this._amount)
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency
  }

  isGreaterThan(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error('Cannot compare money with different currencies')
    }

    return this._amount > other._amount
  }

  isLessThan(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error('Cannot compare money with different currencies')
    }

    return this._amount < other._amount
  }

  isZero(): boolean {
    return this._amount === 0
  }

  toJSON(): { amount: number; currency: Currency } {
    return {
      amount: this._amount,
      currency: this._currency,
    }
  }
}
