'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Code2, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PixelSelector } from '@presentation/components/pixel/PixelSelector'

interface SelectedPixel {
  id: string
  metaPixelId: string
  name: string
}

export function PixelSetupStep() {
  const { data: session } = useSession()
  const isMetaConnected = !!session?.user?.metaAccessToken
  const [selectedPixel, setSelectedPixel] = useState<SelectedPixel | null>(null)
  const [showScript, setShowScript] = useState(false)

  const handlePixelSelect = (pixel: SelectedPixel) => {
    setSelectedPixel(pixel)
    setShowScript(true)
  }

  const scriptCode = selectedPixel
    ? `<script src="https://batwo.ai/api/pixel/${selectedPixel.id}/tracker.js" async></script>`
    : ''

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
        <Code2 className="h-8 w-8 text-purple-600" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        픽셀 설치
      </h2>

      <p className="mb-6 text-gray-600">
        Meta 픽셀을 설치하여 웹사이트 방문자 행동을 추적하고
        <br />
        전환 최적화된 광고를 운영하세요
      </p>

      {!isMetaConnected ? (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-left">
            <p className="text-sm text-yellow-800">
              먼저 Meta 계정을 연결해주세요. 이전 단계에서 연결하실 수 있습니다.
            </p>
          </div>
        </div>
      ) : !selectedPixel ? (
        <div className="w-full max-w-md">
          <PixelSelector
            onSelect={handlePixelSelect}
            showCreateButton={false}
          />
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{selectedPixel.name} 선택됨</span>
          </div>

          {showScript && (
            <div className="rounded-lg border bg-gray-50 p-4 text-left">
              <h4 className="mb-2 font-medium text-gray-900">설치 방법</h4>
              <p className="mb-3 text-sm text-gray-600">
                아래 스크립트를 웹사이트의 &lt;head&gt; 태그에 추가하세요
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
                  <code>{scriptCode}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => navigator.clipboard.writeText(scriptCode)}
                  aria-label="코드 복사"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPixel(null)
              setShowScript(false)
            }}
            className="text-gray-500"
          >
            다른 픽셀 선택
          </Button>
        </div>
      )}

      <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left">
        <h4 className="mb-2 font-medium text-gray-900">픽셀 설치 효과</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• 웹사이트 방문자 행동 추적</li>
          <li>• 전환 이벤트 측정 (구매, 장바구니 등)</li>
          <li>• 리타겟팅 광고 운영</li>
          <li>• 광고 최적화를 위한 데이터 수집</li>
        </ul>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        픽셀 설치는 나중에 설정에서도 가능합니다
      </p>
    </div>
  )
}
