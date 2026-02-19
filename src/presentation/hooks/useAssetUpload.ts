'use client'

import { useMutation } from '@tanstack/react-query'

interface UploadAssetInput {
  file: File
  type?: 'IMAGE' | 'VIDEO'
  width?: number
  height?: number
  duration?: number
}

interface UploadedAsset {
  id: string
  fileName: string
  blobUrl: string
  type: 'IMAGE' | 'VIDEO'
  fileSize: number
  mimeType: string
  width?: number
  height?: number
}

async function uploadAsset(input: UploadAssetInput): Promise<UploadedAsset> {
  const formData = new FormData()
  formData.append('file', input.file)
  if (input.type) formData.append('type', input.type)
  if (input.width) formData.append('width', String(input.width))
  if (input.height) formData.append('height', String(input.height))
  if (input.duration) formData.append('duration', String(input.duration))

  const response = await fetch('/api/assets/upload', {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '파일 업로드에 실패했습니다')
  }
  return response.json()
}

export function useUploadAsset() {
  return useMutation({
    mutationFn: uploadAsset,
  })
}
