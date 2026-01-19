import 'dotenv/config'
import { MetaAdsWarmupClient } from '../src/infrastructure/external/meta-ads/MetaAdsWarmupClient'

const token = 'EAASoIP0CqaABQcYGZBaRCaXSQ9EnIYRrp83PUgquIw1p1ji6qzNRX8FfFxwHTZClMZAoagttJXiqhtWJb1LDMnh8J4VCSRWREfcI3RBjXaU6ZB7nm7aNm2810RcQ21hjzoVTHn5amok4O3f6wqCW6pzP6ZC8pz18AVZC5pK5Khg8NDpnJW1ClT7MVGqJPxcRJd'
const accountId = 'act_517762859391394'

const TARGET_CALLS = 1500
const STARTING_CALLS = 91  // warmup-all.ts 성공 호출 수

async function main() {
  const warmupClient = new MetaAdsWarmupClient()

  let totalCalls = STARTING_CALLS
  let round = 1

  console.log('=== Meta Ads API Warmup Loop ===')
  console.log(`목표: ${TARGET_CALLS}회 / 현재: ${totalCalls}회`)
  console.log(`부족: ${TARGET_CALLS - totalCalls}회\n`)

  while (totalCalls < TARGET_CALLS) {
    console.log(`\n🔄 Round ${round} 시작... (현재: ${totalCalls}/${TARGET_CALLS})`)

    try {
      const summary = await warmupClient.runWarmupSequence(token, accountId, {
        maxCampaigns: 5,
        maxAdSets: 3,
        maxAds: 3,
      })

      totalCalls += summary.successfulCalls
      console.log(`✅ Round ${round}: +${summary.successfulCalls}회 (누적: ${totalCalls}/${TARGET_CALLS})`)

      // 짧은 딜레이 (rate limit 방지)
      if (totalCalls < TARGET_CALLS) {
        console.log('⏳ 5초 대기...')
        await new Promise(resolve => setTimeout(resolve, 5000))
      }

      round++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`❌ Round ${round} 실패: ${errorMessage}`)
      console.log('⏳ 10초 후 재시도...')
      await new Promise(resolve => setTimeout(resolve, 10000))
    }
  }

  console.log('\n=== 완료 ===')
  console.log(`🎉 목표 달성! 총 ${totalCalls}회 API 호출 완료`)
  console.log(`✅ Meta 앱 검수 기준 충족 (1,500회 이상)`)
}

main().catch(console.error)
