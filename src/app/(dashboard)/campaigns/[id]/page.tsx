'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCampaign, useUpdateCampaign } from '@/presentation/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil, BarChart3, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusConfig = {
  ACTIVE: { label: '진행 중', className: 'bg-green-100 text-green-700' },
  PAUSED: { label: '일시정지', className: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: '완료', className: 'bg-gray-100 text-gray-700' },
  DRAFT: { label: '초안', className: 'bg-blue-100 text-blue-700' },
  PENDING_REVIEW: { label: '검토 중', className: 'bg-purple-100 text-purple-700' },
}

const objectiveLabels: Record<string, string> = {
  TRAFFIC: '트래픽',
  CONVERSIONS: '전환',
  BRAND_AWARENESS: '브랜드 인지도',
  REACH: '도달',
  ENGAGEMENT: '참여',
}

export default function CampaignDetailPage() {
  const params = useParams()
  const id = params.id as string
  const t = useTranslations()
  const { data: campaign, isLoading, error } = useCampaign(id)
  const updateCampaign = useUpdateCampaign()

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 animate-pulse bg-gray-200 rounded" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-6 w-full animate-pulse bg-gray-200 rounded" />
              <div className="h-6 w-3/4 animate-pulse bg-gray-200 rounded" />
              <div className="h-6 w-1/2 animate-pulse bg-gray-200 rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold text-red-600">
          {t('campaigns.error.notFound')}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {error?.message || t('campaigns.error.loadFailed')}
        </p>
        <Button asChild className="mt-4">
          <Link href="/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('campaigns.backToList')}
          </Link>
        </Button>
      </div>
    )
  }

  const statusInfo = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.DRAFT
  const objectiveLabel = objectiveLabels[campaign.objective] || campaign.objective

  const handleStatusChange = (newStatus: 'ACTIVE' | 'PAUSED') => {
    updateCampaign.mutate({ id, status: newStatus })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground">{objectiveLabel}</p>
          </div>
          <Badge className={cn('ml-2', statusInfo.className)}>
            {statusInfo.label}
          </Badge>
        </div>
        <div className="flex gap-2">
          {campaign.status === 'ACTIVE' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('PAUSED')}
              disabled={updateCampaign.isPending}
            >
              <Pause className="mr-2 h-4 w-4" />
              일시정지
            </Button>
          )}
          {campaign.status === 'PAUSED' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={updateCampaign.isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              재개
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/campaigns/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/campaigns/${id}/analytics`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              분석
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">일일 예산</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.dailyBudget?.toLocaleString() || 0}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">총 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.totalSpent?.toLocaleString() || 0}원</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">전환수</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.conversions?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{campaign.roas?.toFixed(2) || '0.00'}x</p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>캠페인 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">노출수</p>
              <p className="font-medium">{campaign.impressions?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">클릭수</p>
              <p className="font-medium">{campaign.clicks?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">시작일</p>
              <p className="font-medium">
                {campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('ko-KR') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">종료일</p>
              <p className="font-medium">
                {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('ko-KR') : '미정'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">생성일</p>
              <p className="font-medium">
                {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString('ko-KR') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CTR</p>
              <p className="font-medium">
                {campaign.impressions && campaign.clicks
                  ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
                  : '0.00'}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
