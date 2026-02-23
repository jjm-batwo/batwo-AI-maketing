'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CustomSiteGuideProps {
  pixelId: string
}

type CopyStatus = 'idle' | 'success' | 'error'
type FetchStatus = 'loading' | 'success' | 'error'

const CAPI_HELPER_EXAMPLE = `// 구매 완료 이벤트
batwoPixel.trackPurchase({
  value: 29900,
  currency: 'KRW',
  orderId: 'ORDER-001',
})

// 장바구니 담기 이벤트
batwoPixel.trackAddToCart({
  productId: 'PROD-123',
  value: 15000,
  currency: 'KRW',
})`

const STEPS = [
  {
    number: 1,
    title: '코드 복사',
    description: '아래 스크립트 코드를 복사합니다.',
  },
  {
    number: 2,
    title: '<head> 태그에 붙여넣기',
    description: '웹사이트 HTML의 <head> 태그 안에 코드를 붙여넣습니다.',
  },
  {
    number: 3,
    title: '저장 후 새로고침',
    description: '파일을 저장하고 웹사이트를 새로고침하면 픽셀이 활성화됩니다.',
  },
]

export function CustomSiteGuide({ pixelId }: CustomSiteGuideProps) {
  const [snippet, setSnippet] = useState<string>('')
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>('loading')
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  // 스니펫 fetch
  useEffect(() => {
    let cancelled = false

    async function loadSnippet() {
      setFetchStatus('loading')
      try {
        const res = await fetch(`/api/pixel/${pixelId}/snippet`)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const text = await res.text()
        if (!cancelled) {
          setSnippet(text)
          setFetchStatus('success')
        }
      } catch {
        if (!cancelled) {
          setFetchStatus('error')
        }
      }
    }

    loadSnippet()
    return () => {
      cancelled = true
    }
  }, [pixelId])

  const handleCopy = useCallback(async () => {
    if (!snippet) return
    try {
      await navigator.clipboard.writeText(snippet)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 3000)
    } catch {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 3000)
    }
  }, [snippet])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">자체몰 픽셀 설치 가이드</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          아래 단계를 따라 웹사이트에 Meta 픽셀을 설치하세요.
        </p>
      </div>

      {/* 단계별 안내 */}
      <ol className="space-y-3" aria-label="설치 단계">
        {STEPS.map((step) => (
          <li key={step.number} className="flex items-start gap-3">
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                'bg-primary text-xs font-bold text-primary-foreground'
              )}
              aria-hidden="true"
            >
              {step.number}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* 스크립트 코드 블록 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">설치 스크립트</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={fetchStatus !== 'success'}
            aria-label="스크립트 복사"
            className={cn(
              'gap-1.5 transition-colors',
              copyStatus === 'success' && 'border-green-500 text-green-600 dark:text-green-400',
              copyStatus === 'error' && 'border-red-500 text-red-600 dark:text-red-400'
            )}
          >
            {copyStatus === 'success' ? (
              <>
                <Check className="h-3.5 w-3.5" />
                복사되었습니다
              </>
            ) : copyStatus === 'error' ? (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                복사 실패
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                스크립트 복사
              </>
            )}
          </Button>
        </div>

        {fetchStatus === 'loading' && (
          <div className="flex items-center justify-center gap-2 rounded-lg border bg-muted py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">불러오는 중...</span>
          </div>
        )}

        {fetchStatus === 'error' && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/20">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">
              스크립트를 불러오는데 실패했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          </div>
        )}

        {fetchStatus === 'success' && (
          <pre
            className={cn(
              'overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-sm leading-relaxed',
              copyStatus === 'success' && 'border-green-500 dark:border-green-700',
              copyStatus === 'error' && 'border-red-500 dark:border-red-700'
            )}
          >
            <code
              data-testid="snippet-code"
              aria-label="픽셀 설치 스크립트 코드"
            >
              {snippet}
            </code>
          </pre>
        )}
      </div>

      {/* CAPI 이벤트 헬퍼 예제 */}
      <div className="rounded-lg border bg-muted/50 p-4 dark:bg-muted/20">
        <h4 className="mb-2 text-sm font-semibold text-foreground">전환 이벤트 헬퍼 예제</h4>
        <p className="mb-3 text-xs text-muted-foreground">
          스크립트 설치 후 아래 코드로 구매·장바구니 등 전환 이벤트를 전송할 수 있습니다.
        </p>
        <pre className="overflow-x-auto rounded-md border bg-background p-3 font-mono text-xs leading-relaxed">
          <code aria-label="CAPI 이벤트 헬퍼 예제 코드">{CAPI_HELPER_EXAMPLE}</code>
        </pre>
      </div>

      {/* 참고사항 */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
        <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">참고사항</h4>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
          <li>· 스크립트는 비동기로 로드되어 페이지 성능에 영향을 주지 않습니다.</li>
          <li>· 설치 후 약 5~10분 뒤에 이벤트 수신이 시작됩니다.</li>
          <li>· 모든 페이지의 {'<head>'} 태그에 스크립트를 추가해 주세요.</li>
        </ul>
      </div>
    </div>
  )
}
