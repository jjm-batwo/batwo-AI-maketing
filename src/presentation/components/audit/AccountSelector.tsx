'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Building2, AlertTriangle } from 'lucide-react'
import {
  getStatusLabel,
  getStatusColor,
  getStatusDotColor,
  isActiveAccount,
  sortByStatus,
} from '@/presentation/utils/accountStatus'

export interface AdAccount {
  id: string
  name: string
  currency: string
  accountStatus: number
}

interface AccountSelectorProps {
  accounts: AdAccount[]
  onSelect: (adAccountId: string) => void
  loading?: boolean
  /** 현재 선택된 계정 ID (aria-checked 상태 반영용) */
  selectedAccountId?: string
}

export function AccountSelector({ accounts, onSelect, loading, selectedAccountId }: AccountSelectorProps) {
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const sorted = sortByStatus(accounts)

  // 포커스 트랩: 다이얼로그 내 포커스 가능한 요소 순환
  const trapFocus = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      // Shift+Tab: 첫 번째 요소에서 마지막으로 순환
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      // Tab: 마지막 요소에서 첫 번째로 순환
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  // 다이얼로그 열릴 때 첫 번째 버튼에 포커스
  useEffect(() => {
    if (!confirmTarget || !dialogRef.current) return

    const firstButton = dialogRef.current.querySelector<HTMLElement>('button')
    firstButton?.focus()
  }, [confirmTarget])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4" role="status">
        <Loader2 className="h-8 w-8 text-primary animate-spin" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">계정 목록을 불러오는 중...</p>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-4">
        <Building2 className="h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">광고 계정이 없습니다</p>
          <p className="text-sm text-muted-foreground">
            연결된 Meta 계정에 광고 계정이 없습니다. Meta Business Manager에서 계정을 확인해주세요.
          </p>
        </div>
      </div>
    )
  }

  const handleClick = (account: AdAccount) => {
    if (!isActiveAccount(account.accountStatus)) {
      setConfirmTarget(account.id)
      return
    }
    onSelect(account.id)
  }

  const handleConfirm = () => {
    if (confirmTarget) {
      onSelect(confirmTarget)
      setConfirmTarget(null)
    }
  }

  const activeCount = sorted.filter((a) => isActiveAccount(a.accountStatus)).length

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 py-8 px-4 md:px-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          진단할 광고 계정을 선택하세요
        </h1>
        <p className="text-sm text-muted-foreground">
          총 {accounts.length}개 계정 중 {activeCount}개가 운영 중입니다
        </p>
      </div>

      <div className="grid gap-3" role="radiogroup" aria-label="광고 계정 선택">
        {sorted.map((account) => {
          const active = isActiveAccount(account.accountStatus)
          return (
            <Card
              key={account.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                active
                  ? 'hover:border-primary/50'
                  : 'opacity-70 hover:opacity-90 hover:border-amber-300 dark:hover:border-amber-700'
              }`}
              role="radio"
              aria-checked={selectedAccountId === account.id}
              aria-label={`${account.name} - ${getStatusLabel(account.accountStatus)}`}
              tabIndex={0}
              onClick={() => handleClick(account)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClick(account)
                }
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="shrink-0 p-2.5 rounded-xl bg-muted">
                  <Building2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{account.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {account.id} · {account.currency}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 gap-1.5 ${getStatusColor(account.accountStatus)}`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${getStatusDotColor(account.accountStatus)}`}
                    aria-hidden="true"
                  />
                  {getStatusLabel(account.accountStatus)}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 비활성 계정 확인 다이얼로그 */}
      {confirmTarget && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-label="비활성 계정 진단 확인"
          ref={dialogRef}
          onKeyDown={(e) => {
            // ESC 키로 다이얼로그 닫기
            if (e.key === 'Escape') {
              setConfirmTarget(null)
              return
            }
            // 포커스 트랩
            trapFocus(e)
          }}
          onClick={(e) => {
            // 오버레이(배경) 클릭 시 닫기
            if (e.target === e.currentTarget) {
              setConfirmTarget(null)
            }
          }}
        >
          <Card className="w-full max-w-sm mx-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
                비활성 계정 진단
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                이 계정은 현재 운영 중이 아닙니다. 진단 결과가 제한적일 수 있습니다. 계속하시겠습니까?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmTarget(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  계속 진단
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
