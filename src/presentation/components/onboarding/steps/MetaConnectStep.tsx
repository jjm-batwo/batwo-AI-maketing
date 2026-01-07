'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Facebook, CheckCircle2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MetaConnectStep() {
  const { data: session } = useSession()
  const isMetaConnected = !!session?.user?.metaAccessToken

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <Facebook className="h-8 w-8 text-blue-600" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        Meta 광고 계정 연결
      </h2>

      <p className="mb-8 text-gray-600">
        Meta(Facebook/Instagram) 광고 계정을 연결하여
        <br />
        캠페인 데이터를 자동으로 동기화하세요
      </p>

      {isMetaConnected ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Meta 계정이 연결되었습니다</span>
          </div>
          <p className="text-sm text-gray-500">
            다음 단계로 진행하여 설정을 완료하세요
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/settings/meta-connect">
              <Facebook className="h-5 w-5" />
              Meta 계정 연결하기
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>

          <p className="text-sm text-gray-500">
            계정 연결은 나중에 설정에서도 가능합니다
          </p>
        </div>
      )}

      <div className="mt-8 rounded-lg bg-gray-50 p-4 text-left">
        <h4 className="mb-2 font-medium text-gray-900">연결 시 수집되는 정보</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• 광고 캠페인 성과 데이터 (노출, 클릭, 전환)</li>
          <li>• 광고 비용 및 예산 정보</li>
          <li>• 타겟 오디언스 인사이트</li>
        </ul>
      </div>
    </div>
  )
}
