'use client'

import { Sparkles, BarChart3, Zap } from 'lucide-react'

export function WelcomeStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        바투에 오신 것을 환영합니다
      </h2>

      <p className="mb-8 text-gray-600">
        AI 기반 마케팅 솔루션으로 광고 성과를 극대화하세요
      </p>

      <div className="grid w-full gap-4">
        <div className="flex items-start gap-4 rounded-lg border p-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">실시간 성과 분석</h3>
            <p className="text-sm text-gray-500">
              캠페인 KPI를 한눈에 확인하고 인사이트를 얻으세요
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-lg border p-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
            <Zap className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">AI 최적화 추천</h3>
            <p className="text-sm text-gray-500">
              AI가 분석한 맞춤형 최적화 제안을 받아보세요
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
