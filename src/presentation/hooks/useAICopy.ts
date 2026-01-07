'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface AdCopyVariant {
  headline: string
  primaryText: string
  description: string
  callToAction: string
  targetAudience: string
}

export interface GenerateCopyInput {
  productName: string
  productDescription: string
  targetAudience: string
  tone: 'professional' | 'casual' | 'playful' | 'urgent'
  objective: 'awareness' | 'consideration' | 'conversion'
  keywords?: string[]
  variantCount?: number
}

export interface GenerateCopyResponse {
  variants: AdCopyVariant[]
  remainingQuota: number
}

async function generateAdCopy(input: GenerateCopyInput): Promise<GenerateCopyResponse> {
  const response = await fetch('/api/ai/copy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'AI 카피 생성에 실패했습니다')
  }

  return response.json()
}

export function useAICopy() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: generateAdCopy,
    onSuccess: () => {
      // Invalidate quota query to refresh remaining quota
      queryClient.invalidateQueries({ queryKey: ['quota'] })
    },
  })

  return {
    generateCopy: mutation.mutate,
    generateCopyAsync: mutation.mutateAsync,
    variants: mutation.data?.variants ?? [],
    remainingQuota: mutation.data?.remainingQuota,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  }
}
