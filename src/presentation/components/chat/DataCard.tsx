'use client'

import { cn } from '@/lib/utils'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface DataCardProps {
  cardType: string
  data: unknown
}

export function DataCard({ cardType, data }: DataCardProps) {
  switch (cardType) {
    case 'kpi_summary':
      return <KPISummaryCard data={data as KPISummaryData} />
    case 'campaign_list':
      return <CampaignListCard data={data as CampaignListData} />
    default:
      return <GenericDataCard cardType={cardType} data={data} />
  }
}

// ============================================================================
// KPI Summary Card
// ============================================================================

interface KPIMetric {
  label: string
  value: string
  change?: number
  unit?: string
}

interface KPISummaryData {
  period?: string
  metrics?: KPIMetric[]
}

function KPISummaryCard({ data }: { data: KPISummaryData }) {
  const metrics = data?.metrics ?? []

  return (
    <div data-testid="kpi-summary-card" className="mx-4 my-2 rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
        <BarChart3 className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-foreground">
          {data?.period ? `${data.period} 성과 요약` : 'KPI 요약'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-background px-3 py-2.5">
            <div className="text-[10px] text-muted-foreground mb-0.5">{metric.label}</div>
            <div className="text-sm font-semibold text-foreground">{metric.value}</div>
            {metric.change !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-0.5 text-[10px] mt-0.5',
                  metric.change > 0
                    ? 'text-emerald-600'
                    : metric.change < 0
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                )}
              >
                {metric.change > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : metric.change < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {metric.change > 0 ? '+' : ''}
                {metric.change.toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Campaign List Card
// ============================================================================

interface CampaignItem {
  name: string
  status: string
  spend?: string
  roas?: string
}

interface CampaignListData {
  campaigns?: CampaignItem[]
  total?: number
}

function CampaignListCard({ data }: { data: CampaignListData }) {
  const campaigns = data?.campaigns ?? []

  return (
    <div data-testid="campaign-list-card" className="mx-4 my-2 rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
        <span className="text-xs font-medium text-foreground">캠페인 목록</span>
        {data?.total !== undefined && (
          <span className="text-[10px] text-muted-foreground">총 {data.total}개</span>
        )}
      </div>
      <div className="divide-y divide-border">
        {campaigns.map((campaign, index) => (
          <div key={index} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <div className="text-xs font-medium text-foreground">{campaign.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {campaign.status}
              </div>
            </div>
            <div className="text-right">
              {campaign.spend && (
                <div className="text-xs text-foreground">{campaign.spend}</div>
              )}
              {campaign.roas && (
                <div className="text-[10px] text-muted-foreground">
                  ROAS {campaign.roas}
                </div>
              )}
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="px-4 py-4 text-center text-xs text-muted-foreground">
            표시할 캠페인이 없습니다
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Generic Data Card
// ============================================================================

function GenericDataCard({ cardType, data }: { cardType: string; data: unknown }) {
  return (
    <div className="mx-4 my-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <div className="text-xs text-muted-foreground mb-1">{cardType}</div>
      <pre className="text-xs text-foreground overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}
