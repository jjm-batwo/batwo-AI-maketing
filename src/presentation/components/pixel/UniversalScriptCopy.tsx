'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Pixel {
  id: string
  metaPixelId: string
  name: string
}

interface UniversalScriptCopyProps {
  pixel: Pixel
  baseUrl?: string
}

export function UniversalScriptCopy({
  pixel,
  baseUrl = 'https://batwo.ai',
}: UniversalScriptCopyProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const scriptCode = `<script src="${baseUrl}/api/pixel/${pixel.id}/tracker.js" async></script>`

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(scriptCode)
      setCopyStatus('success')
      setTimeout(() => setCopyStatus('idle'), 3000)
    } catch {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 3000)
    }
  }, [scriptCode])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">추적 스크립트 설치</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          아래 스크립트를 웹사이트에 추가하여 Meta 픽셀을 설치하세요.
        </p>
      </div>

      <div className="relative">
        <pre
          className={cn(
            'overflow-x-auto rounded-lg border bg-muted p-4 font-mono text-sm',
            copyStatus === 'success' && 'border-green-500',
            copyStatus === 'error' && 'border-red-500'
          )}
        >
          <code data-testid="script-code" role="code" aria-label="추적 스크립트 코드">
            {scriptCode}
          </code>
        </pre>

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          aria-label="스크립트 복사"
          className={cn(
            'absolute right-2 top-2',
            copyStatus === 'success' && 'border-green-500 text-green-600',
            copyStatus === 'error' && 'border-red-500 text-red-600'
          )}
        >
          {copyStatus === 'success' ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              복사되었습니다
            </>
          ) : copyStatus === 'error' ? (
            <>
              <AlertCircle className="mr-1 h-4 w-4" />
              복사 실패
            </>
          ) : (
            <>
              <Copy className="mr-1 h-4 w-4" />
              복사
            </>
          )}
        </Button>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="font-medium">설치 방법</h4>
        <ol className="mt-2 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
          <li>
            위의 스크립트 코드를 복사합니다.
          </li>
          <li>
            웹사이트의 HTML 파일을 열어 <code className="rounded bg-muted px-1">&lt;head&gt;</code> 태그 안에 붙여넣습니다.
          </li>
          <li>
            웹사이트의 모든 페이지에 위 스크립트를 추가해주세요.
          </li>
          <li>
            설치 후 페이지 새로고침 시 자동으로 PageView 이벤트가 전송됩니다.
          </li>
        </ol>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900">참고사항</h4>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800">
          <li>스크립트는 비동기(async)로 로드되어 페이지 로딩 속도에 영향을 주지 않습니다.</li>
          <li>설치 후 약 5-10분 정도 후에 이벤트 수신이 시작됩니다.</li>
          <li>Meta 픽셀 ID: <code className="rounded bg-blue-100 px-1">{pixel.metaPixelId}</code></li>
        </ul>
      </div>
    </div>
  )
}
