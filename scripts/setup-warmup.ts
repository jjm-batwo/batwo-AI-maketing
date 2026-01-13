import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { MetaAdsWarmupClient } from '../src/infrastructure/external/meta-ads/MetaAdsWarmupClient'

const token = 'EAASoIP0CqaABQYYaZCdx2HIOWOg6faMu06eTov6FcQiwj66sdZBDpafA4C9zWB55rUfPyVU88iKeCfsZCHvjA8ZCGDVUfMPnBylUQjUruqHt9UoFOGD0YZBS0TA80R43ZAxORLaG4bPrND5HT3fZCGpzz69yBFtv8WZBKILpbjtDE9J8h2GPCytbMC0PZBrzUaEBtZClGzxxCTbXJNROC81umKeg0SNNrKX4LV3gZDZD'
const accountId = 'act_517762859391394'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    // 1. DB에 계정 추가
    console.log('📦 DB에 계정 추가 중...')
    
    let user = await prisma.user.findFirst()
    if (!user) {
      console.log('  → 테스트 사용자 생성')
      user = await prisma.user.create({
        data: { email: 'warmup@test.com', name: 'Warmup Test User' }
      })
    }
    
    // 기존 계정 확인 후 삭제/재생성
    const existing = await prisma.metaAdAccount.findFirst({ 
      where: { metaAccountId: accountId } 
    })
    
    if (existing) {
      await prisma.metaAdAccount.delete({ where: { id: existing.id } })
      console.log('  → 기존 계정 삭제')
    }
    
    const account = await prisma.metaAdAccount.create({
      data: {
        userId: user.id,
        metaAccountId: accountId,
        businessName: 'Batwocompany',
        accessToken: token,
        tokenExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000),
      }
    })
    console.log('✅ 계정 추가 완료:', account.metaAccountId)

    // 2. Warmup 실행
    console.log('\n🚀 Warmup 실행 중...')
    const warmupClient = new MetaAdsWarmupClient()
    const summary = await warmupClient.runWarmupSequence(token, accountId, {
      maxCampaigns: 5,
      maxAdSets: 3,
      maxAds: 3,
    })

    console.log('\n=== WARMUP 결과 ===')
    console.log(`✅ 성공: ${summary.successfulCalls}/${summary.totalCalls} 호출`)
    console.log(`❌ 실패: ${summary.failedCalls}`)
    console.log(`⏱️  소요시간: ${summary.durationMs}ms`)

  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
