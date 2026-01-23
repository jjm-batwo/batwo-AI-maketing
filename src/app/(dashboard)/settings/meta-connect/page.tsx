'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Link2, Unlink, Loader2 } from 'lucide-react'

interface MetaAdAccount {
  id: string
  metaAccountId: string
  businessName: string | null
  createdAt: string
  tokenExpiry: string | null
}

function MetaConnectContent() {
  const searchParams = useSearchParams()
  const [accounts, setAccounts] = useState<MetaAdAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/meta/accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts)
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = () => {
    setIsConnecting(true)
    const appId = process.env.NEXT_PUBLIC_META_APP_ID
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/meta/callback`)
    const scope = encodeURIComponent('ads_management,ads_read,business_management,pages_show_list,pages_read_engagement')

    window.location.href = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`
  }

  const handleDisconnect = async () => {
    if (!confirm('Meta 광고 계정 연결을 해제하시겠습니까?')) return

    setIsDisconnecting(true)
    try {
      const response = await fetch('/api/meta/accounts', { method: 'DELETE' })
      if (response.ok) {
        setAccounts([])
      }
    } catch (err) {
      console.error('Failed to disconnect:', err)
    } finally {
      setIsDisconnecting(false)
    }
  }

  const isConnected = accounts.length > 0

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="mb-6 text-2xl font-bold">Meta 광고 계정 연결</h1>

      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <span>Meta 광고 계정이 성공적으로 연결되었습니다!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Meta 광고 계정
          </CardTitle>
          <CardDescription>
            Meta (Facebook/Instagram) 광고 계정을 연결하여 캠페인을 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isConnected ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{accounts[0].businessName || 'Meta 광고 계정'}</p>
                    <p className="text-sm text-muted-foreground">
                      계정 ID: {accounts[0].metaAccountId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      연결일: {new Date(accounts[0].createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>

              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="w-full"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    연결 해제 중...
                  </>
                ) : (
                  <>
                    <Unlink className="mr-2 h-4 w-4" />
                    연결 해제
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Link2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  연결된 Meta 광고 계정이 없습니다
                </p>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-[#1877F2] hover:bg-[#1877F2]/90"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    연결 중...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Meta 계정 연결하기
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                연결 시 Meta의 광고 관리 권한을 요청합니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">연결 후 사용 가능한 기능</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                캠페인 실시간 성과 데이터 조회
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                KPI 대시보드 자동 업데이트
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                AI 기반 캠페인 최적화 제안
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                주간 보고서 자동 생성
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetaConnectLoading() {
  return (
    <div className="container max-w-2xl py-8">
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}

export default function MetaConnectPage() {
  return (
    <Suspense fallback={<MetaConnectLoading />}>
      <MetaConnectContent />
    </Suspense>
  )
}
