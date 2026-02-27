'use client'

import Link from 'next/link'
import { useUpdateCampaign } from '@/presentation/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil, BarChart3, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AdSetList } from '@/presentation/components/campaign/AdSetList'

const statusConfig = {
  ACTIVE: { label: '진행 중', className: 'bg-green-500/15 text-green-500' },
  PAUSED: { label: '일시정지', className: 'bg-yellow-500/15 text-yellow-500' },
  COMPLETED: { label: '완료', className: 'bg-muted text-muted-foreground' },
  DRAFT: { label: '초안', className: 'bg-primary/15 text-primary' },
  PENDING_REVIEW: { label: '검토 중', className: 'bg-purple-500/15 text-purple-500' },
}

const objectiveLabels: Record<string, string> = {
  TRAFFIC: '트래픽',
  CONVERSIONS: '전환',
  BRAND_AWARENESS: '브랜드 인지도',
  REACH: '도달',
  ENGAGEMENT: '참여',
}

interface Campaign {
  id: string
  name: string
  objective: string
  status: string
  dailyBudget?: number
  totalSpent?: number
  conversions?: number
  roas?: number
  impressions?: number
  clicks?: number
  startDate?: string
  endDate?: string
  createdAt?: string
}

interface CampaignDetailClientProps {
  campaign: Campaign
}

export function CampaignDetailClient({ campaign }: CampaignDetailClientProps) {
  const updateCampaign = useUpdateCampaign()

  const statusInfo = statusConfig[campaign.status as keyof typeof statusConfig] || statusConfig.DRAFT
  const objectiveLabel = objectiveLabels[campaign.objective] || campaign.objective

  const handleStatusChange = (newStatus: 'ACTIVE' | 'PAUSED') => {
    updateCampaign.mutate({ id: campaign.id, status: newStatus })
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
            <Link href={`/campaigns/${campaign.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              수정
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/campaigns/${campaign.id}/analytics`}>
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

      {/* AdSet List */}
      <AdSetList campaignId={campaign.id} />

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
