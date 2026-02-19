'use client'

import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ExtendedCampaignFormData } from '../CampaignCreateForm/types'

const ctaOptions = [
  { value: 'SHOP_NOW', label: '지금 구매하기' },
  { value: 'LEARN_MORE', label: '자세히 알아보기' },
  { value: 'SIGN_UP', label: '가입하기' },
  { value: 'CONTACT_US', label: '문의하기' },
  { value: 'GET_OFFER', label: '할인 받기' },
  { value: 'BOOK_NOW', label: '지금 예약하기' },
  { value: 'APPLY_NOW', label: '지금 신청하기' },
]

export function AdCopyForm() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<ExtendedCampaignFormData>()

  return (
    <div className="space-y-4">
      {/* 헤드라인 */}
      <div className="space-y-2">
        <Label htmlFor="creative-headline">헤드라인</Label>
        <Input
          id="creative-headline"
          placeholder="예: 봄맞이 특별 할인 최대 50%"
          maxLength={255}
          {...register('creative.headline', {
            required: '헤드라인을 입력해주세요',
          })}
        />
        {errors.creative?.headline && (
          <p className="text-sm text-red-500">{errors.creative.headline.message}</p>
        )}
      </div>

      {/* 본문 */}
      <div className="space-y-2">
        <Label htmlFor="creative-primaryText">광고 본문</Label>
        <Textarea
          id="creative-primaryText"
          placeholder="광고에 표시될 메인 텍스트를 입력하세요"
          rows={3}
          maxLength={2000}
          {...register('creative.primaryText', {
            required: '광고 본문을 입력해주세요',
          })}
        />
        <div className="flex justify-between">
          {errors.creative?.primaryText && (
            <p className="text-sm text-red-500">{errors.creative.primaryText.message}</p>
          )}
          <p className="ml-auto text-xs text-muted-foreground">
            {(watch('creative.primaryText') || '').length}/2000
          </p>
        </div>
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <Label htmlFor="creative-description">설명 (선택)</Label>
        <Input
          id="creative-description"
          placeholder="추가 설명을 입력하세요"
          maxLength={500}
          {...register('creative.description')}
        />
      </div>

      {/* CTA 버튼 */}
      <div className="space-y-2">
        <Label>CTA 버튼</Label>
        <Select
          value={watch('creative.callToAction')}
          onValueChange={(value) => setValue('creative.callToAction', value as ExtendedCampaignFormData['creative']['callToAction'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="CTA 버튼을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {ctaOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 링크 URL */}
      <div className="space-y-2">
        <Label htmlFor="creative-linkUrl">랜딩 페이지 URL</Label>
        <Input
          id="creative-linkUrl"
          type="url"
          placeholder="https://example.com/landing"
          {...register('creative.linkUrl')}
        />
      </div>
    </div>
  )
}
