import { describe, it, expect } from 'vitest'
import { createRecommendCampaignSettingsTool } from '@application/tools/meta/recommendCampaignSettings.tool'

describe('recommendCampaignSettings tool', () => {
  const tool = createRecommendCampaignSettingsTool()

  it('should have correct metadata', () => {
    expect(tool.name).toBe('recommendCampaignSettings')
    expect(tool.requiresConfirmation).toBe(false)
  })

  it('should recommend ADVANTAGE_PLUS for beginners', async () => {
    const result = await tool.execute(
      {
        experienceLevel: 'BEGINNER',
        industry: '패션/의류',
        objective: 'sales',
        dailyBudgetRange: '10000-50000',
        reasoning: '초보자에게 Advantage+가 적합합니다',
      },
      { userId: 'u1', accessToken: null, adAccountId: null, conversationId: 'c1' }
    )

    expect(result.success).toBe(true)
    expect(result.data.campaignMode).toBe('ADVANTAGE_PLUS')
    expect(result.data.experienceLevel).toBe('BEGINNER')
    expect(result.data.formData.objective).toBe('CONVERSIONS')
    expect(result.data.formData.dailyBudget).toBe(30000) // 중간값
  })

  it('should recommend ADVANTAGE_PLUS for intermediate users', async () => {
    const result = await tool.execute(
      {
        experienceLevel: 'INTERMEDIATE',
        industry: '뷰티/화장품',
        objective: 'awareness',
        dailyBudgetRange: '50000-200000',
        reasoning: '중급자도 Advantage+로 시작하면 좋습니다',
      },
      { userId: 'u1', accessToken: null, adAccountId: null, conversationId: 'c1' }
    )

    expect(result.data.campaignMode).toBe('ADVANTAGE_PLUS')
    expect(result.data.formData.objective).toBe('BRAND_AWARENESS')
    expect(result.data.formData.dailyBudget).toBe(125000)
  })

  it('should recommend MANUAL for advanced users', async () => {
    const result = await tool.execute(
      {
        experienceLevel: 'ADVANCED',
        industry: '가전/디지털',
        objective: 'traffic',
        dailyBudgetRange: '200000-999999',
        reasoning: '전문가는 수동 모드로 세부 설정 가능',
      },
      { userId: 'u1', accessToken: null, adAccountId: null, conversationId: 'c1' }
    )

    expect(result.data.campaignMode).toBe('MANUAL')
    expect(result.data.formData.objective).toBe('TRAFFIC')
  })

  it('should map engagement objective correctly', async () => {
    const result = await tool.execute(
      {
        experienceLevel: 'BEGINNER',
        industry: '식품/건강',
        objective: 'engagement',
        dailyBudgetRange: '1-10000',
        reasoning: 'SNS 참여 목표',
      },
      { userId: 'u1', accessToken: null, adAccountId: null, conversationId: 'c1' }
    )

    expect(result.data.formData.objective).toBe('ENGAGEMENT')
    expect(result.data.formData.dailyBudget).toBe(5001) // (1+10000)/2 = 5000.5 → 반올림 5001
  })

  it('should include reasoning in result', async () => {
    const result = await tool.execute(
      {
        experienceLevel: 'BEGINNER',
        industry: '패션/의류',
        objective: 'sales',
        dailyBudgetRange: '10000-50000',
        reasoning: '초보자에게는 Advantage+ 캠페인이 최적입니다',
      },
      { userId: 'u1', accessToken: null, adAccountId: null, conversationId: 'c1' }
    )

    expect(result.data.reasoning).toBe('초보자에게는 Advantage+ 캠페인이 최적입니다')
  })
})
