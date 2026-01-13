import { redirect } from 'next/navigation'
import { auth } from '@/infrastructure/auth'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 이미 로그인된 사용자는 캠페인 페이지로 리다이렉트
  const session = await auth()
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
