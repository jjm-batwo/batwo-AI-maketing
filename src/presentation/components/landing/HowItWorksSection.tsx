'use client'

import { ClipboardList, Cpu, TrendingUp } from 'lucide-react'
import { useIntersectionObserver } from '@/presentation/hooks'

const steps = [
  {
    step: 1,
    icon: ClipboardList,
    title: '비즈니스 정보 입력',
    description: '업종, 상품, 타겟 고객 등 간단한 정보를 입력하세요.',
  },
  {
    step: 2,
    icon: Cpu,
    title: 'AI가 캠페인 자동 생성',
    description: '입력된 정보를 바탕으로 AI가 최적의 광고 설정을 구성합니다.',
  },
  {
    step: 3,
    icon: TrendingUp,
    title: '성과 확인 및 최적화',
    description: '대시보드에서 실시간 성과를 확인하고 AI 인사이트를 받아보세요.',
  },
]

interface HowItWorksSectionProps {
  id?: string
}

export function HowItWorksSection({ id = 'how-it-works' }: HowItWorksSectionProps) {
  const { ref, isIntersecting } = useIntersectionObserver()

  return (
    <section id={id} className="py-20 md:py-32 overflow-hidden">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-1000 ${isIntersecting ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
          }`}
      >
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            3단계로 시작하세요
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            복잡한 설정 없이 빠르게 광고를 시작할 수 있습니다.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.step} className="group relative text-center cursor-default">
                {/* Connector Line (hidden on mobile, shown on desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}

                {/* Step Number */}
                <div className="relative z-10 w-16 h-16 mx-auto rounded-full bg-slate-50 border border-gray-100 text-slate-700 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-white group-hover:shadow-md group-hover:border-gray-200 group-hover:text-primary">
                  <step.icon className="h-7 w-7" />
                </div>

                {/* Step Badge */}
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-slate-600 text-xs font-bold mb-3 transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary">
                  {step.step}
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2 text-slate-900 transition-colors duration-300 group-hover:text-primary">{step.title}</h3>
                <p className="text-sm text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
