import { describe, it, expect } from 'vitest'
import { createAskGuideQuestionTool } from '@application/tools/meta/askGuideQuestion.tool'

describe('askGuideQuestion tool', () => {
  const tool = createAskGuideQuestionTool()

  it('should have correct metadata', () => {
    expect(tool.name).toBe('askGuideQuestion')
    expect(tool.requiresConfirmation).toBe(false)
  })

  it('should return guide question data with progress', async () => {
    const params = {
      questionId: 'experience_level',
      question: 'Meta 광고 경험이 어느 정도이신가요?',
      options: [
        { value: 'BEGINNER', label: '처음이에요', description: 'Meta 광고를 처음 시작합니다' },
        { value: 'INTERMEDIATE', label: '몇 번 해봤어요', description: '기본적인 캠페인 운영 경험이 있습니다' },
        { value: 'ADVANCED', label: '전문가예요', description: '세부 설정을 직접 관리합니다' },
      ],
      currentStep: 1,
      totalSteps: 4,
    }

    const result = await tool.execute(params, {
      userId: 'test-user',
      accessToken: null,
      adAccountId: null,
      conversationId: 'test-conv',
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      questionId: 'experience_level',
      question: params.question,
      options: params.options,
      progress: { current: 1, total: 4 },
    })
    expect(result.formattedMessage).toContain('Meta 광고 경험이 어느 정도이신가요?')
  })

  it('should format options in message', async () => {
    const params = {
      questionId: 'industry',
      question: '어떤 업종의 상품/서비스를 광고하시나요?',
      options: [
        { value: 'fashion', label: '패션/의류' },
        { value: 'beauty', label: '뷰티/화장품' },
      ],
      currentStep: 2,
      totalSteps: 4,
    }

    const result = await tool.execute(params, {
      userId: 'test-user',
      accessToken: null,
      adAccountId: null,
      conversationId: 'test-conv',
    })

    expect(result.formattedMessage).toContain('패션/의류')
    expect(result.formattedMessage).toContain('뷰티/화장품')
  })
})
