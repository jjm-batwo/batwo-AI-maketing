#!/usr/bin/env tsx
/**
 * Meta Ads API Warmup Script
 *
 * Meta 앱 검수를 위한 API 호출량 증가 스크립트
 *
 * 사용법:
 *   npm run warmup:once    # 1회 실행
 *   npm run warmup:start   # 1시간마다 반복 실행
 */

import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { MetaAdsWarmupClient, WarmupSummary } from '../src/infrastructure/external/meta-ads/MetaAdsWarmupClient'
import { safeDecryptToken } from '../src/application/utils/TokenEncryption'

// ANSI 색상 코드
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
  const timestamp = new Date().toISOString()
  const colorCode = color ? colors[color] : ''
  console.log(`${colorCode}[${timestamp}] ${message}${colors.reset}`)
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green')
}

function logError(message: string) {
  log(`❌ ${message}`, 'red')
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue')
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow')
}

// Prisma 클라이언트 생성
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

interface AccountResult {
  accountId: string
  businessName: string | null
  success: boolean
  summary?: WarmupSummary
  error?: string
}

async function runWarmup(prisma: PrismaClient): Promise<AccountResult[]> {
  logInfo('Starting Meta Ads API warmup...')

  // 특정 계정만 웜업 (환경 변수로 제한)
  const targetAccountId = process.env.WARMUP_ACCOUNT_ID

  // 유효한 계정 조회 (토큰 만료되지 않은)
  const accounts = await prisma.metaAdAccount.findMany({
    where: {
      OR: [
        { tokenExpiry: null },
        { tokenExpiry: { gt: new Date() } },
      ],
      // 특정 계정만 필터링
      ...(targetAccountId && { metaAccountId: targetAccountId }),
    },
  })

  if (targetAccountId) {
    logInfo(`Targeting specific account: ${targetAccountId}`)
  }

  if (accounts.length === 0) {
    logWarning('No valid Meta Ad accounts found')
    return []
  }

  logInfo(`Found ${accounts.length} valid account(s)`)

  const results: AccountResult[] = []
  const warmupClient = new MetaAdsWarmupClient()

  for (const account of accounts) {
    logInfo(`Processing account: ${account.metaAccountId} (${account.businessName || 'Unknown'})`)

    try {
      const summary = await warmupClient.runWarmupSequence(
        safeDecryptToken(account.accessToken),
        account.metaAccountId,
        {
          maxCampaigns: 5,
          maxAdSets: 3,
          maxAds: 3,
        }
      )

      results.push({
        accountId: account.metaAccountId,
        businessName: account.businessName,
        success: true,
        summary,
      })

      logSuccess(
        `Account ${account.metaAccountId}: ${summary.successfulCalls}/${summary.totalCalls} calls successful (${summary.durationMs}ms)`
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      results.push({
        accountId: account.metaAccountId,
        businessName: account.businessName,
        success: false,
        error: errorMessage,
      })

      logError(`Account ${account.metaAccountId} failed: ${errorMessage}`)
    }
  }

  return results
}

function printSummary(results: AccountResult[]) {
  console.log('\n' + '='.repeat(60))
  logInfo('WARMUP SUMMARY')
  console.log('='.repeat(60))

  const totalAccounts = results.length
  const successfulAccounts = results.filter(r => r.success).length
  const totalCalls = results.reduce((sum, r) => sum + (r.summary?.totalCalls || 0), 0)
  const successfulCalls = results.reduce((sum, r) => sum + (r.summary?.successfulCalls || 0), 0)

  console.log(`
📊 Accounts Processed: ${successfulAccounts}/${totalAccounts}
📞 Total API Calls:    ${successfulCalls}/${totalCalls}
⏱️  Executed At:        ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
`)

  if (results.some(r => !r.success)) {
    logWarning('Failed accounts:')
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.accountId}: ${r.error}`))
  }

  console.log('='.repeat(60) + '\n')
}

async function main() {
  const args = process.argv.slice(2)
  const isLoop = args.includes('--loop') || args.includes('-l')
  const intervalMinutes = parseInt(args.find(a => a.startsWith('--interval='))?.split('=')[1] || '60', 10)

  log(`${colors.bright}Meta Ads API Warmup Script${colors.reset}`, 'cyan')
  console.log('')

  const prisma = createPrismaClient()

  try {
    if (isLoop) {
      logInfo(`Loop mode enabled: Running every ${intervalMinutes} minutes`)
      logInfo('Press Ctrl+C to stop')
      console.log('')

      // 즉시 1회 실행
      const results = await runWarmup(prisma)
      printSummary(results)

      // 반복 실행
      const intervalMs = intervalMinutes * 60 * 1000
      setInterval(async () => {
        try {
          const results = await runWarmup(prisma)
          printSummary(results)
        } catch (error) {
          logError(`Warmup cycle failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }, intervalMs)

      // 프로세스 유지
      process.on('SIGINT', async () => {
        logInfo('Shutting down...')
        await prisma.$disconnect()
        process.exit(0)
      })
    } else {
      // 1회 실행
      const results = await runWarmup(prisma)
      printSummary(results)
      await prisma.$disconnect()

      // 실패한 계정이 있으면 exit code 1
      if (results.some(r => !r.success)) {
        process.exit(1)
      }
    }
  } catch (error) {
    logError(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    await prisma.$disconnect()
    process.exit(1)
  }
}

main()
