import { Money } from '../value-objects/Money'

export interface CreateAdKPIProps {
  adId: string
  adSetId: string
  campaignId: string
  creativeId: string
  impressions: number
  clicks: number
  linkClicks: number
  conversions: number
  spend: Money
  revenue: Money
  reach: number
  frequency: number
  cpm: number       // Meta pre-calculated (A5: number, Money 아님)
  cpc: number       // Meta pre-calculated (A5: number, Money 아님)
  videoViews: number
  thruPlays: number
  date: Date
}

export interface AdKPIProps extends CreateAdKPIProps {
  id: string
  createdAt: Date
}

export class AdKPI {
  private constructor(
    private readonly _id: string,
    private readonly _adId: string,
    private readonly _adSetId: string,
    private readonly _campaignId: string,
    private readonly _creativeId: string,
    private readonly _impressions: number,
    private readonly _clicks: number,
    private readonly _linkClicks: number,
    private readonly _conversions: number,
    private readonly _spend: Money,
    private readonly _revenue: Money,
    private readonly _reach: number,
    private readonly _frequency: number,
    private readonly _cpm: number,
    private readonly _cpc: number,
    private readonly _videoViews: number,
    private readonly _thruPlays: number,
    private readonly _date: Date,
    private readonly _createdAt: Date
  ) {}

  static create(props: CreateAdKPIProps): AdKPI {
    AdKPI.validate(props)
    return new AdKPI(
      crypto.randomUUID(),
      props.adId,
      props.adSetId,
      props.campaignId,
      props.creativeId,
      props.impressions,
      props.clicks,
      props.linkClicks,
      props.conversions,
      props.spend,
      props.revenue,
      props.reach,
      props.frequency,
      props.cpm,
      props.cpc,
      props.videoViews,
      props.thruPlays,
      props.date,
      new Date()
    )
  }

  static restore(props: AdKPIProps): AdKPI {
    return new AdKPI(
      props.id,
      props.adId,
      props.adSetId,
      props.campaignId,
      props.creativeId,
      props.impressions,
      props.clicks,
      props.linkClicks,
      props.conversions,
      props.spend,
      props.revenue,
      props.reach,
      props.frequency,
      props.cpm,
      props.cpc,
      props.videoViews,
      props.thruPlays,
      props.date,
      props.createdAt
    )
  }

  private static validate(props: CreateAdKPIProps): void {
    if (props.impressions < 0) throw new Error('Impressions cannot be negative')
    if (props.clicks < 0) throw new Error('Clicks cannot be negative')
    if (props.linkClicks < 0) throw new Error('Link clicks cannot be negative')
    if (props.conversions < 0) throw new Error('Conversions cannot be negative')
  }

  // --- Getters ---
  get id(): string { return this._id }
  get adId(): string { return this._adId }
  get adSetId(): string { return this._adSetId }
  get campaignId(): string { return this._campaignId }
  get creativeId(): string { return this._creativeId }
  get impressions(): number { return this._impressions }
  get clicks(): number { return this._clicks }
  get linkClicks(): number { return this._linkClicks }
  get conversions(): number { return this._conversions }
  get spend(): Money { return this._spend }
  get revenue(): Money { return this._revenue }
  get reach(): number { return this._reach }
  get frequency(): number { return this._frequency }
  get cpm(): number { return this._cpm }
  get cpc(): number { return this._cpc }
  get videoViews(): number { return this._videoViews }
  get thruPlays(): number { return this._thruPlays }
  get date(): Date { return new Date(this._date) }
  get createdAt(): Date { return new Date(this._createdAt) }

  // --- Calculated metrics (getter) ---
  get ctr(): number {
    if (this._impressions === 0) return 0
    return (this._clicks / this._impressions) * 100
  }

  get cvr(): number {
    if (this._clicks === 0) return 0
    return (this._conversions / this._clicks) * 100
  }

  get roas(): number {
    if (this._spend.isZero()) return 0
    return this._revenue.amount / this._spend.amount
  }

  get thruPlayRate(): number {
    if (this._impressions === 0) return 0
    return (this._thruPlays / this._impressions) * 100
  }

  toJSON(): AdKPIProps {
    return {
      id: this._id,
      adId: this._adId,
      adSetId: this._adSetId,
      campaignId: this._campaignId,
      creativeId: this._creativeId,
      impressions: this._impressions,
      clicks: this._clicks,
      linkClicks: this._linkClicks,
      conversions: this._conversions,
      spend: this._spend,
      revenue: this._revenue,
      reach: this._reach,
      frequency: this._frequency,
      cpm: this._cpm,
      cpc: this._cpc,
      videoViews: this._videoViews,
      thruPlays: this._thruPlays,
      date: this._date,
      createdAt: this._createdAt,
    }
  }
}
