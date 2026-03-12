import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/infrastructure/auth'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // 이미 로그인된 사용자는 callbackUrl이 있으면 해당 경로로, 없으면 캠페인 페이지로 리다이렉트
  // DB 연결 실패 시에도 로그인 페이지는 정상 렌더링
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error('[AUTH_LAYOUT] auth() failed (DB may be unavailable):', error)
  }
  if (session?.user) {
    const headersList = await headers()
    // 미들웨어에서 설정한 x-search에서 callbackUrl 파라미터 추출
    const search = headersList.get('x-search') ?? ''
    let callbackUrl = '/campaigns'
    if (search) {
      try {
        const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
        const cb = params.get('callbackUrl')
        // 상대 경로만 허용 (open redirect 방지)
        if (cb && cb.startsWith('/')) {
          callbackUrl = cb
        }
      } catch {
        // 파싱 실패 시 기본값 사용
      }
    }
    redirect(callbackUrl)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
