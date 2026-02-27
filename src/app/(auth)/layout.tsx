import { redirect } from 'next/navigation'
import { auth } from '@/infrastructure/auth'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 이미 로그인된 사용자는 캠페인 페이지로 리다이렉트
  // DB 연결 실패 시에도 로그인 페이지는 정상 렌더링
  let session = null
  try {
    session = await auth()
  } catch (error) {
    console.error('[AUTH_LAYOUT] auth() failed (DB may be unavailable):', error)
  }
  if (session?.user) {
    redirect('/campaigns')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
