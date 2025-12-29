/**
 * 404 Not Found Page
 *
 * 존재하지 않는 페이지에 대한 커스텀 404 페이지
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="container flex max-w-md flex-col items-center text-center">
        {/* 404 아이콘 및 숫자 */}
        <div className="relative mb-8">
          <div className="text-[150px] font-bold leading-none text-muted-foreground/10 sm:text-[200px]">
            404
          </div>
          <Search className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/50" />
        </div>

        {/* 제목 */}
        <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
          페이지를 찾을 수 없습니다
        </h1>

        {/* 설명 */}
        <p className="mb-8 text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
          <br />
          URL을 확인하시거나 홈으로 돌아가주세요.
        </p>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
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
