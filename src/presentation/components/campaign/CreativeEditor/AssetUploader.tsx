'use client'

import { useCallback, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Upload, X, ImageIcon, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ExtendedCampaignFormData, UploadedAsset } from '../CampaignCreateForm/types'

interface AssetUploaderProps {
  onUpload: (file: File) => Promise<UploadedAsset>
  isUploading?: boolean
}

export function AssetUploader({ onUpload, isUploading = false }: AssetUploaderProps) {
  const { watch, setValue } = useFormContext<ExtendedCampaignFormData>()
  const assetIds = watch('creative.assetIds') || []
  const [assets, setAssets] = useState<UploadedAsset[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setUploadError(null)
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      // 파일 타입 검증
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setUploadError('이미지 또는 동영상 파일만 업로드할 수 있습니다')
        continue
      }
      // 파일 크기 검증 (30MB)
      if (file.size > 30 * 1024 * 1024) {
        setUploadError('파일 크기는 30MB 이하여야 합니다')
        continue
      }

      try {
        const uploaded = await onUpload(file)
        setAssets(prev => [...prev, uploaded])
        setValue('creative.assetIds', [...assetIds, uploaded.id])
      } catch {
        setUploadError('파일 업로드에 실패했습니다')
      }
    }
  }, [onUpload, assetIds, setValue])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }, [handleFiles])

  const removeAsset = useCallback((assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId))
    setValue('creative.assetIds', assetIds.filter(id => id !== assetId))
  }, [assetIds, setValue])

  return (
    <div className="space-y-4">
      {/* 드롭존 */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
          isUploading && 'opacity-50 pointer-events-none'
        )}
      >
        <Upload className="mb-3 h-10 w-10 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">
          이미지 또는 동영상을 드래그하거나
        </p>
        <label className="mt-2 cursor-pointer">
          <span className="text-sm font-medium text-primary hover:underline">
            파일 선택
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*"
            multiple
            onChange={handleFileInput}
            disabled={isUploading}
          />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          JPG, PNG, MP4 (최대 30MB)
        </p>
      </div>

      {/* 업로드 중 표시 */}
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          업로드 중...
        </div>
      )}

      {/* 에러 메시지 */}
      {uploadError && (
        <p className="text-sm text-red-500">{uploadError}</p>
      )}

      {/* 업로드된 에셋 미리보기 */}
      {assets.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {assets.map((asset) => (
            <div key={asset.id} className="group relative rounded-lg border overflow-hidden">
              {asset.type === 'IMAGE' ? (
                <div className="flex aspect-square items-center justify-center bg-gray-100">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              ) : (
                <div className="flex aspect-square items-center justify-center bg-gray-100">
                  <Film className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="p-2">
                <p className="truncate text-xs text-muted-foreground">{asset.fileName}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 opacity-0 group-hover:opacity-100 bg-white/80 hover:bg-white"
                onClick={() => removeAsset(asset.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
