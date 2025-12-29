'use client'

/**
 * Global Error Page
 *
 * 루트 레이아웃 레벨의 에러를 처리하는 전역 에러 페이지
 * html과 body 태그를 포함해야 함
 */

import { useEffect } from 'react'

interface GlobalErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    // 전역 에러 로깅
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="ko">
      <body className="bg-slate-50">
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="flex max-w-md flex-col items-center text-center">
            {/* 에러 아이콘 */}
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* 제목 */}
            <h1 className="mb-4 text-2xl font-bold text-slate-900">
              심각한 오류가 발생했습니다
            </h1>

            {/* 설명 */}
            <p className="mb-8 text-slate-600">
              애플리케이션에 예상치 못한 문제가 발생했습니다.
              <br />
              페이지를 새로고침하거나 다시 시도해주세요.
            </p>

            {/* 액션 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                다시 시도
              </button>
            </div>

            {/* 에러 다이제스트 (디버깅용) */}
            {error.digest && (
              <p className="mt-6 text-xs text-slate-400">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  )
}
