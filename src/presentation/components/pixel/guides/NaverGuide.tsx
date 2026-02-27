'use client'

import { useState, useCallback, useEffect } from 'react'
import { Copy, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NaverGuideProps {
  pixelId: string
  pixelCode?: string
}

type CopyStatus = 'idle' | 'success' | 'error'

const STEPS = [
  {
    number: 1,
    text: '네이버 스마트스토어 관리자에 로그인하세요',
  },
  {
    number: 2,
    text: '쇼핑몰 관리 → 디자인 → 외부 스크립트 관리로 이동하세요',
  },
  {
    number: 3,
    text: "아래 코드를 '공통 스크립트' 영역에 붙여넣으세요",
    hasCodeBlock: true,
  },
  {
    number: 4,
    text: '저장을 클릭하세요',
  },
  {
    number: 5,
    text: '설치가 완료되었습니다! 이벤트 수신까지 최대 24시간이 소요될 수 있습니다.',
    isCompletion: true,
  },
]

export function NaverGuide({ pixelId, pixelCode }: NaverGuideProps) {
  const [snippet, setSnippet] = useState<string | null>(null)
  const [isLoadingSnippet, setIsLoadingSnippet] = useState(true)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetch(`/api/pixel/${pixelId}/snippet`)
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) {
          setSnippet(text)
          setIsLoadingSnippet(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoadingSnippet(false)
        }
      })

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

  const inlineSnippet = pixelCode
    ? `<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelCode}');
fbq('track','PageView');
</script>
<noscript><img height="1" width="1" alt="" style="display:none"
src="https://www.facebook.com/tr?id=${pixelCode}&ev=PageView&noscript=1"/></noscript>`
    : null

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h3 className="text-lg font-semibold">
          네이버 스마트스토어 픽셀 설치 가이드
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          아래 단계를 따라 Meta 픽셀을 스마트스토어에 설치하세요.
        </p>
      </div>

      {/* 5단계 가이드 */}
      <ol
        className="space-y-4"
        aria-label="설치 단계"
      >
        {STEPS.map((step) => (
          <li key={step.number} className="flex gap-3">
            {/* 단계 번호 배지 */}
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                step.isCompletion
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  : 'bg-primary/10 text-primary'
              )}
              aria-hidden="true"
            >
              {step.number}
            </span>

            <div className="flex-1 space-y-2 pt-0.5">
              <p
                className={cn(
                  'text-sm',
                  step.isCompletion
                    ? 'font-medium text-green-700 dark:text-green-400'
                    : 'text-foreground'
                )}
              >
                {step.text}
              </p>

              {/* 3단계 코드 블록 */}
              {step.hasCodeBlock && (
                <div className="relative">
                  <div
                    className={cn(
                      'rounded-lg border bg-muted p-4 font-mono text-xs',
                      copyStatus === 'success' && 'border-green-500',
                      copyStatus === 'error' && 'border-red-500'
                    )}
                  >
                    {isLoadingSnippet ? (
                      <span
                        data-testid="naver-snippet-loading"
                        className="text-muted-foreground"
                      >
                        코드를 불러오는 중...
                      </span>
                    ) : (
                      <code
                        data-testid="naver-snippet-code"
                        aria-label="네이버 스마트스토어 설치 스크립트"
                        className="block whitespace-pre-wrap break-all"
                      >
                        {snippet ?? '코드를 불러올 수 없습니다.'}
                      </code>
                    )}
                  </div>

                  {!isLoadingSnippet && snippet && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      aria-label="스크립트 복사"
                      className={cn(
                        'absolute right-2 top-2',
                        copyStatus === 'success' &&
                          'border-green-500 text-green-600',
                        copyStatus === 'error' && 'border-red-500 text-red-600'
                      )}
                    >
                      {copyStatus === 'success' ? (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          복사됨
                        </>
                      ) : copyStatus === 'error' ? (
                        <>
                          <AlertCircle className="mr-1 h-4 w-4" />
                          복사 실패
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-4 w-4" />
                          복사
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      {/* 트러블슈팅 섹션 */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10">
        <button
          type="button"
          onClick={() => setIsTroubleshootingOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-amber-800 dark:text-amber-400"
          aria-expanded={isTroubleshootingOpen}
        >
          <span>동작하지 않을 경우 — 대안 설치 방법</span>
          {isTroubleshootingOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {isTroubleshootingOpen && (
          <div className="space-y-3 border-t border-amber-200 px-4 pb-4 pt-3 dark:border-amber-800/50">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              외부 도메인이 차단될 수 있습니다. 이 경우 아래의 인라인 스크립트를 대신 사용하세요.
            </p>

            {inlineSnippet ? (
              <div className="rounded-md border bg-muted p-3">
                <pre
                  data-testid="naver-inline-snippet"
                  className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs"
                >
                  {inlineSnippet}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                인라인 스크립트를 생성하려면 Meta 픽셀 코드(pixelCode)가 필요합니다.
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              인라인 방식은 외부 스크립트 없이 fbq 추적 코드를 직접 삽입합니다.
              스크립트 차단 환경에서도 안정적으로 동작합니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
