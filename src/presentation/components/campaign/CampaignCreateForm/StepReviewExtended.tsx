'use client'

import { useFormContext } from 'react-hook-form'
import { CheckCircle2, Loader2, AlertCircle, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExtendedCampaignFormData, WizardSubmitStage } from './types'

const objectiveLabels: Record<string, string> = {
  TRAFFIC: '트래픽',
  CONVERSIONS: '전환',
  BRAND_AWARENESS: '브랜드 인지도',
  REACH: '도달',
  ENGAGEMENT: '참여',
}

const genderLabels: Record<string, string> = {
  ALL: '전체',
  MALE: '남성',
  FEMALE: '여성',
}

const formatLabels: Record<string, string> = {
  SINGLE_IMAGE: '단일 이미지',
  SINGLE_VIDEO: '단일 동영상',
  CAROUSEL: '캐러셀',
}

const ctaLabels: Record<string, string> = {
  SHOP_NOW: '지금 구매하기',
  LEARN_MORE: '자세히 알아보기',
  SIGN_UP: '가입하기',
  CONTACT_US: '문의하기',
  GET_OFFER: '할인 받기',
  BOOK_NOW: '지금 예약하기',
  APPLY_NOW: '지금 신청하기',
}

const stageLabels: Record<WizardSubmitStage, string> = {
  idle: '',
  'creating-campaign': '캠페인 생성 중...',
  'uploading-assets': '에셋 업로드 중...',
  'creating-creative': '크리에이티브 생성 중...',
  'creating-ad': '광고 생성 중...',
  done: '완료!',
  error: '오류 발생',
}

interface StepReviewExtendedProps {
  submitStage?: WizardSubmitStage
}

export function StepReviewExtended({ submitStage = 'idle' }: StepReviewExtendedProps) {
  const { watch } = useFormContext<ExtendedCampaignFormData>()
  const formData = watch()
  const isAdvantage = formData.campaignMode === 'ADVANTAGE_PLUS'

  // 제출 진행 상태 표시
  if (submitStage !== 'idle') {
    const stages: WizardSubmitStage[] = ['creating-campaign', 'creating-creative', 'creating-ad', 'done']
    const currentIndex = stages.indexOf(submitStage)

    return (
      <div className="space-y-6 py-4">
        <h3 className="text-center font-medium">광고 세팅 진행 중</h3>
        <div className="space-y-3">
          {stages.map((s, i) => {
            const isCompleted = currentIndex > i || submitStage === 'done'
            const isCurrent = submitStage === s
            const isError = submitStage === 'error' && currentIndex === i

            return (
              <div key={s} className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : isError ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-200" />
                )}
                <span className={cn(
                  'text-sm',
                  isCompleted && 'text-green-600',
                  isCurrent && 'font-medium text-primary',
                  isError && 'text-red-500',
                  !isCompleted && !isCurrent && !isError && 'text-muted-foreground'
                )}>
                  {stageLabels[s]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium">최종 확인</h3>
        <p className="text-sm text-muted-foreground">
          입력하신 내용을 확인해주세요. 제출 후에도 수정할 수 있습니다.
        </p>
      </div>

      {/* 캠페인 정보 */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">캠페인 정보</h4>
        <div className="divide-y rounded-lg border">
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">유형</span>
            <span className="text-sm font-medium">{isAdvantage ? 'Advantage+' : '수동'}</span>
          </div>
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">이름</span>
            <span className="text-sm font-medium">{formData.name}</span>
          </div>
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">목표</span>
            <span className="text-sm font-medium">{objectiveLabels[formData.objective]}</span>
          </div>
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">일일 예산</span>
            <span className="text-sm font-medium">{formData.dailyBudget?.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">기간</span>
            <span className="text-sm font-medium">
              {formData.startDate}{formData.endDate ? ` ~ ${formData.endDate}` : ' ~ 무기한'}
            </span>
          </div>
        </div>
      </div>

      {/* 타겟 (수동 모드) */}
      {!isAdvantage && formData.targetAudience && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-muted-foreground">타겟 오디언스</h4>
          <div className="divide-y rounded-lg border">
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">연령</span>
              <span className="text-sm font-medium">
                {formData.targetAudience.ageMin}세 ~ {formData.targetAudience.ageMax}세
              </span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">성별</span>
              <span className="text-sm font-medium">{genderLabels[formData.targetAudience.gender]}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">지역</span>
              <span className="text-sm font-medium">{formData.targetAudience.locations?.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* 크리에이티브 */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-muted-foreground">크리에이티브</h4>
        <div className="divide-y rounded-lg border">
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">포맷</span>
            <span className="text-sm font-medium">{formatLabels[formData.creative?.format] || '-'}</span>
          </div>
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">헤드라인</span>
            <span className="text-sm font-medium truncate ml-4">{formData.creative?.headline || '-'}</span>
          </div>
          <div className="flex justify-between p-3">
            <span className="text-sm text-muted-foreground">에셋</span>
            <span className="text-sm font-medium">{formData.creative?.assetIds?.length || 0}개</span>
          </div>
          {formData.creative?.callToAction && (
            <div className="flex justify-between p-3">
              <span className="text-sm text-muted-foreground">CTA</span>
              <span className="text-sm font-medium">{ctaLabels[formData.creative.callToAction]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Advantage+ 안내 */}
      {isAdvantage && (
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <Rocket className="h-4 w-4 inline" /> <strong>Advantage+</strong>: AI가 타겟팅, 배치, 예산을 자동으로 최적화합니다.
            캠페인, 광고 세트, 광고가 한번에 생성됩니다.
          </p>
        </div>
      )}
    </div>
  )
}
