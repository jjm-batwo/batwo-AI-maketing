import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import Facebook from 'next-auth/providers/facebook'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'

// Meta Ads API에 필요한 권한 스코프
const META_ADS_SCOPES = [
  'email',
  'public_profile',
  'ads_management',        // 캠페인 생성/수정
  'ads_read',              // 광고 데이터 읽기
  'business_management',   // 비즈니스 계정 관리
  'pages_read_engagement', // 페이지 참여도 읽기
].join(',')

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
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
          scope: META_ADS_SCOPES,
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
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            accounts: {
              where: { provider: 'credentials' },
            },
          },
        })

        if (!user) {
          return null
        }

        // Get password from credentials account
        const credentialsAccount = user.accounts.find(
          (acc) => acc.provider === 'credentials'
        )

        if (!credentialsAccount?.access_token) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          password,
          credentialsAccount.access_token
        )

        if (!isValidPassword) {
          return null
        }

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
      if (isNewUser && user.id) {
        // Log new user creation
        console.log(`New user created: ${user.email}`)
      }
    },
  },
})
