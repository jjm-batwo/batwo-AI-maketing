'use client'

import { useRouter } from 'next/navigation'
import { CampaignEditForm, CampaignEditFormData } from '@/presentation/components/campaign/CampaignEditForm'
import { useCampaignMutations } from '@/presentation/hooks/useCampaignMutations'
import { useUIStore } from '@/presentation/stores'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CampaignData {
  id: string
  name: string
  objective: string
  status: string
  dailyBudget: number
  startDate: string
  endDate?: string
  targetAudience?: {
    ageMin: number
    ageMax: number
    gender: 'ALL' | 'MALE' | 'FEMALE'
    locations: string[]
    interests?: string[]
  }
}

interface CampaignEditClientProps {
  campaign: CampaignData | null
  campaignId: string
  fetchError: string | null
}

export function CampaignEditClient({ campaign, campaignId, fetchError }: CampaignEditClientProps) {
  const router = useRouter()
  const { updateCampaignAsync, isUpdating, updateError } = useCampaignMutations()
  const { addToast } = useUIStore()

  const handleSubmit = async (data: CampaignEditFormData) => {
    try {
      await updateCampaignAsync({
        campaignId,
        name: data.name,
        dailyBudget: data.dailyBudget,
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        targetAudience: data.targetAudience,
      })

      addToast({
        type: 'success',
        message: '캠페인이 성공적으로 수정되었습니다',
      })

      router.push(`/campaigns/${campaignId}`)
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : '캠페인 수정에 실패했습니다',
      })
    }
  }

  const handleCancel = () => {
    router.push(`/campaigns/${campaignId}`)
  }

  if (!campaign && !fetchError) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (fetchError || !campaign) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-800">{fetchError || '캠페인을 찾을 수 없습니다'}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="mr-2 h-4 w-4" />
              캠페인 목록으로
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/campaigns/${campaignId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">캠페인 수정</h1>
          <p className="text-muted-foreground">{campaign.name}</p>
        </div>
      </div>

      <CampaignEditForm
        initialData={campaign}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isUpdating}
        error={updateError?.message || null}
      />
    </div>
  )
}
