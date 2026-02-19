'use client'

import { useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ImageIcon, Film, LayoutGrid } from 'lucide-react'
import { AssetUploader } from '../CreativeEditor/AssetUploader'
import { AdCopyForm } from '../CreativeEditor/AdCopyForm'
import { AdPreview } from '../CreativeEditor/AdPreview'
import type { ExtendedCampaignFormData, UploadedAsset } from './types'

const formatOptions = [
  { value: 'SINGLE_IMAGE', label: '단일 이미지', icon: ImageIcon, description: '하나의 이미지로 광고' },
  { value: 'SINGLE_VIDEO', label: '단일 동영상', icon: Film, description: '동영상으로 광고' },
  { value: 'CAROUSEL', label: '캐러셀', icon: LayoutGrid, description: '여러 이미지/동영상 슬라이드' },
] as const

interface StepCreativeProps {
  onUploadAsset?: (file: File) => Promise<UploadedAsset>
  isUploading?: boolean
}

export function StepCreative({ onUploadAsset, isUploading }: StepCreativeProps) {
  const { watch, setValue } = useFormContext<ExtendedCampaignFormData>()
  const selectedFormat = watch('creative.format')

  const handleUpload = useCallback(async (file: File): Promise<UploadedAsset> => {
    if (onUploadAsset) {
      return onUploadAsset(file)
    }
    // 폴백: 로컬 미리보기용 더미 에셋
    return {
      id: crypto.randomUUID(),
      fileName: file.name,
      blobUrl: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    }
  }, [onUploadAsset])

  return (
    <div className="space-y-6">
      {/* 포맷 선택 */}
      <div className="space-y-2">
        <Label>광고 포맷</Label>
        <div className="grid grid-cols-3 gap-3">
          {formatOptions.map((format) => {
            const Icon = format.icon
            const isSelected = selectedFormat === format.value
            return (
              <button
                key={format.value}
                type="button"
                onClick={() => setValue('creative.format', format.value as ExtendedCampaignFormData['creative']['format'])}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <Icon className={cn('h-6 w-6', isSelected ? 'text-primary' : 'text-gray-400')} />
                <span className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-gray-700')}>{format.label}</span>
                <span className="text-xs text-muted-foreground">{format.description}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 좌측: 에셋 + 카피 */}
        <div className="space-y-6">
          {/* 에셋 업로드 */}
          <div className="space-y-2">
            <Label>광고 소재</Label>
            <AssetUploader onUpload={handleUpload} isUploading={isUploading} />
          </div>

          {/* 카피 입력 */}
          <AdCopyForm />
        </div>

        {/* 우측: 미리보기 */}
        <div className="lg:sticky lg:top-4">
          <AdPreview />
        </div>
      </div>
    </div>
  )
}
