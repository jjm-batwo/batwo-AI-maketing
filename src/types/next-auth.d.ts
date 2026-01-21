import 'next-auth'
import { DefaultSession } from 'next-auth'
import { GlobalRole } from '@domain/value-objects/GlobalRole'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      provider?: string
      metaAccessToken?: string // Meta Ads API 호출용
      globalRole: GlobalRole // Admin 권한 관리용
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    globalRole?: GlobalRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    provider?: string
    metaAccessToken?: string // Meta Ads API 호출용
    globalRole?: GlobalRole // Admin 권한 관리용
  }
}
