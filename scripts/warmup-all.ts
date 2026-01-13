import 'dotenv/config'
import { MetaAdsWarmupClient } from '../src/infrastructure/external/meta-ads/MetaAdsWarmupClient'

const token = 'EAASoIP0CqaABQRCr3yM8NjJfhNiyE4VuJX2WACWZA4AhI1Qrvr5y3ovprmdT8mvjoZB7JXfYdAyhc1jezlZBhD8OKESP8kqhQxmyjU4dr7TmTk11WMEgXTLLIVq4PL6QSewgvNGiZB1mZBP882m5WMDwQRyW2Iki4bvEpqHTAKNDvDvZCeibIYfPadOiknRZBoN'

// Batwocompany 계정만
const accounts = [
  { id: 'act_517762859391394', name: 'Batwocompany' },
]

async function main() {
  const warmupClient = new MetaAdsWarmupClient()

  let totalSuccess = 0
  let totalFailed = 0
  let totalCalls = 0

  console.log('=== Meta Ads API Warmup - 전체 계정 ===\n')

  for (const account of accounts) {
    console.log(`\n🚀 ${account.name} (${account.id}) Warmup 시작...`)

    try {
      const summary = await warmupClient.runWarmupSequence(token, account.id, {
        maxCampaigns: 5,
        maxAdSets: 3,
        maxAds: 3,
      })

      console.log(`✅ ${account.name}: ${summary.successfulCalls}/${summary.totalCalls} 성공 (${summary.durationMs}ms)`)

      totalSuccess += summary.successfulCalls
      totalFailed += summary.failedCalls
      totalCalls += summary.totalCalls
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`❌ ${account.name} 실패: ${errorMessage}`)
    }
  }

  console.log('\n=== 전체 결과 ===')
  console.log(`총 API 호출: ${totalCalls}`)
  console.log(`성공: ${totalSuccess}`)
  console.log(`실패: ${totalFailed}`)
  console.log(`성공률: ${totalCalls > 0 ? Math.round((totalSuccess / totalCalls) * 100) : 0}%`)
}

main().catch(console.error)
