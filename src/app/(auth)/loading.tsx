/**
 * Auth Loading State
 *
 * 인증 페이지 로딩 중 표시되는 UI
 */

import { Loader2 } from 'lucide-react'

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    </div>
  )
}
