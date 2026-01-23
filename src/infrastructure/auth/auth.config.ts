import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import Facebook from 'next-auth/providers/facebook'
import { z } from 'zod'
import { GlobalRole } from '@domain/value-objects/GlobalRole'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authConfig = {
  trustHost: true, // Required for Vercel deployment
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[AUTH] signIn callback:', {
        userEmail: user?.email,
        userId: user?.id,
        provider: account?.provider,
        profileEmail: profile?.email,
      })
      // Allow all sign-ins by default
      return true
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLandingPage = nextUrl.pathname === '/'
      const isOnDashboard =
        nextUrl.pathname.startsWith('/campaigns') ||
        nextUrl.pathname.startsWith('/reports') ||
        nextUrl.pathname.startsWith('/settings')
      const isOnAuth = nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register')
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')

      console.log('[AUTH] authorized callback:', {
        pathname: nextUrl.pathname,
        isLoggedIn,
        isLandingPage,
        isOnDashboard,
        isOnAuth,
        isOnAdmin,
        authUser: auth?.user?.email,
        globalRole: auth?.user?.globalRole,
      })

      // 랜딩 페이지는 누구나 접근 가능
      if (isLandingPage) {
        // 로그인 사용자는 캠페인 페이지로 리다이렉트
        if (isLoggedIn) return Response.redirect(new URL('/campaigns', nextUrl))
        return true
      }

      // Admin 페이지는 ADMIN 또는 SUPER_ADMIN만 접근 가능
      if (isOnAdmin) {
        if (!isLoggedIn) return false
        const userRole = auth?.user?.globalRole as GlobalRole | undefined
        if (userRole === GlobalRole.ADMIN || userRole === GlobalRole.SUPER_ADMIN) {
          return true
        }
        // 권한 없는 사용자는 캠페인 페이지로 리다이렉트
        return Response.redirect(new URL('/campaigns', nextUrl))
      }

      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false
      } else if (isOnAuth) {
        if (isLoggedIn) return Response.redirect(new URL('/campaigns', nextUrl))
        return true
      }
      return true
    },
    jwt({ token, user, account }) {
      console.log('[AUTH] jwt callback:', {
        hasUser: !!user,
        userEmail: user?.email,
        hasAccount: !!account,
        provider: account?.provider,
        tokenId: token?.id,
        globalRole: user?.globalRole || token?.globalRole,
      })
      if (user) {
        token.id = user.id
        // globalRole은 auth.ts에서 DB 조회 후 설정됨
        token.globalRole = user.globalRole || GlobalRole.USER
      }
      if (account) {
        token.provider = account.provider
        // Note: Meta Ads API 토큰은 /settings/meta-connect에서 별도 OAuth로 획득
        // 여기서는 로그인용 기본 권한(email, public_profile)만 처리
      }
      return token
    },
    session({ session, token }) {
      console.log('[AUTH] session callback:', {
        hasToken: !!token,
        tokenId: token?.id,
        sessionUser: session?.user?.email,
        globalRole: token?.globalRole,
      })
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.provider = token.provider as string | undefined
        session.user.globalRole = (token.globalRole as GlobalRole) || GlobalRole.USER
      }
      return session
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID ?? '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? '',
    }),
    Facebook({
      clientId: process.env.META_APP_ID ?? '',
      clientSecret: process.env.META_APP_SECRET ?? '',
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        // Note: Password verification is handled in auth.ts with bcrypt
        // This config is edge-compatible and doesn't include bcrypt
        return null
      },
    }),
  ],
} satisfies NextAuthConfig

// Edge-compatible NextAuth instance for middleware (no adapter, no bcrypt)
const { auth } = NextAuth(authConfig)

// Export auth wrapper for middleware use
export { auth as authMiddleware }
