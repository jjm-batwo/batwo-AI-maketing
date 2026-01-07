'use client'

import { PartyPopper, ArrowRight } from 'lucide-react'

export function CompletionStep() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <PartyPopper className="h-8 w-8 text-green-600" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        설정이 완료되었습니다!
      </h2>

      <p className="mb-8 text-gray-600">
        이제 바투의 모든 기능을 사용할 준비가 되었습니다
      </p>

      <div className="w-full space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h3 className="mb-2 font-medium text-primary">다음 단계</h3>
          <ul className="space-y-2 text-left text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              대시보드에서 전체 성과 확인하기
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              첫 번째 캠페인 만들기
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              AI 인사이트 리포트 받아보기
            </li>
          </ul>
        </div>

        <p className="text-sm text-gray-500">
          궁금한 점이 있으시면 언제든 도움말 센터를 이용해주세요
        </p>
      </div>
    </div>
  )
}
