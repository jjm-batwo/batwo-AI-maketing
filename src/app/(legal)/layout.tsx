/**
 * Legal Pages Layout
 *
 * 법적 페이지 (이용약관, 개인정보처리방침)를 위한 공통 레이아웃
 */

import Link from 'next/link'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* 간단한 헤더 */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>바투</span>
            <span className="sr-only">홈으로</span>
          </Link>
        </div>
      </header>

      {/* 컨텐츠 영역 */}
      <main className="container py-8 md:py-12">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>

      {/* 간단한 푸터 */}
      <footer className="border-t bg-muted/50">
        <div className="container py-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} 바투. All rights reserved.
            </p>
            <nav className="flex gap-4">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                이용약관
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                개인정보처리방침
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
