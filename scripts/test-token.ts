import 'dotenv/config'

// Meta API 응답 타입 정의
interface MetaError {
  message: string
  type?: string
  code?: number
}

interface TokenDebugData {
  is_valid: boolean
  application: string
  scopes?: string[]
  expires_at: number
}

interface TokenDebugResponse {
  data?: TokenDebugData
  error?: MetaError
}

interface AdAccount {
  id: string
  name: string
  account_status: number
}

interface AdAccountsResponse {
  data?: AdAccount[]
  error?: MetaError
}

interface Campaign {
  id: string
  name: string
  status: string
}

interface CampaignsResponse {
  data?: Campaign[]
  error?: MetaError
}

const token = 'EAASoIP0CqaABQYYaZCdx2HIOWOg6faMu06eTov6FcQiwj66sdZBDpafA4C9zWB55rUfPyVU88iKeCfsZCHvjA8ZCGDVUfMPnBylUQjUruqHt9UoFOGD0YZBS0TA80R43ZAxORLaG4bPrND5HT3fZCGpzz69yBFtv8WZBKILpbjtDE9J8h2GPCytbMC0PZBrzUaEBtZClGzxxCTbXJNROC81umKeg0SNNrKX4LV3gZDZD'

async function main() {
  // 1. 토큰 검증
  const debugUrl = `https://graph.facebook.com/v25.0/debug_token?input_token=${token}&access_token=${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`
  const debugRes = await fetch(debugUrl)
  const debugData = await debugRes.json() as TokenDebugResponse

  console.log('=== 토큰 검증 ===')
  if (debugData.error) {
    console.log('❌ 오류:', debugData.error.message)
    return
  }

  console.log('✅ 유효:', debugData.data?.is_valid)
  console.log('앱:', debugData.data?.application)
  console.log('권한:', debugData.data?.scopes?.join(', '))
  const expiresAt = new Date((debugData.data?.expires_at ?? 0) * 1000)
  console.log('만료:', expiresAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }))

  // 2. 광고 계정 조회
  console.log('\n=== 광고 계정 조회 ===')
  const accountsRes = await fetch(`https://graph.facebook.com/v25.0/me/adaccounts?fields=id,name,account_status&access_token=${token}`)
  const accountsData = await accountsRes.json() as AdAccountsResponse

  if (accountsData.error) {
    console.log('❌ 오류:', accountsData.error.message)
    return
  }

  console.log('계정 수:', accountsData.data?.length || 0)
  const accounts = accountsData.data || []
  accounts.forEach((acc) => {
    console.log(`  - ${acc.id}: ${acc.name} (status: ${acc.account_status})`)
  })

  // 첫 번째 계정으로 테스트
  if (accounts.length > 0) {
    const accountId = accounts[0].id
    console.log(`\n=== ${accountId} 캠페인 조회 ===`)
    const campaignsRes = await fetch(`https://graph.facebook.com/v25.0/${accountId}/campaigns?fields=id,name,status&limit=10&access_token=${token}`)
    const campaignsData = await campaignsRes.json() as CampaignsResponse

    if (campaignsData.error) {
      console.log('❌ 오류:', campaignsData.error.message)
    } else {
      console.log('캠페인 수:', campaignsData.data?.length || 0)
      campaignsData.data?.slice(0,5).forEach((c) => console.log(`  - ${c.name} (${c.status})`))
    }
  }
}

main()
