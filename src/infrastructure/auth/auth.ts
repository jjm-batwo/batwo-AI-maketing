import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import Facebook from 'next-auth/providers/facebook'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'

// Meta 로그인용 기본 권한 (앱 검수 불필요)
// 고급 권한(ads_management 등)은 /settings/meta-connect에서 별도 OAuth로 요청
const META_LOGIN_SCOPES = 'email,public_profile'

console.log('[AUTH] Initializing NextAuth with PrismaAdapter')

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development', // Only debug in dev
  // Override providers with full configuration including allowDangerousEmailAccountLinking
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID ?? '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.META_APP_ID ?? '',
      clientSecret: process.env.META_APP_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: META_LOGIN_SCOPES,
        },
      },
    }),
  ],
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('[AUTH EVENT] signIn:', {
        email: user?.email,
        provider: account?.provider,
        isNewUser,
      })
    },
    async createUser({ user }) {
      console.log('[AUTH EVENT] createUser:', user?.email)
    },
    async linkAccount({ user, account }) {
      console.log('[AUTH EVENT] linkAccount:', {
        email: user?.email,
        provider: account?.provider,
      })
    },
  },
})
