import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-primary">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 tracking-tight">
          지금 바로 AI 마케팅을 시작하세요
        </h2>
        <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
          마케팅 전문가가 아니어도 괜찮습니다.
          <br />
          바투가 당신의 광고를 성공으로 이끕니다.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="gap-2 min-h-[44px]"
          asChild
        >
          <Link href="/register" aria-label="14일 무료 체험 시작하기">
            14일 무료 체험 시작하기
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>

        {/* Trust Indicators */}
        <ul
          className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-primary-foreground/70 list-none"
          data-testid="cta-trust-indicators"
          role="list"
          aria-label="Benefits"
        >
          <li>신용카드 불필요</li>
          <li className="hidden sm:inline" aria-hidden="true">&bull;</li>
          <li>5분 설정</li>
          <li className="hidden sm:inline" aria-hidden="true">&bull;</li>
          <li>언제든 취소</li>
        </ul>
      </div>
    </section>
  )
}
