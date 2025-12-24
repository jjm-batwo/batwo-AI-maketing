'use client'

import { useFormContext } from 'react-hook-form'
import type { CampaignFormData } from './index'

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

export function Step4Review() {
  const { watch } = useFormContext<CampaignFormData>()
  const formData = watch()

  return (
    <div className="space-y-6">
      <h3 className="font-medium">최종 확인</h3>
      <p className="text-sm text-muted-foreground">
        입력하신 내용을 확인해주세요. 캠페인 생성 후에도 수정할 수 있습니다.
      </p>

      <div className="divide-y rounded-lg border">
        <div className="flex justify-between p-4">
          <span className="text-muted-foreground">캠페인 이름</span>
          <span className="font-medium">{formData.name}</span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-muted-foreground">캠페인 목표</span>
          <span className="font-medium">
            {objectiveLabels[formData.objective]}
          </span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-muted-foreground">타겟 연령</span>
          <span className="font-medium">
            {formData.targetAudience.ageMin}세 ~ {formData.targetAudience.ageMax}세
          </span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-muted-foreground">타겟 성별</span>
          <span className="font-medium">
            {genderLabels[formData.targetAudience.gender]}
          </span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-muted-foreground">타겟 지역</span>
          <span className="font-medium">
            {formData.targetAudience.locations.join(', ')}
          </span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-muted-foreground">일일 예산</span>
          <span className="font-medium">
            {formData.dailyBudget.toLocaleString()}원
          </span>
        </div>
        <div className="flex justify-between p-4">
          <span className="text-muted-foreground">시작일</span>
          <span className="font-medium">{formData.startDate}</span>
        </div>
        {formData.endDate && (
          <div className="flex justify-between p-4">
            <span className="text-muted-foreground">종료일</span>
            <span className="font-medium">{formData.endDate}</span>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          🚀 캠페인 생성 후 Meta 광고 계정에 연결하면 바로 광고가 시작됩니다.
        </p>
      </div>
    </div>
  )
}
