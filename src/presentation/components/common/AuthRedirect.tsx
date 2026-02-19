'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

/**
 * 로그인된 사용자를 자동 리다이렉트하는 클라이언트 컴포넌트.
 * 랜딩 페이지를 ISR로 캐싱하면서도 로그인 사용자 리다이렉트를 유지하기 위해 사용.
 * (Turbopack 호환성 문제로 미들웨어 대신 사용)
 */
export function AuthRedirect({ to = '/campaigns' }: { to?: string }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.replace(to)
    }
  }, [status, session, router, to])

  return null
}
