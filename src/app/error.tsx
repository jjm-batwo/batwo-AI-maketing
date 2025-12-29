'use client'

/**
 * Error Boundary Page
 *
 * 런타임 에러 발생 시 표시되는 에러 페이지
 */

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // 에러 로깅 (추후 Sentry 등 연동 가능)
    console.error('Application error:', error)
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
