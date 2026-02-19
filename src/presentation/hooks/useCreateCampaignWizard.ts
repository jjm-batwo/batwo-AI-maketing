'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { WizardSubmitStage, ExtendedCampaignFormData } from '@/presentation/components/campaign/CampaignCreateForm/types'

interface AdvantageCampaignResponse {
  campaign: { id: string }
  adSetId: string
}

interface CampaignResponse {
  id: string
}

interface CreateAdInput {
  adSetId: string
  name: string
  creativeId: string
}

async function createAdvantageCampaign(data: Record<string, unknown>): Promise<AdvantageCampaignResponse> {
  const response = await fetch('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '캠페인 생성에 실패했습니다')
  }
  return response.json()
}

async function createManualCampaign(data: Record<string, unknown>): Promise<CampaignResponse> {
  const response = await fetch('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '캠페인 생성에 실패했습니다')
  }
  return response.json()
}

async function createCreativeAPI(data: Record<string, unknown>) {
  const response = await fetch('/api/creatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '크리에이티브 생성에 실패했습니다')
  }
  return response.json()
}

async function createAdSetAPI(campaignId: string, data: Record<string, unknown>) {
  const response = await fetch(`/api/campaigns/${campaignId}/adsets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || error.error || '광고 세트 생성에 실패했습니다')
  }
  return response.json()
}

async function createAdAPI(input: CreateAdInput) {
  const response = await fetch(`/api/adsets/${input.adSetId}/ads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: input.name, creativeId: input.creativeId }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '광고 생성에 실패했습니다')
  }
  return response.json()
}

export function useCreateCampaignWizard() {
  const [stage, setStage] = useState<WizardSubmitStage>('idle')
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    queryClient.invalidateQueries({ queryKey: ['adsets'] })
    queryClient.invalidateQueries({ queryKey: ['creatives'] })
  }, [queryClient])

  // Advantage+ 모드 제출
  const submitAdvantage = useCallback(async (data: ExtendedCampaignFormData) => {
    setError(null)
    try {
      // 1. Campaign + AdSet 자동 생성
      setStage('creating-campaign')
      const campaignResult = await createAdvantageCampaign({
        name: data.name,
        objective: data.objective,
        dailyBudget: data.dailyBudget,
        currency: data.currency,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        advantageConfig: {
          advantageBudget: true,
          advantageAudience: true,
          advantagePlacement: true,
        },
      })

      // 2. Creative 생성
      setStage('creating-creative')
      const creative = await createCreativeAPI({
        name: data.creative.name || `${data.name} - 크리에이티브`,
        format: data.creative.format,
        primaryText: data.creative.primaryText,
        headline: data.creative.headline,
        description: data.creative.description,
        callToAction: data.creative.callToAction,
        linkUrl: data.creative.linkUrl,
        assets: data.creative.assetIds.map((assetId, index) => ({
          assetId,
          order: index,
        })),
      })

      // 3. Ad 생성 (AdSet + Creative 연결)
      setStage('creating-ad')
      await createAdAPI({
        adSetId: campaignResult.adSetId,
        name: `${data.name} - 광고`,
        creativeId: creative.id,
      })

      setStage('done')
      invalidateAll()
      return campaignResult.campaign.id
    } catch (err) {
      setStage('error')
      const message = err instanceof Error ? err.message : '캠페인 생성에 실패했습니다'
      setError(message)
      throw err
    }
  }, [invalidateAll])

  // 수동 모드 제출
  const submitManual = useCallback(async (data: ExtendedCampaignFormData) => {
    setError(null)
    try {
      // 1. Campaign 생성
      setStage('creating-campaign')
      const campaign = await createManualCampaign({
        name: data.name,
        objective: data.objective,
        dailyBudget: data.dailyBudget,
        currency: data.currency,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        targetAudience: data.targetAudience,
      })

      // 2. AdSet 수동 생성
      setStage('creating-campaign')
      const adSet = await createAdSetAPI(campaign.id, {
        name: data.adSetConfig.name || `${data.name} - 광고 세트`,
        dailyBudget: data.dailyBudget,
        currency: data.currency,
        billingEvent: data.adSetConfig.billingEvent,
        optimizationGoal: data.adSetConfig.optimizationGoal,
        bidStrategy: data.adSetConfig.bidStrategy,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      })

      // 3. Creative 생성
      setStage('creating-creative')
      const creative = await createCreativeAPI({
        name: data.creative.name || `${data.name} - 크리에이티브`,
        format: data.creative.format,
        primaryText: data.creative.primaryText,
        headline: data.creative.headline,
        description: data.creative.description,
        callToAction: data.creative.callToAction,
        linkUrl: data.creative.linkUrl,
        assets: data.creative.assetIds.map((assetId, index) => ({
          assetId,
          order: index,
        })),
      })

      // 4. Ad 생성
      setStage('creating-ad')
      await createAdAPI({
        adSetId: adSet.id,
        name: `${data.name} - 광고`,
        creativeId: creative.id,
      })

      setStage('done')
      invalidateAll()
      return campaign.id
    } catch (err) {
      setStage('error')
      const message = err instanceof Error ? err.message : '캠페인 생성에 실패했습니다'
      setError(message)
      throw err
    }
  }, [invalidateAll])

  const reset = useCallback(() => {
    setStage('idle')
    setError(null)
  }, [])

  return {
    stage,
    error,
    isSubmitting: stage !== 'idle' && stage !== 'done' && stage !== 'error',
    submitAdvantage,
    submitManual,
    reset,
  }
}
