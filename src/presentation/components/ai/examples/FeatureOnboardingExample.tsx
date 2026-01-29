'use client'

/**
 * AI Feature Discovery & Onboarding Example
 *
 * This example demonstrates how to use the feature discovery components
 * to create a progressive onboarding experience for first-time users.
 */

import { useState } from 'react'
import {
  AIFeatureTour,
  FirstUseGuide,
  FeatureDiscoveryHint,
  TourStep,
} from '@/presentation/components/ai'
import { useFeatureDiscovery, AIFeatureType } from '@/presentation/hooks/useFeatureDiscovery'
import { Sparkles } from 'lucide-react'

// Define tour steps for AI features
const AI_FEATURE_TOUR_STEPS: TourStep[] = [
  {
    id: 'copy-generation',
    target: '[data-tour="copy-generation"]',
    title: 'AI 광고 카피 생성',
    description: '과학적 마케팅 원칙을 기반으로 고품질 광고 카피를 자동으로 생성합니다. 타겟 고객에 맞춘 메시지를 만들어보세요.',
    feature: 'AI 카피 생성',
    position: 'bottom',
  },
  {
    id: 'analysis',
    target: '[data-tour="analysis"]',
    title: 'AI 캠페인 분석',
    description: '캠페인 성과를 AI가 자동으로 분석하고 개선 방향을 제시합니다. 데이터 기반 의사결정을 지원합니다.',
    feature: 'AI 분석',
    position: 'left',
  },
  {
    id: 'insights',
    target: '[data-tour="insights"]',
    title: 'AI 인사이트',
    description: '데이터에서 숨겨진 패턴과 기회를 자동으로 발견합니다. 매일 새로운 인사이트를 확인하세요.',
    feature: 'AI 인사이트',
    position: 'right',
  },
  {
    id: 'chat',
    target: '[data-tour="chat"]',
    title: 'AI 마케팅 어시스턴트',
    description: '마케팅 전략에 대해 AI와 대화하며 아이디어를 얻으세요. 24/7 마케팅 자문이 가능합니다.',
    feature: 'AI 채팅',
    position: 'top',
  },
]

export function FeatureOnboardingExample() {
  const { isDiscovered, markDiscovered } = useFeatureDiscovery()

  // Tour state
  const [isTourOpen, setIsTourOpen] = useState(false)

  // First-use guide state
  const [activeGuide, setActiveGuide] = useState<AIFeatureType | null>(null)

  // Feature discovery hints
  const handleFeatureClick = (feature: AIFeatureType) => {
    // Show first-use guide if this is the first time
    if (!isDiscovered(feature)) {
      setActiveGuide(feature)
    } else {
      // Execute feature action
      console.log(`Executing feature: ${feature}`)
    }
  }

  const handleStartTour = () => {
    setActiveGuide(null)
    setIsTourOpen(true)
  }

  const handleTourComplete = () => {
    setIsTourOpen(false)
    // Mark all features as discovered
    AI_FEATURE_TOUR_STEPS.forEach((step) => {
      const featureMap: Record<string, AIFeatureType> = {
        'copy-generation': 'copy_generation',
        'analysis': 'analysis',
        'insights': 'insights',
        'chat': 'chat',
      }
      const feature = featureMap[step.id]
      if (feature) {
        markDiscovered(feature)
      }
    })
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          AI 기능 발견 & 온보딩 예시
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          사용자가 AI 기능을 자연스럽게 발견하고 학습할 수 있도록 돕습니다.
        </p>
        <button
          onClick={() => setIsTourOpen(true)}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          가이드 투어 시작
        </button>
      </div>

      {/* Example feature cards with discovery hints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Copy Generation Feature */}
        <div data-tour="copy-generation" className="relative">
          <div
            onClick={() => handleFeatureClick('copy_generation')}
            className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-500 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI 광고 카피 생성
              </h3>
              {!isDiscovered('copy_generation') && (
                <FeatureDiscoveryHint
                  feature="copy_generation"
                  hint="클릭하여 처음 사용해보세요!"
                  position="badge"
                  onDismiss={() => markDiscovered('copy_generation')}
                />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              과학적 마케팅 원칙 기반 고품질 카피 자동 생성
            </p>
          </div>
        </div>

        {/* Analysis Feature */}
        <div data-tour="analysis" className="relative">
          <div
            onClick={() => handleFeatureClick('analysis')}
            className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-500 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI 캠페인 분석
              </h3>
              {!isDiscovered('analysis') && (
                <FeatureDiscoveryHint
                  feature="analysis"
                  hint="클릭하여 처음 사용해보세요!"
                  position="badge"
                  onDismiss={() => markDiscovered('analysis')}
                />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              성과 분석 및 개선 방향 자동 제시
            </p>
          </div>
        </div>

        {/* Insights Feature */}
        <div data-tour="insights" className="relative">
          <div
            onClick={() => handleFeatureClick('insights')}
            className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-500 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI 인사이트
              </h3>
              {!isDiscovered('insights') && (
                <FeatureDiscoveryHint
                  feature="insights"
                  hint="클릭하여 처음 사용해보세요!"
                  position="badge"
                  onDismiss={() => markDiscovered('insights')}
                />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              숨겨진 패턴과 기회 자동 발견
            </p>
          </div>
        </div>

        {/* Chat Feature */}
        <div data-tour="chat" className="relative">
          <div
            onClick={() => handleFeatureClick('chat')}
            className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-500 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI 마케팅 어시스턴트
              </h3>
              {!isDiscovered('chat') && (
                <FeatureDiscoveryHint
                  feature="chat"
                  hint="클릭하여 처음 사용해보세요!"
                  position="badge"
                  onDismiss={() => markDiscovered('chat')}
                />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              24/7 마케팅 전략 자문 및 아이디어
            </p>
          </div>
        </div>
      </div>

      {/* Inline discovery hint example */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          인라인 발견 힌트 예시
        </h2>
        {!isDiscovered('proactive_insights') && (
          <FeatureDiscoveryHint
            feature="proactive_insights"
            hint="능동적 인사이트 기능이 추가되었습니다. AI가 중요한 변화를 자동으로 감지하고 알려드립니다."
            position="inline"
            onDismiss={() => markDiscovered('proactive_insights')}
            showOnce={true}
          />
        )}
      </div>

      {/* Feature Tour */}
      <AIFeatureTour
        steps={AI_FEATURE_TOUR_STEPS}
        isOpen={isTourOpen}
        onComplete={handleTourComplete}
        onSkip={() => setIsTourOpen(false)}
      />

      {/* First Use Guide */}
      {activeGuide && (
        <FirstUseGuide
          feature={activeGuide}
          variant="modal"
          onDismiss={() => setActiveGuide(null)}
          onStartTour={handleStartTour}
        />
      )}

      {/* Implementation notes */}
      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          구현 노트
        </h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• <strong>AIFeatureTour:</strong> 단계별 가이드 투어로 여러 기능을 순차적으로 소개</li>
          <li>• <strong>FirstUseGuide:</strong> 특정 기능을 처음 사용할 때 상세 설명 제공</li>
          <li>• <strong>FeatureDiscoveryHint:</strong> 새로운 기능을 부드럽게 알림</li>
          <li>• <strong>useFeatureDiscovery:</strong> 발견 상태를 로컬스토리지에 저장하여 영구 보존</li>
        </ul>
      </div>
    </div>
  )
}
