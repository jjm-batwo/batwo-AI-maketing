'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

interface CreateCreativeInput {
  name: string
  format: string
  primaryText?: string
  headline?: string
  description?: string
  callToAction?: string
  linkUrl?: string
  assets?: { assetId: string; order: number }[]
}

interface CreativeResponse {
  id: string
  name: string
  format: string
  primaryText?: string
  headline?: string
}

async function createCreative(input: CreateCreativeInput): Promise<CreativeResponse> {
  const response = await fetch('/api/creatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '크리에이티브 생성에 실패했습니다')
  }
  return response.json()
}

export function useCreateCreative() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCreative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creatives'] })
    },
  })
}
