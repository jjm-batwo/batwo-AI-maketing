import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-slate-900">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
          지금 바로 AI 마케팅을 시작하세요
        </h2>
        <p className="text-slate-300 md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          마케팅 전문가가 아니어도 괜찮습니다. 바투가 당신의 광고를 성공으로 이끕니다.
        </p>
        <Button
          size="lg"
          className="gap-2 min-h-[44px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg px-8"
          asChild
        >
          <Link href="/register" aria-label="14일 무료 체험 시작하기">
            14일 무료 체험 시작하기
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>

        {/* Trust Indicators */}
        <ul
          className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-400 list-none"
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
