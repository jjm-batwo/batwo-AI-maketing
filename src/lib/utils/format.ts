const KRW_CURRENCY = 'KRW'

export function formatNumber(value: number): string {
  return value.toLocaleString()
}

export function formatCurrency(amount: number, currency: string = KRW_CURRENCY): string {
  const rounded = Math.round(amount)

  if (currency === KRW_CURRENCY) {
    return `₩${rounded.toLocaleString()}`
  }

  return `${currency} ${rounded.toLocaleString()}`
}

export function formatCompactKrw(amount: number): string {
  const rounded = Math.round(amount)

  if (rounded >= 10000) {
    return `${Math.round(rounded / 10000).toLocaleString()}만원`
  }

  return `${rounded.toLocaleString()}원`
}

export function formatPercent(value: number, fractionDigits: number = 2): string {
  return `${value.toFixed(fractionDigits)}%`
}

export function formatMultiplier(value: number, fractionDigits: number = 2): string {
  return `${value.toFixed(fractionDigits)}x`
}
