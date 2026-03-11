'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'

export const AuditUpgradeCTA = memo(function AuditUpgradeCTA({
  wasteEstimate,
}: {
  wasteEstimate: number
}) {
  return (
    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
      <h3 className="text-2xl font-bold text-blue-900 mb-4">
        Batwo AI 최적화를 시작하세요
      </h3>
      <p className="text-blue-800 mb-6 max-w-lg mx-auto leading-relaxed">
        진단 결과 확인 후 무엇을 해야 할지 막막하신가요?
        <br />
        Batwo의 AI 에이전트가 예상 낭비액 {wasteEstimate.toLocaleString()}원을 즉시 절감할 수 있는 
        최적화 전략을 제안하고 원클릭으로 실행합니다.
      </p>
      <div className="flex justify-center gap-4">
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          AI 최적화 시작
        </Button>
        <Button size="lg" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-100">
          보고서 PDF 저장
        </Button>
      </div>
    </div>
  )
})
