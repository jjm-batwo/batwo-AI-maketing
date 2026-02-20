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
        className={`container mx-auto px-4 transition-all duration-1000 ${isIntersecting ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
          }`}
      >
        <header className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">왜 바투인가요?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            복잡한 광고 운영을 AI가 대신합니다. 당신은 비즈니스에만 집중하세요.
          </p>
        </header>

        <Tabs defaultValue={FEATURES[0].title} className="max-w-5xl mx-auto">
          {/* Main Container - unified card look */}
          <div className="bg-white border border-gray-100 shadow-xl shadow-gray-200/50 rounded-2xl flex flex-col lg:flex-row overflow-hidden min-h-[480px]">
            {/* 탭 리스트 - 왼쪽 사이드바 역할 */}
            <div className="lg:w-[300px] bg-slate-50/50 border-r border-gray-100 p-4 lg:p-6 flex-shrink-0">
              <TabsList className="flex lg:flex-col h-auto bg-transparent gap-2 overflow-x-auto lg:overflow-visible p-0 items-stretch">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <TabsTrigger
                      key={feature.title}
                      value={feature.title}
                      className="flex items-center gap-3 px-4 py-3.5 justify-start text-left whitespace-nowrap lg:whitespace-normal w-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm data-[state=active]:border-gray-200 border border-transparent rounded-xl transition-all hover:bg-white/60 text-slate-600 font-medium"
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{feature.title}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            {/* 탭 콘텐츠 부분 */}
            <div className="flex-1 p-6 lg:p-10 bg-white relative">
              {FEATURES.map((feature) => (
                <TabsContent key={feature.title} value={feature.title} className="mt-0 h-full flex flex-col focus-visible:outline-none focus-visible:ring-0">
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900">{feature.title}</h3>
                    </div>
                    <p className="text-slate-500 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* 기능별 미리보기 영역 (App Window Mockup) */}
                  <div className="mt-auto rounded-xl border border-gray-100 bg-slate-50/50 overflow-hidden shadow-sm">
                    {/* App Window Nav */}
                    <div className="flex px-4 py-3 border-b border-gray-100 bg-white/80 backdrop-blur-sm items-center justify-between">
                      <div className="flex gap-2 items-center w-24">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                        <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
                      </div>
                      <div className="flex items-center justify-center flex-1 px-4">
                        <div className="h-7 w-full max-w-[400px] bg-slate-50 border border-gray-100 rounded-md flex items-center justify-center gap-2">
                          <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                          <span className="text-[11px] text-slate-500 font-mono tracking-wide">app.batwo.io/dashboard</span>
                        </div>
                      </div>
                      <div className="w-24"></div> {/* Spacer for symmetry */}
                    </div>
                    {/* Inner Dashboard Nav (Fake) */}
                    <div className="flex border-b border-gray-100 bg-slate-50/50">
                      <div className="flex-1 flex justify-center py-3 border-b-2 border-primary bg-white text-primary text-xs font-semibold gap-2 items-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        대시보드
                      </div>
                      <div className="flex-1 flex justify-center py-3 text-slate-400 text-xs font-semibold gap-2 items-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        캠페인 관리
                      </div>
                      <div className="flex-1 flex justify-center py-3 text-slate-400 text-xs font-semibold gap-2 items-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        AI 보고서
                      </div>
                    </div>
                    {/* Window Content */}
                    <div className="p-4 lg:p-6 bg-white">
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
    <div className="space-y-6">
      <div className="flex items-start justify-between pb-2">
        <div>
          <h4 className="text-[17px] font-bold text-slate-900">{title}</h4>
          <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">실시간 데이터 업데이트 중</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded-full mt-1 border border-green-100/50">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          Live
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {preview.stats.map((stat, idx) => (
          <div key={stat.label} className={`bg-slate-50/50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center ${idx === 1 ? 'hidden lg:flex' : ''}`}>
            <div className="flex items-center gap-2 mb-3 text-slate-500">
              <div className="w-6 h-6 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                <span className="text-[10px] font-bold text-slate-400">$</span>
              </div>
              <span className="text-[11px] font-medium">{stat.label}</span>
            </div>
            <div className="text-xl font-bold text-slate-900 tracking-tight">{stat.value}</div>
            <div className="text-[10px] font-medium mt-2 flex items-center gap-1 text-slate-400">
              <span className="text-green-600 flex items-center">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                12%
              </span> 대비
            </div>
          </div>
        ))}
        {/* Placeholder 3rd Card to match image width if only 2 stats exist */}
        {preview.stats.length === 2 && (
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3 text-primary/70">
              <div className="w-6 h-6 rounded-full bg-white border border-primary/20 flex items-center justify-center shadow-sm">
                <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <span className="text-[11px] font-medium font-semibold">AI 예측 효율</span>
            </div>
            <div className="text-xl font-bold text-primary tracking-tight">358%</div>
            <div className="text-[10px] font-medium mt-2 text-primary/60">
              Top 5% 수준
            </div>
          </div>
        )}
      </div>

      {/* Mock Bar Chart Area */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[12px] font-medium text-slate-500">일별 전환 트렌드</span>
          <span className="text-[12px] text-slate-400">최근 7일</span>
        </div>
        <div className="h-24 flex items-end justify-around gap-2 px-2 pb-2">
          <div className="w-3 bg-[#5C85E6] rounded-t-full h-[30%] hover:h-[35%] transition-all" />
          <div className="w-3 bg-[#5C85E6] rounded-t-full h-[45%] hover:h-[50%] transition-all" />
          <div className="w-3 bg-[#5C85E6] rounded-t-full h-[35%] hover:h-[40%] transition-all" />
          <div className="w-3 bg-[#5C85E6] rounded-t-full h-[70%] hover:h-[75%] transition-all" />
          <div className="w-3 bg-[#5C85E6] rounded-t-full h-[40%] hover:h-[45%] transition-all" />
          <div className="w-3 bg-[#5C85E6] rounded-t-full h-[80%] hover:h-[85%] transition-all" />
          <div className="w-3 bg-[#5C85E6] rounded-t-full h-[55%] hover:h-[60%] transition-all" />
        </div>
      </div>

      {/* AI Insight Box (Footer) */}
      <div className="flex items-start gap-4 bg-[#F2FDF5] p-5 rounded-xl border border-[#DCFCE7]">
        <div className="flex items-center justify-center flex-shrink-0 mt-0.5 text-emerald-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-bold text-emerald-800 mb-1">AI 최적화 제안</p>
          <p className="text-[12px] text-emerald-700/80 leading-relaxed">
            {preview.highlight}
          </p>
        </div>
      </div>
    </div>
  )
}
