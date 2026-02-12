import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers'
import Google from 'next-auth/providers/google'
import Kakao from 'next-auth/providers/kakao'
import { prisma } from '@/lib/prisma'
import { authConfig } from './auth.config'

// Meta 로그인용 기본 권한 (앱 검수 불필요)
// 고급 권한(ads_management 등)은 /settings/meta-connect에서 별도 OAuth로 요청
// 개발 모드에서는 email scope가 테스트 사용자에게만 허용되므로 환경에 따라 분기
const getMetaLoginScopes = () => {
  // In development mode without test user setup, email might not be available
  // public_profile is always available
  const baseScopes = 'public_profile'

  // email requires app review in production or test user in development
  // We request it but handle gracefully if denied
  return process.env.NODE_ENV === 'development'
    ? baseScopes  // Minimal scope for guaranteed dev login
    : 'email,public_profile'  // Full scope for production
}

const META_LOGIN_SCOPES = getMetaLoginScopes()

// Facebook Login for Business custom provider
interface FacebookBusinessProfile {
  id: string
  name: string
  email?: string
  picture?: {
    data: {
      url: string
    }
  }
}

function FacebookLoginForBusiness<P extends FacebookBusinessProfile>(
  options: OAuthUserConfig<P> & { configId: string }
): OAuthConfig<P> {
  return {
    id: 'facebook',
    name: 'Facebook',
    type: 'oauth',
    checks: ['state'], // Only use state, no PKCE
    authorization: {
      url: 'https://www.facebook.com/v19.0/dialog/oauth',
      params: {
        scope: options.authorization?.params?.scope || 'public_profile',
        config_id: options.configId,
      },
    },
    token: {
      url: 'https://graph.facebook.com/v19.0/oauth/access_token',
      params: {
        config_id: options.configId,
      },
    },
    userinfo: {
      url: 'https://graph.facebook.com/v19.0/me',
      params: {
        fields: 'id,name,email,picture',
      },
    },
    profile(profile: P) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email ?? '',
        image: profile.picture?.data?.url ?? null,
      }
    },
    style: {
      bg: '#1877F2',
      text: '#fff',
    },
    options,
  }
}

// Database adapter can be disabled via SKIP_DATABASE_ADAPTER=true env variable
// Useful for development/testing when database is temporarily unavailable
const USE_DATABASE_ADAPTER = process.env.SKIP_DATABASE_ADAPTER !== 'true'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  // Only use adapter if database is available
  ...(USE_DATABASE_ADAPTER ? { adapter: PrismaAdapter(prisma) } : {}),
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
      // NOTE: allowDangerousEmailAccountLinking은 동일 이메일 기반 계정 자동 연결 허용
      // 사업자가 Google/Kakao/Meta 중 어떤 것으로든 로그인 가능하게 하기 위해 의도적 설정
      // 위험: 이메일을 제어하는 공격자가 계정 탈취 가능 → 프로덕션에서 이메일 검증 필수
      allowDangerousEmailAccountLinking: true,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID ?? '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? '',
      // NOTE: allowDangerousEmailAccountLinking은 동일 이메일 기반 계정 자동 연결 허용
      // 사업자가 Google/Kakao/Meta 중 어떤 것으로든 로그인 가능하게 하기 위해 의도적 설정
      // 위험: 이메일을 제어하는 공격자가 계정 탈취 가능 → 프로덕션에서 이메일 검증 필수
      allowDangerousEmailAccountLinking: true,
    }),
    FacebookLoginForBusiness({
      clientId: process.env.META_APP_ID ?? '',
      clientSecret: process.env.META_APP_SECRET ?? '',
      configId: '952879907276831',
      // NOTE: allowDangerousEmailAccountLinking은 동일 이메일 기반 계정 자동 연결 허용
      // 사업자가 Google/Kakao/Meta 중 어떤 것으로든 로그인 가능하게 하기 위해 의도적 설정
      // 위험: 이메일을 제어하는 공격자가 계정 탈취 가능 → 프로덕션에서 이메일 검증 필수
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
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH EVENT] signIn:', {
          userId: user?.id,
          provider: account?.provider,
          isNewUser,
        })
      }
    },
    async createUser({ user }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH EVENT] createUser:', user?.id)
      }
    },
    async linkAccount({ user, account }) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[AUTH EVENT] linkAccount:', {
          userId: user?.id,
          provider: account?.provider,
        })
      }
    },
  },
})
