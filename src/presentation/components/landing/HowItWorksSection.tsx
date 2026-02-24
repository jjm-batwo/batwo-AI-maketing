'use client'

import { useIntersectionObserver } from '@/presentation/hooks'
import { SectionLabel } from './SectionLabel'

const steps = [
  {
    step: 1,
    title: '비즈니스 정보 입력',
    description:
      '업종, 상품, 타겟 고객 등 간단한 정보를 입력하세요. 복잡한 광고 지식 없이 몇 가지 질문에만 답하면 됩니다.',
    preview: <StepOnePreview />,
  },
  {
    step: 2,
    title: 'AI가 캠페인 자동 생성',
    description:
      '입력된 정보를 바탕으로 AI가 최적의 광고 캠페인을 구성합니다. 타겟팅, 예산, 소재까지 자동으로 설정됩니다.',
    preview: <StepTwoPreview />,
  },
  {
    step: 3,
    title: '성과 확인 및 최적화',
    description:
      '대시보드에서 실시간 성과를 확인하고 AI 인사이트를 받아보세요. 매주 자동 보고서로 빠른 의사결정을 지원합니다.',
    preview: <StepThreePreview />,
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
        className={`container mx-auto px-4 transition-all duration-1000 ${
          isIntersecting ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Section Header */}
        <div className="text-center mb-16">
          <SectionLabel className="text-center">작동 방식</SectionLabel>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            3단계로 시작하세요
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            복잡한 설정 없이 빠르게 광고를 시작할 수 있습니다.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto space-y-20">
          {steps.map((step, index) => {
            const isEven = index % 2 === 1
            return (
              <div
                key={step.step}
                className={`flex flex-col md:flex-row items-center gap-10 md:gap-16 ${
                  isEven ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  {/* Step number */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                      {step.step}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden md:block flex-1 h-px bg-border" aria-hidden="true" />
                    )}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Preview */}
                <div className="flex-1 w-full min-w-0">
                  {step.preview}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ─── Step Preview Mockups ─────────────────────────────────────── */

function PreviewShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-white">
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" aria-hidden="true" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" aria-hidden="true" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" aria-hidden="true" />
        </div>
        <div className="flex-1 mx-3">
          <div className="bg-white border border-gray-200 rounded h-5 max-w-xs mx-auto" />
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StepOnePreview() {
  return (
    <PreviewShell>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-4 font-semibold">
        비즈니스 정보
      </p>
      <div className="space-y-3">
        {[
          { label: '업종', placeholder: '예) 패션 쇼핑몰' },
          { label: '주력 상품', placeholder: '예) 여성 캐주얼 의류' },
          { label: '타겟 고객', placeholder: '예) 20-35세 여성' },
        ].map((field) => (
          <div key={field.label}>
            <label className="text-xs text-gray-600 font-medium mb-1 block">
              {field.label}
            </label>
            <div className="h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center px-3">
              <span className="text-sm text-gray-400">{field.placeholder}</span>
            </div>
          </div>
        ))}
        <button className="w-full h-10 mt-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          AI 캠페인 생성하기 →
        </button>
      </div>
    </PreviewShell>
  )
}

function StepTwoPreview() {
  return (
    <PreviewShell>
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">AI 생성 중</p>
          <span className="text-xs text-primary font-semibold">85%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full w-[85%] transition-all" />
        </div>
        {[
          { label: '타겟 분석', done: true },
          { label: '예산 최적화', done: true },
          { label: '광고 소재 생성', done: true },
          { label: '캠페인 설정 완료', done: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 py-1.5">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                item.done ? 'bg-green-100' : 'bg-gray-100'
              }`}
            >
              {item.done ? (
                <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <span className={`text-sm ${item.done ? 'text-gray-700' : 'text-primary font-medium'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </PreviewShell>
  )
}

function StepThreePreview() {
  return (
    <PreviewShell>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'ROAS', value: '4.52x', up: true },
          { label: '전환수', value: '247건', up: true },
          { label: '광고비', value: '₩1.25M', up: false },
          { label: 'CTR', value: '3.8%', up: true },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
            <p className={`text-xs font-medium ${kpi.up ? 'text-green-600' : 'text-blue-600'}`}>
              {kpi.up ? '↑' : '↓'} 전주 대비 개선
            </p>
          </div>
        ))}
      </div>
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
        <p className="text-xs font-bold text-primary mb-1">AI 인사이트</p>
        <p className="text-xs text-gray-600 leading-relaxed">
          30-40대 여성 타겟에서 ROAS가 23% 높습니다. 예산을 더 배분하면 효율을 높일 수 있습니다.
        </p>
      </div>
    </PreviewShell>
  )
}
