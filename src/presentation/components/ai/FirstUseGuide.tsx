'use client'

import { useState } from 'react'
import { X, Sparkles, BookOpen, Lightbulb, ChevronRight } from 'lucide-react'
import { useFeatureDiscovery, AIFeatureType } from '@/presentation/hooks/useFeatureDiscovery'
import { cn } from '@/lib/utils'

const FEATURE_GUIDES: Record<
  AIFeatureType,
  {
    title: string
    description: string
    capabilities: string[]
    tips: string[]
  }
> = {
  copy_generation: {
    title: 'AI 광고 카피 생성',
    description: '과학적 마케팅 원칙을 기반으로 고품질 광고 카피를 자동 생성합니다.',
    capabilities: [
      '타겟 고객에 맞춘 맞춤형 메시지',
      '검증된 마케팅 프레임워크 적용',
      '다양한 톤 & 길이 옵션',
    ],
    tips: [
      '제품의 핵심 가치를 명확히 입력하세요',
      '타겟 고객의 페인 포인트를 구체적으로 작성하세요',
      '여러 버전을 생성하고 A/B 테스트하세요',
    ],
  },
  analysis: {
    title: 'AI 캠페인 분석',
    description: '캠페인 성과를 AI가 분석하고 개선 방향을 제시합니다.',
    capabilities: [
      '실시간 성과 지표 분석',
      'ROI 개선 기회 발견',
      '경쟁사 대비 벤치마킹',
    ],
    tips: [
      '최소 7일간의 데이터가 있을 때 가장 정확합니다',
      '주간 단위로 정기 분석을 받아보세요',
      'AI 제안을 실행한 후 결과를 추적하세요',
    ],
  },
  chat: {
    title: 'AI 마케팅 어시스턴트',
    description: '마케팅 전략과 전술에 대해 AI와 대화하며 아이디어를 얻으세요.',
    capabilities: [
      '24/7 마케팅 자문',
      '즉각적인 전략 피드백',
      '맞춤형 솔루션 제안',
    ],
    tips: [
      '구체적인 상황을 설명할수록 정확한 답변을 받습니다',
      '캠페인 데이터를 공유하면 더 맞춤화된 조언을 받습니다',
      '여러 각도에서 질문하며 아이디어를 확장하세요',
    ],
  },
  insights: {
    title: 'AI 인사이트',
    description: '데이터에서 숨겨진 패턴과 기회를 자동으로 발견합니다.',
    capabilities: [
      '트렌드 및 패턴 인식',
      '이상 징후 조기 경보',
      '최적화 기회 추천',
    ],
    tips: [
      '매일 인사이트를 확인하는 습관을 만드세요',
      '중요한 인사이트는 북마크하여 추적하세요',
      '팀과 인사이트를 공유하고 함께 실행하세요',
    ],
  },
  proactive_insights: {
    title: '능동적 인사이트',
    description: 'AI가 자동으로 중요한 변화를 감지하고 알려드립니다.',
    capabilities: [
      '실시간 성과 모니터링',
      '자동 이상 탐지',
      '즉각적인 알림 전송',
    ],
    tips: [
      '알림 설정을 맞춤화하세요',
      '긴급도에 따라 우선순위를 정하세요',
      '패턴이 반복되면 자동화 규칙을 만드세요',
    ],
  },
  science_score: {
    title: '과학 신뢰도 점수',
    description: 'AI 제안의 과학적 근거와 신뢰도를 투명하게 보여줍니다.',
    capabilities: [
      '학술 논문 기반 검증',
      '신뢰도 수준 명시',
      '출처 추적 가능',
    ],
    tips: [
      '높은 점수(80% 이상)의 제안을 우선 시도하세요',
      '낮은 점수 제안도 맥락에 따라 가치가 있을 수 있습니다',
      '출처를 클릭하여 근거를 직접 확인하세요',
    ],
  },
  contextual_suggestions: {
    title: '맥락 기반 AI 제안',
    description: '작업 중인 화면에 맞춰 적절한 AI 제안을 제공합니다.',
    capabilities: [
      '상황에 맞는 자동 제안',
      '원클릭 적용',
      '학습하는 추천 시스템',
    ],
    tips: [
      '제안을 사용할수록 더 정확해집니다',
      '필요없는 제안은 숨김 처리하세요',
      '자주 사용하는 제안은 즐겨찾기하세요',
    ],
  },
  ambient_insights: {
    title: '앰비언트 인사이트',
    description: '업무 흐름을 방해하지 않고 부드럽게 인사이트를 전달합니다.',
    capabilities: [
      '비침투적 알림',
      '타이밍 최적화',
      '맥락 인식 전달',
    ],
    tips: [
      '알림 빈도를 조절할 수 있습니다',
      '중요한 인사이트는 자동 저장됩니다',
      '나중에 다시 보려면 인사이트 센터를 활용하세요',
    ],
  },
  error_recovery: {
    title: 'AI 오류 복구',
    description: 'AI 작업 중 오류가 발생해도 부분 결과를 활용할 수 있습니다.',
    capabilities: [
      '부분 성공 결과 보존',
      '자동 재시도 옵션',
      '대안 솔루션 제안',
    ],
    tips: [
      '부분 결과도 가치가 있을 수 있습니다',
      '재시도 전에 문제를 확인하세요',
      '지속적인 오류는 고객 지원팀에 문의하세요',
    ],
  },
  confidence_indicator: {
    title: '신뢰도 표시',
    description: 'AI 응답의 확실성 수준을 색상으로 표시합니다.',
    capabilities: [
      '문장별 신뢰도 표시',
      '시각적 색상 코드',
      '근거 자료 링크',
    ],
    tips: [
      '녹색: 높은 신뢰도 (바로 사용 가능)',
      '노란색: 중간 신뢰도 (검토 권장)',
      '빨간색: 낮은 신뢰도 (추가 검증 필요)',
    ],
  },
}

