import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware
 *
 * NOTE: Middleware redirect logic is currently handled at page/layout level
 * due to Next.js 16.1.1 + Turbopack compatibility issues where middleware
 * doesn't execute properly.
 *
 * Auth redirects implemented in:
 * - src/app/page.tsx (logged-in users: / → /campaigns)
 * - src/app/(auth)/layout.tsx (logged-in users: /login, /register → /campaigns)
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip internal paths
    '/((?!_next|api|favicon.ico|.*\\..*).*)',
  ],
}
