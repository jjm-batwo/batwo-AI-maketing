'use client'

import { useSearchParams } from 'next/navigation'
import { CaptionOverlay } from './CaptionOverlay'

export function DemoModeProvider() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'

  if (!isDemo) {
    return null
  }

  return <CaptionOverlay />
}
