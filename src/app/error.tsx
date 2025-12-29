'use client'

/**
 * Error Boundary Page
 *
 * 런타임 에러 발생 시 표시되는 에러 페이지
 * Sentry와 통합되어 에러를 자동으로 추적합니다.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw, MessageCircle } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [eventId, setEventId] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    // Sentry에 에러 리포팅
    const id = Sentry.captureException(error, {
      extra: {
        digest: error.digest,
        componentStack: error.stack,
      },
      tags: {
        error_boundary: 'app',
      },
    })
    setEventId(id)

    // 개발 모드에서는 콘솔에도 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error)
    }
  }, [error])

  const isDev = process.env.NODE_ENV !== 'production'

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="container flex max-w-md flex-col items-center text-center">
        {/* 에러 아이콘 */}
        <div className="mb-8 rounded-full bg-destructive/10 p-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>

        {/* 제목 */}
        <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
          문제가 발생했습니다
        </h1>

        {/* 설명 */}
        <p className="mb-6 text-muted-foreground">
          예상치 못한 오류가 발생했습니다.
          <br />
          잠시 후 다시 시도해주세요.
        </p>

        {/* 개발 모드에서만 에러 상세 표시 */}
        {isDev && error.message && (
          <div className="mb-6 w-full rounded-lg bg-muted p-4 text-left">
            <p className="mb-2 text-sm font-medium text-destructive">
              에러 상세 (개발 모드):
            </p>
            <code className="block overflow-auto text-xs text-muted-foreground">
              {error.message}
            </code>
            {error.digest && (
              <p className="mt-2 text-xs text-muted-foreground">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} size="lg" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            다시 시도
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>

        {/* 에러 피드백 버튼 */}
        {eventId && !isDev && (
          <div className="mt-6">
            <Button
              onClick={() => setShowFeedback(true)}
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              문제 신고하기
            </Button>
          </div>
        )}

        {/* Sentry 피드백 다이얼로그 */}
        {showFeedback && eventId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold">문제 신고</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const form = e.target as HTMLFormElement
                  const formData = new FormData(form)

                  Sentry.captureFeedback({
                    associatedEventId: eventId,
                    name: (formData.get('name') as string) || 'Anonymous',
                    email: (formData.get('email') as string) || 'anonymous@example.com',
                    message: formData.get('comments') as string,
                  })

                  setShowFeedback(false)
                }}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    이름 (선택)
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    이메일 (선택)
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    무엇이 잘못되었나요?
                  </label>
                  <textarea
                    name="comments"
                    required
                    rows={4}
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="에러가 발생하기 전에 무엇을 하고 있었는지 설명해주세요..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowFeedback(false)}
                  >
                    취소
                  </Button>
                  <Button type="submit">전송</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 에러 ID (지원팀 문의용) */}
        {eventId && (
          <p className="mt-4 text-xs text-muted-foreground">
            에러 ID: <code className="rounded bg-muted px-1">{eventId}</code>
          </p>
        )}

        {/* 추가 도움말 */}
        <p className="mt-8 text-sm text-muted-foreground">
          문제가 계속되면{' '}
          <a
            href="mailto:support@batwo.ai"
            className="text-primary underline-offset-4 hover:underline"
          >
            고객 지원
          </a>
          에 문의해주세요.
        </p>
      </div>
    </main>
  )
}
