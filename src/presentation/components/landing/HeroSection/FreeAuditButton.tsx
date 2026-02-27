'use client'

import { useState } from 'react'
import { Search, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function FreeAuditButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/audit/auth-url')
      if (!res.ok) {
        throw new Error('인증 URL 생성 실패')
      }
      const { authUrl } = await res.json()
      window.location.href = authUrl
    } catch {
      toast.error('Meta 계정 연결에 실패했습니다. 다시 시도해주세요.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="group w-full max-w-md mx-auto flex items-center gap-4 px-5 py-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-300 disabled:opacity-60 cursor-pointer"
      aria-label="무료 광고 진단 시작 - Meta 계정 연결"
    >
      <div className="shrink-0 p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors duration-300">
        {loading ? (
          <Loader2 className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-spin" />
        ) : (
          <Search className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {loading ? '연결 중...' : '내 광고 계정, 몇 점일까?'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Meta 계정 연결로 무료 AI 진단 받기
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
    </button>
  )
}