export interface FirstUseGuideProps {
  feature: AIFeatureType
  onDismiss: () => void
  onStartTour?: () => void
  variant?: 'modal' | 'inline'
  className?: string
}

export function FirstUseGuide({
  feature,
  onDismiss,
  onStartTour,
  variant = 'modal',
  className,
}: FirstUseGuideProps) {
  const [showAgain, setShowAgain] = useState(true)
  const { markDiscovered } = useFeatureDiscovery()

  const guide = FEATURE_GUIDES[feature]

  const handleDismiss = () => {
    if (!showAgain) {
      markDiscovered(feature)
    }
    onDismiss()
  }

  const handleStartTour = () => {
    markDiscovered(feature)
    onStartTour?.()
  }

  if (variant === 'modal') {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-300"
          onClick={handleDismiss}
        />

        {/* Modal */}
        <div
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-full max-w-lg max-h-[90vh] overflow-y-auto',
            'bg-white dark:bg-gray-900 rounded-xl shadow-2xl',
            'animate-in fade-in zoom-in-95 duration-300',
            className
          )}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {guide.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">처음 사용하시는군요!</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Description */}
            <div>
              <p className="text-gray-700 dark:text-gray-300">{guide.description}</p>
            </div>

            {/* Capabilities */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  이런 것들을 할 수 있어요
                </h3>
              </div>
              <ul className="space-y-2">
                {guide.capabilities.map((capability, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <span>{capability}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  더 잘 사용하는 팁
                </h3>
              </div>
              <ul className="space-y-2">
                {guide.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-full text-xs font-medium text-amber-700 dark:text-amber-400">
                      {index + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!showAgain}
                  onChange={(e) => setShowAgain(!e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span>다시 보지 않기</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  닫기
                </button>
                {onStartTour && (
                  <button
                    onClick={handleStartTour}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    가이드 투어 시작
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // inline variant
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden',
        'animate-in fade-in slide-in-from-top-4 duration-300',
        className
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {guide.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">처음 사용하시는군요!</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">{guide.description}</p>

        {/* Capabilities */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">
            이런 것들을 할 수 있어요
          </h3>
          <ul className="space-y-1.5">
            {guide.capabilities.map((capability, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <ChevronRight className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <span>{capability}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tips */}
        <div>
          <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">
            더 잘 사용하는 팁
          </h3>
          <ul className="space-y-1.5">
            {guide.tips.slice(0, 2).map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-full text-xs font-medium text-amber-700 dark:text-amber-400">
                  {index + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={!showAgain}
              onChange={(e) => setShowAgain(!e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-xs"
            />
            <span>다시 보지 않기</span>
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              닫기
            </button>
            {onStartTour && (
              <button
                onClick={handleStartTour}
                className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                투어 시작
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
