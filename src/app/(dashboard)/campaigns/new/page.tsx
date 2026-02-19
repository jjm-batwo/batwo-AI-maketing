'use client'

import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { CampaignCreateForm } from '@/presentation/components/campaign'
import { useCreateCampaignWizard, useUploadAsset, useCampaignQuota } from '@/presentation/hooks'
import { useCampaignStore, useUIStore, useQuotaStore } from '@/presentation/stores'
import { QuotaExceededDialog } from '@/presentation/components/quota'
import type { ExtendedCampaignFormData } from '@/presentation/components/campaign/CampaignCreateForm/types'

export default function NewCampaignPage() {
  const router = useRouter()
  const { clearFormDraft, guideRecommendation, clearGuideRecommendation } = useCampaignStore()
  const { addToast, openChatPanel } = useUIStore()
  const { isQuotaExceededDialogOpen, closeQuotaExceededDialog, openQuotaExceededDialog } = useQuotaStore()

  const wizard = useCreateCampaignWizard()
  const uploadAsset = useUploadAsset()
  const { isExceeded: quotaExceeded } = useCampaignQuota()

  // AI 가이드 추천이 있으면 initialData 구성
  const guideInitialData = guideRecommendation
    ? {
        objective: guideRecommendation.formData.objective as ExtendedCampaignFormData['objective'],
        dailyBudget: guideRecommendation.formData.dailyBudget,
        campaignMode: guideRecommendation.formData.campaignMode as ExtendedCampaignFormData['campaignMode'],
      }
    : undefined

  const handleSubmit = async (data: ExtendedCampaignFormData) => {
    if (quotaExceeded) {
      openQuotaExceededDialog('campaigns')
      return
    }

    try {
      if (data.campaignMode === 'ADVANTAGE_PLUS') {
        await wizard.submitAdvantage(data)
      } else {
        await wizard.submitManual(data)
      }
      clearFormDraft()
      clearGuideRecommendation()
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

  const handleUploadAsset = async (file: File) => {
    const type = file.type.startsWith('video/') ? 'VIDEO' as const : 'IMAGE' as const
    return uploadAsset.mutateAsync({ file, type })
  }

  const handleCancel = () => {
    clearGuideRecommendation()
    router.push('/campaigns')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">새 캠페인 만들기</h1>
        <p className="text-muted-foreground">
          단계별로 캠페인 정보를 입력해주세요
        </p>
      </div>

      {!guideRecommendation && (
        <button
          type="button"
          onClick={() => {
            openChatPanel()
          }}
          className="flex items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors w-full"
        >
          <Sparkles className="h-4 w-4" />
          <div className="text-left">
            <span className="font-medium">AI 가이드로 시작하기</span>
            <span className="block text-xs text-blue-500 dark:text-blue-400">
              몇 가지 질문에 답하면 최적의 캠페인 설정을 추천해드려요
            </span>
          </div>
        </button>
      )}

      <CampaignCreateForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        quotaExceeded={quotaExceeded}
        isSubmitting={wizard.isSubmitting}
        submitStage={wizard.stage}
        onUploadAsset={handleUploadAsset}
        isUploading={uploadAsset.isPending}
        initialData={guideInitialData}
        fromGuide={!!guideRecommendation}
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
