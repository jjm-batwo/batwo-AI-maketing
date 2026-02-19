import Link from 'next/link'
import { XCircle, ArrowLeft, Home } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// 결제 실패 페이지: 순수 서버 컴포넌트 (JS 번들 불필요)
export default async function CheckoutFailPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string }>
}) {
  const { code, message } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-center text-2xl">결제 실패</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error details */}
            <div className="bg-red-50 border border-red-200 rounded-md p-4 space-y-2">
              {code && (
                <div className="text-sm">
                  <span className="font-medium text-red-900">오류 코드:</span>
                  <span className="text-red-700 ml-2">{code}</span>
                </div>
              )}
              {message && (
                <div className="text-sm">
                  <span className="font-medium text-red-900">오류 메시지:</span>
                  <p className="text-red-700 mt-1">{message}</p>
                </div>
              )}
              {!code && !message && (
                <p className="text-sm text-red-700">
                  결제 처리 중 문제가 발생했습니다. 다시 시도해주세요.
                </p>
              )}
            </div>

            {/* Common reasons */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">자주 발생하는 문제:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>카드 한도 초과</li>
                <li>카드 정보 입력 오류</li>
                <li>인증 실패 또는 취소</li>
                <li>일시적인 시스템 오류</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Link href="/#pricing" className="block">
                <Button className="w-full" size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  다시 시도
                </Button>
              </Link>
              <Link href="/#pricing" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  <Home className="mr-2 h-4 w-4" />
                  요금제 보기
                </Button>
              </Link>
            </div>

            {/* Contact info */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
              <p>문제가 계속되면</p>
              <a
                href="mailto:support@batwo.ai"
                className="text-blue-600 hover:underline font-medium"
              >
                support@batwo.ai
              </a>
              <span> 로 문의해주세요</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
