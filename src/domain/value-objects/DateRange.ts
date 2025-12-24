export class DateRange {
  private constructor(
    private readonly _startDate: Date,
    private readonly _endDate: Date | undefined
  ) {}

  static create(startDate: Date, endDate: Date): DateRange {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      throw new Error('End date cannot be before start date')
    }

    return new DateRange(start, end)
  }

  static createOpenEnded(startDate: Date): DateRange {
    return new DateRange(new Date(startDate), undefined)
  }

  get startDate(): Date {
    return new Date(this._startDate)
  }

  get endDate(): Date | undefined {
    return this._endDate ? new Date(this._endDate) : undefined
  }

  isOpenEnded(): boolean {
    return this._endDate === undefined
  }

  getDurationInDays(): number | undefined {
    if (this._endDate === undefined) {
      return undefined
    }

    const diffTime = this._endDate.getTime() - this._startDate.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  contains(date: Date): boolean {
    const checkDate = new Date(date)

    if (checkDate < this._startDate) {
      return false
    }

    if (this._endDate !== undefined && checkDate > this._endDate) {
      return false
    }

    return true
  }

  overlaps(other: DateRange): boolean {
    // If this range is open-ended
    if (this._endDate === undefined) {
      return other._endDate === undefined || other._endDate >= this._startDate
    }

    // If other range is open-ended
    if (other._endDate === undefined) {
      return this._endDate >= other._startDate
    }

    // Both ranges have end dates
    return this._startDate <= other._endDate && this._endDate >= other._startDate
  }

  isInPast(): boolean {
    const now = new Date()
    return this._endDate !== undefined && this._endDate < now
  }

  isInFuture(): boolean {
    const now = new Date()
    return this._startDate > now
  }

  isCurrent(): boolean {
    const now = new Date()
    return this._startDate <= now && (this._endDate === undefined || this._endDate >= now)
  }

  toJSON(): { startDate: string; endDate?: string } {
    return {
      startDate: this._startDate.toISOString(),
      endDate: this._endDate?.toISOString(),
    }
  }
}
