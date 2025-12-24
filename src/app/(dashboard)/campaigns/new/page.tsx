'use client'

import { useRouter } from 'next/navigation'
import { CampaignCreateForm } from '@/presentation/components/campaign'
import { useCreateCampaign, useCampaignQuota } from '@/presentation/hooks'
import { useCampaignStore, useUIStore, useQuotaStore } from '@/presentation/stores'
import { QuotaExceededDialog } from '@/presentation/components/quota'

export default function NewCampaignPage() {
  const router = useRouter()
  const { clearFormDraft } = useCampaignStore()
  const { addToast } = useUIStore()
  const { isQuotaExceededDialogOpen, closeQuotaExceededDialog, openQuotaExceededDialog } = useQuotaStore()

  const createCampaign = useCreateCampaign()
  const { isExceeded: quotaExceeded } = useCampaignQuota()

  const handleSubmit = async (data: {
    name: string
    objective: string
    targetAudience: {
      ageMin: number
      ageMax: number
      gender: 'ALL' | 'MALE' | 'FEMALE'
      locations: string[]
      interests?: string[]
    }
    dailyBudget: number
    startDate: string
    endDate?: string
  }) => {
    if (quotaExceeded) {
      openQuotaExceededDialog('campaigns')
      return
    }

    try {
      await createCampaign.mutateAsync(data)
      clearFormDraft()
      addToast({
        type: 'success',
        message: '캠페인이 성공적으로 생성되었습니다',
      })
      router.push('/campaigns')
    } catch (error) {
      addToast({
        type: 'error',
        message: error instanceof Error ? error.message : '캠페인 생성에 실패했습니다',
      })
    }
  }

  const handleCancel = () => {
    router.push('/campaigns')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">새 캠페인 만들기</h1>
        <p className="text-muted-foreground">
          단계별로 캠페인 정보를 입력해주세요
        </p>
      </div>

      <CampaignCreateForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        quotaExceeded={quotaExceeded}
        isSubmitting={createCampaign.isPending}
      />

      <QuotaExceededDialog
        open={isQuotaExceededDialogOpen}
        onClose={closeQuotaExceededDialog}
        onUpgrade={() => {
          closeQuotaExceededDialog()
          router.push('/settings/billing')
        }}
        type="CAMPAIGN_CREATE"
      />
    </div>
  )
}
