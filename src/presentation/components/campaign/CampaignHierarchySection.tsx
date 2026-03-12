'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCampaignStore } from '@/presentation/stores/campaignStore'
import { useAdSetsWithInsights } from '@/presentation/hooks/useAdSetsWithInsights'
import { useAdsWithInsights } from '@/presentation/hooks/useAdsWithInsights'
import { type CampaignDatePreset } from '@/presentation/utils/campaignPeriod'
import { AdSetTable } from './AdSetTable'
import { AdTable } from './AdTable'
import { AdDetailPanel } from './AdDetailPanel'
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
  const router = useRouter()
  const selectedAdSetId = useCampaignStore((s) => s.selectedAdSetForDrilldown)
  const setSelectedAdSetId = useCampaignStore((s) => s.setSelectedAdSetForDrilldown)

  // Ad detail panel state
  const [editAdId, setEditAdId] = useState<string | null>(null)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)

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

  // AdSet: "수정" → drill down into ad set (same as click)
  const handleAdSetEdit = useCallback(
    (adSetId: string) => {
      setSelectedAdSetId(adSetId)
    },
    [setSelectedAdSetId]
  )

  // AdSet: "차트 보기" → navigate to campaign analytics
  const handleAdSetViewChart = useCallback(
    (/* _adSetId: string */) => {
      router.push(`/campaigns/${campaignId}/analytics`)
    },
    [router, campaignId]
  )

  // Ad: "수정" → open AdDetailPanel
  const handleAdEdit = useCallback((adId: string) => {
    setEditAdId(adId)
    setDetailPanelOpen(true)
  }, [])

  // Ad: "차트 보기" → navigate to campaign analytics
  const handleAdViewChart = useCallback(
    (/* _adId: string */) => {
      router.push(`/campaigns/${campaignId}/analytics`)
    },
    [router, campaignId]
  )

  return (
    <>
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
            <AdTable
              ads={adsQuery.data ?? []}
              isLoading={adsQuery.isLoading}
              onEdit={handleAdEdit}
              onViewChart={handleAdViewChart}
            />
          ) : (
            <AdSetTable
              adSets={adSetsQuery.data ?? []}
              isLoading={adSetsQuery.isLoading}
              onAdSetClick={handleAdSetClick}
              onEdit={handleAdSetEdit}
              onViewChart={handleAdSetViewChart}
            />
          )}
        </CardContent>
      </Card>

      {/* Ad Detail Slide Panel */}
      <AdDetailPanel adId={editAdId} open={detailPanelOpen} onOpenChange={setDetailPanelOpen} />
    </>
  )
}
