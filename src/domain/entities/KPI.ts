import { Money } from '../value-objects/Money'
import { Percentage } from '../value-objects/Percentage'

export interface CreateKPIProps {
  campaignId: string
  impressions: number
  clicks: number
  conversions: number
  spend: Money
  revenue: Money
  date: Date
}

export interface KPIProps extends CreateKPIProps {
  id: string
  createdAt: Date
}

export interface KPIComparison {
  impressionsChange: Percentage
  clicksChange: Percentage
  conversionsChange: Percentage
  spendChange: Percentage
  revenueChange: Percentage
  roasChange: number
  ctrChange: Percentage
}

export class KPI {
  private constructor(
    private readonly _id: string,
    private readonly _campaignId: string,
    private readonly _impressions: number,
    private readonly _clicks: number,
    private readonly _conversions: number,
    private readonly _spend: Money,
    private readonly _revenue: Money,
    private readonly _date: Date,
    private readonly _createdAt: Date
  ) {}

  static create(props: CreateKPIProps): KPI {
    KPI.validate(props)

    return new KPI(
      crypto.randomUUID(),
      props.campaignId,
      props.impressions,
      props.clicks,
      props.conversions,
      props.spend,
      props.revenue,
      props.date,
      new Date()
    )
  }

  static restore(props: KPIProps): KPI {
    return new KPI(
      props.id,
      props.campaignId,
      props.impressions,
      props.clicks,
      props.conversions,
      props.spend,
      props.revenue,
      props.date,
      props.createdAt
    )
  }

  private static validate(props: CreateKPIProps): void {
    if (props.impressions < 0) {
      throw new Error('Impressions cannot be negative')
    }
    if (props.clicks < 0) {
      throw new Error('Clicks cannot be negative')
    }
    if (props.conversions < 0) {
      throw new Error('Conversions cannot be negative')
    }
  }

  // Getters
  get id(): string {
    return this._id
  }
  get campaignId(): string {
    return this._campaignId
  }
  get impressions(): number {
    return this._impressions
  }
  get clicks(): number {
    return this._clicks
  }
  get conversions(): number {
    return this._conversions
  }
  get spend(): Money {
    return this._spend
  }
  get revenue(): Money {
    return this._revenue
  }
  get date(): Date {
    return new Date(this._date)
  }
  get createdAt(): Date {
    return new Date(this._createdAt)
  }

  // Calculated metrics
  calculateROAS(): number {
    if (this._spend.isZero()) {
      return 0
    }
    return this._revenue.amount / this._spend.amount
  }

  calculateCPA(): Money {
    if (this._conversions === 0) {
      return Money.create(0, this._spend.currency)
    }
    return Money.create(Math.round(this._spend.amount / this._conversions), this._spend.currency)
  }

  calculateCTR(): Percentage {
    if (this._impressions === 0) {
      return Percentage.fromValue(0)
    }
    const ctr = (this._clicks / this._impressions) * 100
    return Percentage.fromValue(ctr)
  }

  calculateCVR(): Percentage {
    if (this._clicks === 0) {
      return Percentage.fromValue(0)
    }
    const cvr = (this._conversions / this._clicks) * 100
    return Percentage.fromValue(cvr)
  }

  calculateCPC(): Money {
    if (this._clicks === 0) {
      return Money.create(0, this._spend.currency)
    }
    return Money.create(Math.round(this._spend.amount / this._clicks), this._spend.currency)
  }

  calculateCPM(): Money {
    if (this._impressions === 0) {
      return Money.create(0, this._spend.currency)
    }
    return Money.create(
      Math.round((this._spend.amount / this._impressions) * 1000),
      this._spend.currency
    )
  }

  toJSON(): KPIProps {
    return {
      id: this._id,
      campaignId: this._campaignId,
      impressions: this._impressions,
      clicks: this._clicks,
      conversions: this._conversions,
      spend: this._spend,
      revenue: this._revenue,
      date: this._date,
      createdAt: this._createdAt,
    }
  }
}

export class KPISnapshot {
  static aggregate(kpis: KPI[]): KPI {
    if (kpis.length === 0) {
      return KPI.create({
        campaignId: '',
        impressions: 0,
        clicks: 0,
        conversions: 0,
        spend: Money.create(0, 'KRW'),
        revenue: Money.create(0, 'KRW'),
        date: new Date(),
      })
    }

    const firstKPI = kpis[0]
    let totalImpressions = 0
    let totalClicks = 0
    let totalConversions = 0
    let totalSpend = Money.create(0, firstKPI.spend.currency)
    let totalRevenue = Money.create(0, firstKPI.revenue.currency)

    for (const kpi of kpis) {
      totalImpressions += kpi.impressions
      totalClicks += kpi.clicks
      totalConversions += kpi.conversions
      totalSpend = totalSpend.add(kpi.spend)
      totalRevenue = totalRevenue.add(kpi.revenue)
    }

    return KPI.create({
      campaignId: firstKPI.campaignId,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      spend: totalSpend,
      revenue: totalRevenue,
      date: new Date(),
    })
  }

  static compare(current: KPI, previous: KPI): KPIComparison {
    const calculateChange = (current: number, previous: number): Percentage => {
      if (previous === 0) {
        return Percentage.fromValue(current > 0 ? 100 : 0)
      }
      const change = ((current - previous) / previous) * 100
      return Percentage.fromValue(Math.abs(change), { allowOver100: true })
    }

    return {
      impressionsChange: calculateChange(current.impressions, previous.impressions),
      clicksChange: calculateChange(current.clicks, previous.clicks),
      conversionsChange: calculateChange(current.conversions, previous.conversions),
      spendChange: calculateChange(current.spend.amount, previous.spend.amount),
      revenueChange: calculateChange(current.revenue.amount, previous.revenue.amount),
      roasChange: current.calculateROAS() - previous.calculateROAS(),
      ctrChange: current.calculateCTR().difference(previous.calculateCTR()),
    }
  }
}
