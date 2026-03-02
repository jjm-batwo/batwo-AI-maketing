'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCampaignStore } from '@/presentation/stores/campaignStore'
import { useAdSetsWithInsights } from '@/presentation/hooks/useAdSetsWithInsights'
import { useAdsWithInsights } from '@/presentation/hooks/useAdsWithInsights'
import { type CampaignDatePreset } from '@/presentation/utils/campaignPeriod'
import { AdSetTable } from './AdSetTable'
import { AdTable } from './AdTable'
import { HierarchyBreadcrumb } from './HierarchyBreadcrumb'

interface CampaignHierarchySectionProps {
  campaignId: string
  campaignName: string
  datePreset?: CampaignDatePreset
}

export function CampaignHierarchySection({
  campaignId,
  campaignName,
  datePreset = 'last_7d',
}: CampaignHierarchySectionProps) {
  const selectedAdSetId = useCampaignStore((s) => s.selectedAdSetForDrilldown)
  const setSelectedAdSetId = useCampaignStore((s) => s.setSelectedAdSetForDrilldown)

  const adSetsQuery = useAdSetsWithInsights(campaignId, datePreset)
  const adsQuery = useAdsWithInsights(selectedAdSetId ?? '', datePreset)

  const selectedAdSetName = useMemo(() => {
    if (!selectedAdSetId || !adSetsQuery.data) return null
    return adSetsQuery.data.find((a) => a.id === selectedAdSetId)?.name ?? null
  }, [selectedAdSetId, adSetsQuery.data])

  const breadcrumbItems: Array<{ label: string; onClick?: () => void }> = useMemo(() => {
    const items: Array<{ label: string; onClick?: () => void }> = [
      {
        label: campaignName,
        onClick: () => setSelectedAdSetId(null),
      },
    ]

    if (selectedAdSetId && selectedAdSetName) {
      items.push({ label: selectedAdSetName })
    }

    return items
  }, [campaignName, selectedAdSetId, selectedAdSetName, setSelectedAdSetId])

  const handleAdSetClick = (adSetId: string) => {
    setSelectedAdSetId(adSetId)
  }

  const handleBackToCampaign = () => {
    setSelectedAdSetId(null)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{selectedAdSetId ? '광고' : '광고 세트'}</CardTitle>
          {selectedAdSetId && (
            <button
              type="button"
              onClick={handleBackToCampaign}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← 광고 세트 목록
            </button>
          )}
        </div>
        <HierarchyBreadcrumb items={breadcrumbItems} />
      </CardHeader>
      <CardContent>
        {selectedAdSetId ? (
          <AdTable ads={adsQuery.data ?? []} isLoading={adsQuery.isLoading} />
        ) : (
          <AdSetTable
            adSets={adSetsQuery.data ?? []}
            isLoading={adSetsQuery.isLoading}
            onAdSetClick={handleAdSetClick}
          />
        )}
      </CardContent>
    </Card>
  )
}
