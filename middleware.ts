import NextAuth from 'next-auth'
import { authConfig } from '@/infrastructure/auth/auth.config'

export default NextAuth(authConfig).auth

export const config = {
  // Match all routes except static files, API routes (except auth), and public assets
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
