import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SectionHeader } from '@/presentation/components/common'

export function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-primary/5">
      <div className="container mx-auto px-4 text-center">
        <SectionHeader
          label="지금 시작하세요"
          title="지금 바로 AI 마케팅을 시작하세요"
          description="마케팅 전문가가 아니어도 괜찮습니다. 바투가 당신의 광고를 성공으로 이끕니다."
          noMargin
          className="mb-10"
        />
        <Button
          size="lg"
          className="gap-2 h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          asChild
        >
          <Link href="/login" aria-label="14일 무료 체험 시작하기">
            14일 무료 체험 시작하기
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>

        {/* Trust Indicators */}
        <ul
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground list-none"
          role="list"
          aria-label="주요 혜택"
        >
          <li>신용카드 불필요</li>
          <li className="hidden sm:inline" aria-hidden="true">
            &bull;
          </li>
          <li>5분 설정</li>
          <li className="hidden sm:inline" aria-hidden="true">
            &bull;
          </li>
          <li>언제든 취소</li>
        </ul>
      </div>
    </section>
  )
}
