#!/usr/bin/env tsx
/**
 * Meta Access Token Exchange Script
 *
 * Short-lived 토큰을 Long-lived 토큰(60일)으로 교환
 *
 * 사용법:
 *   npm run token:exchange -- --token=<SHORT_LIVED_TOKEN>
 *   npm run token:exchange -- --token=<SHORT_LIVED_TOKEN> --update-db
 */

import 'dotenv/config'
import { encryptToken } from '../src/application/utils/TokenEncryption'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color?: keyof typeof colors) {
  const colorCode = color ? colors[color] : ''
  console.log(`${colorCode}${message}${colors.reset}`)
}

interface TokenExchangeResponse {
  access_token: string
  token_type: string
  expires_in?: number // seconds
}

interface TokenDebugResponse {
  data: {
    app_id: string
    type: string
    application: string
    data_access_expires_at: number
    expires_at: number
    is_valid: boolean
    scopes: string[]
    user_id: string
  }
}

async function debugToken(accessToken: string): Promise<TokenDebugResponse | null> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) {
    log('❌ META_APP_ID 또는 META_APP_SECRET이 설정되지 않았습니다.', 'red')
    return null
  }

  const url = `https://graph.facebook.com/v25.0/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      log(`❌ 토큰 검증 실패: ${data.error.message}`, 'red')
      return null
    }

    return data as TokenDebugResponse
  } catch (error) {
    log(`❌ 토큰 검증 요청 실패: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red')
    return null
  }
}

async function exchangeToken(shortLivedToken: string): Promise<TokenExchangeResponse | null> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) {
    log('❌ META_APP_ID 또는 META_APP_SECRET이 설정되지 않았습니다.', 'red')
    return null
  }

  const url = new URL('https://graph.facebook.com/v25.0/oauth/access_token')
  url.searchParams.set('grant_type', 'fb_exchange_token')
  url.searchParams.set('client_id', appId)
  url.searchParams.set('client_secret', appSecret)
  url.searchParams.set('fb_exchange_token', shortLivedToken)

  try {
    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.error) {
      log(`❌ 토큰 교환 실패: ${data.error.message}`, 'red')
      return null
    }

    return data as TokenExchangeResponse
  } catch (error) {
    log(`❌ 토큰 교환 요청 실패: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red')
    return null
  }
}

async function updateDatabase(accessToken: string, expiresIn: number) {
  const { PrismaClient } = await import('../src/generated/prisma')
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const { Pool } = await import('pg')

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const targetAccountId = process.env.WARMUP_ACCOUNT_ID

  const tokenExpiry = new Date(Date.now() + expiresIn * 1000)

  const result = await prisma.metaAdAccount.updateMany({
    where: targetAccountId ? { metaAccountId: targetAccountId } : {},
    data: {
      accessToken: encryptToken(accessToken),
      tokenExpiry,
    },
  })

  await prisma.$disconnect()

  return result.count
}

async function main() {
  const args = process.argv.slice(2)
  const tokenArg = args.find(a => a.startsWith('--token='))
  const updateDb = args.includes('--update-db')

  log(`${colors.bright}Meta Access Token Exchange Tool${colors.reset}`, 'cyan')
  console.log('')

  if (!tokenArg) {
    log('사용법:', 'blue')
    console.log('  npm run token:exchange -- --token=<SHORT_LIVED_TOKEN>')
    console.log('  npm run token:exchange -- --token=<SHORT_LIVED_TOKEN> --update-db')
    console.log('')
    log('옵션:', 'blue')
    console.log('  --token=<TOKEN>  교환할 Short-lived 토큰')
    console.log('  --update-db      DB의 토큰 자동 업데이트')
    process.exit(1)
  }

  const shortLivedToken = tokenArg.split('=')[1]

  // 1. 현재 토큰 정보 확인
  log('📋 현재 토큰 정보 확인 중...', 'blue')
  const debugInfo = await debugToken(shortLivedToken)

  if (debugInfo) {
    const expiresAt = new Date(debugInfo.data.expires_at * 1000)
    const isExpired = debugInfo.data.expires_at < Date.now() / 1000

    console.log('')
    log('현재 토큰 상태:', 'cyan')
    console.log(`  앱: ${debugInfo.data.application}`)
    console.log(`  유효: ${debugInfo.data.is_valid ? '✅ 유효' : '❌ 만료'}`)
    console.log(`  만료 시간: ${isExpired ? '이미 만료됨' : expiresAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`)
    console.log(`  권한: ${debugInfo.data.scopes.join(', ')}`)
    console.log('')
  }

  // 2. Long-lived 토큰으로 교환
  log('🔄 Long-lived 토큰으로 교환 중...', 'blue')
  const exchangeResult = await exchangeToken(shortLivedToken)

  if (!exchangeResult) {
    process.exit(1)
  }

  const expiresInDays = exchangeResult.expires_in
    ? Math.round(exchangeResult.expires_in / 86400)
    : 60

  const expiryDate = exchangeResult.expires_in
    ? new Date(Date.now() + exchangeResult.expires_in * 1000)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60일 기본값

  console.log('')
  log('✅ Long-lived 토큰 발급 성공!', 'green')
  console.log('')
  console.log('='.repeat(60))
  log('새 토큰 정보:', 'cyan')
  console.log('='.repeat(60))
  console.log(`유효 기간: ${expiresInDays}일`)
  console.log(`만료 예정: ${expiryDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`)
  console.log('')
  log('Access Token:', 'yellow')
  console.log(exchangeResult.access_token)
  console.log('='.repeat(60))

  // 3. DB 업데이트 (옵션)
  if (updateDb) {
    console.log('')
    log('💾 데이터베이스 업데이트 중...', 'blue')

    try {
      const updatedCount = await updateDatabase(
        exchangeResult.access_token,
        exchangeResult.expires_in || 60 * 24 * 60 * 60
      )
      log(`✅ ${updatedCount}개 계정 토큰 업데이트 완료`, 'green')
    } catch (error) {
      log(`❌ DB 업데이트 실패: ${error instanceof Error ? error.message : 'Unknown error'}`, 'red')
    }
  } else {
    console.log('')
    log('💡 DB에 자동 저장하려면 --update-db 옵션을 추가하세요', 'yellow')
  }
}

main()
