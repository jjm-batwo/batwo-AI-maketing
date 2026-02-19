'use client'

import { memo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIntersectionObserver } from '@/presentation/hooks'
import { FEATURES } from './featuresData'

interface FeaturesSectionProps {
  id?: string
}

export const FeaturesSection = memo(function FeaturesSection({ id = 'features' }: FeaturesSectionProps) {
  const { ref, isIntersecting } = useIntersectionObserver()

  return (
    <section id={id} className="py-20 md:py-32 overflow-hidden">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-1000 ${
          isIntersecting ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
        }`}
      >
        <header className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">왜 바투인가요?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            복잡한 광고 운영을 AI가 대신합니다. 당신은 비즈니스에만 집중하세요.
          </p>
        </header>

        <Tabs defaultValue={FEATURES[0].title} className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* 탭 리스트 — 데스크톱: 세로, 모바일: 가로 스크롤 */}
            <TabsList className="flex lg:flex-col h-auto bg-transparent gap-2 overflow-x-auto lg:overflow-visible p-0">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <TabsTrigger
                    key={feature.title}
                    value={feature.title}
                    className="flex items-center gap-3 px-4 py-3 justify-start text-left whitespace-nowrap lg:whitespace-normal lg:w-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30 border border-transparent rounded-lg transition-colors hover:bg-muted/50"
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{feature.title}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* 탭 콘텐츠 */}
            <div className="min-h-[300px]">
              {FEATURES.map((feature) => (
                <TabsContent key={feature.title} value={feature.title} className="mt-0">
                  <div className="bg-card border border-border/50 rounded-xl p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-base leading-relaxed mb-6">
                      {feature.description}
                    </p>
                    {/* 기능별 미리보기 영역 */}
                    <div className="bg-muted/30 rounded-lg p-6 border border-border/30">
                      <FeaturePreview title={feature.title} />
                    </div>
                  </div>
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      </div>
    </section>
  )
})

// 기능별 미니 프리뷰 (ProductShowcaseSection 데이터 통합)
const PREVIEW_DATA: Record<string, { stats: { label: string; value: string }[]; highlight: string }> = {
  'AI 마케팅 어시스턴트': {
    stats: [
      { label: 'ROAS', value: '4.52x' },
      { label: '전환수', value: '123건' },
    ],
    highlight: '"이번 주 캠페인 성과 어때?" → AI가 즉시 분석 결과 제공',
  },
  'AI 캠페인 자동 세팅': {
    stats: [
      { label: '설정 시간', value: '1분' },
      { label: '최적화율', value: '95%' },
    ],
    highlight: '비즈니스 정보 입력 → AI가 최적의 타겟/예산/소재 자동 설정',
  },
  '실시간 KPI 대시보드': {
    stats: [
      { label: '광고비', value: '₩1.25M' },
      { label: 'ROAS', value: '3.5x' },
    ],
    highlight: '핵심 지표를 한눈에 확인하고 실시간 성과 추적',
  },
  'AI 주간 보고서': {
    stats: [
      { label: '성과 변화', value: '+23%' },
      { label: '최적화 제안', value: '3건' },
    ],
    highlight: '매주 자동 생성되는 인사이트 보고서로 빠른 의사결정',
  },
  'Meta 공식 연동': {
    stats: [
      { label: 'API 버전', value: 'v25.0' },
      { label: '보안', value: 'AES-256' },
    ],
    highlight: 'Meta Business API 공식 연동으로 안전한 광고 관리',
  },
  '원클릭 픽셀 설치': {
    stats: [
      { label: '설치 시간', value: '30초' },
      { label: '전환 추적', value: '자동' },
    ],
    highlight: '버튼 하나로 Meta 픽셀 설치 완료',
  },
}

function FeaturePreview({ title }: { title: string }) {
  const preview = PREVIEW_DATA[title]
  if (!preview) return null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {preview.stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-2xl font-bold text-primary">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground text-center italic">
        {preview.highlight}
      </p>
    </div>
  )
}
