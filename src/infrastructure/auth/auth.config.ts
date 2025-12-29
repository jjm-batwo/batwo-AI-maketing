import type { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authConfig = {
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    newUser: '/',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLandingPage = nextUrl.pathname === '/'
      const isOnDashboard =
        nextUrl.pathname.startsWith('/campaigns') ||
        nextUrl.pathname.startsWith('/reports') ||
        nextUrl.pathname.startsWith('/settings')
      const isOnAuth = nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/register')

      // 랜딩 페이지는 누구나 접근 가능
      if (isLandingPage) {
        // 로그인 사용자는 캠페인 페이지로 리다이렉트
        if (isLoggedIn) return Response.redirect(new URL('/campaigns', nextUrl))
        return true
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
      if (user) {
        token.id = user.id
      }
      if (account?.provider === 'kakao' || account?.provider === 'google') {
        token.provider = account.provider
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
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
