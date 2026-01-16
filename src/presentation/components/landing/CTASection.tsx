import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto rounded-2xl bg-primary p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            지금 바로 AI 마케팅을 시작하세요
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            마케팅 전문가가 아니어도 괜찮습니다.
            <br />
            바투가 당신의 광고를 성공으로 이끕니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="gap-2 min-h-[44px] transition-transform hover:scale-105"
              asChild
            >
              <Link href="/register" aria-label="14일 무료 체험 시작하기">
                14일 무료 체험 시작하기
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="min-h-[44px] transition-transform hover:scale-105"
              asChild
            >
              <Link href="/login" aria-label="로그인">로그인</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <ul
            className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-primary-foreground/70 list-none"
            data-testid="cta-trust-indicators"
            role="list"
            aria-label="Benefits"
          >
            <li>신용카드 불필요</li>
            <li className="hidden sm:inline" aria-hidden="true">•</li>
            <li>5분 설정</li>
            <li className="hidden sm:inline" aria-hidden="true">•</li>
            <li>언제든 취소</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
