'use client'

import { useState } from 'react'

export function FreeAuditButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/audit/auth-url')
      const { authUrl } = await res.json()
      window.location.href = authUrl
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-primary hover:underline font-medium disabled:opacity-50 transition-opacity"
      aria-label="무료 광고 진단 시작 - Meta 계정 연결"
    >
      {loading ? '연결 중...' : '💡 내 광고 계정, 몇 점일까? 무료 진단받기'}
    </button>
  )
}
