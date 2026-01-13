import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import Facebook from 'next-auth/providers/facebook'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'

// Meta 로그인용 기본 권한 (앱 검수 불필요)
// 고급 권한(ads_management 등)은 /settings/meta-connect에서 별도 OAuth로 요청
const META_LOGIN_SCOPES = 'email,public_profile'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

console.log('[AUTH] Initializing NextAuth with PrismaAdapter')

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  debug: true, // Always enable debug for now
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
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[AUTH] Credentials authorize called')
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          console.log('[AUTH] Credentials validation failed')
          return null
        }

        const { email, password } = parsed.data
        console.log('[AUTH] Looking up user:', email)

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            accounts: {
              where: { provider: 'credentials' },
            },
          },
        })

        if (!user) {
          console.log('[AUTH] User not found')
          return null
        }

        const credentialsAccount = user.accounts.find(
          (acc) => acc.provider === 'credentials'
        )

        if (!credentialsAccount?.access_token) {
          console.log('[AUTH] No credentials account found')
          return null
        }

        const isValidPassword = await bcrypt.compare(
          password,
          credentialsAccount.access_token
        )

        if (!isValidPassword) {
          console.log('[AUTH] Invalid password')
          return null
        }

        console.log('[AUTH] User authenticated successfully:', email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
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
