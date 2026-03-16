/**
 * Test 2.1: Intent Classification - Two-stage behavior tests
 *
 * TDD RED Phase — All tests should FAIL because:
 * - IntentClassifier domain service does not exist yet
 * - ChatIntent value object does not exist yet
 * - IntentClassificationResult value object does not exist yet
 *
 * These tests define the expected behavior of the two-stage
 * intent classification system:
 *   Stage 1: Keyword-based classification (fast path, synchronous)
 *   Stage 2: LLM fallback classification (when keywords don't match)
 *
 * @see docs/plans/PLAN_ai-chatbot-enhancement.md - Phase 2, Test 2.1
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { IntentClassifier } from '@domain/services/IntentClassifier'
import { ChatIntent } from '@domain/value-objects/ChatIntent'
import { IntentClassificationResult } from '@domain/value-objects/IntentClassificationResult'
import { DEFAULT_INTENT_CLASSIFIER_CONFIG } from '@domain/services/IntentClassifierConfig'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const KEYWORD_MESSAGES = {
  campaignCreation: {
    ko: '새 캠페인을 만들고 싶어요',
    en: 'I want to create a new campaign',
  },
  reportQuery: {
    ko: '지난주 리포트 보여줘',
    en: 'Show me last week report',
  },
  kpiAnalysis: {
    ko: 'ROAS 성과 분석해줘',
    en: 'Analyze my ROAS performance',
  },
  pixelSetup: {
    ko: '픽셀 설치를 도와줘',
    en: 'Help me install pixel',
  },
  budgetOptimization: {
    ko: '예산 최적화 해줘',
    en: 'Optimize my ad budget',
  },
} as const

const AMBIGUOUS_MESSAGES = {
  vague: '어떻게 하면 될까요?',
  greeting: '안녕하세요',
  offTopic: '오늘 날씨가 어때요?',
  complex: '캠페인 성과를 보고 예산을 조정하고 싶어요',
} as const

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('IntentClassifier', () => {
  let classifier: IntentClassifier

  beforeEach(() => {
    classifier = IntentClassifier.create()
  })

  // =========================================================================
  // 1. Keyword-based classification (fast path)
  // =========================================================================
  describe('classify() — keyword-based (Stage 1)', () => {
    it('should classify campaign creation intent from Korean keywords', () => {
      const result = classifier.classify(KEYWORD_MESSAGES.campaignCreation.ko)

      expect(result).toBeInstanceOf(IntentClassificationResult)
      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
      expect(result.method).toBe('KEYWORD')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('should classify campaign creation intent from English keywords', () => {
      const result = classifier.classify(KEYWORD_MESSAGES.campaignCreation.en)

      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
      expect(result.method).toBe('KEYWORD')
    })

    it('should classify report query intent', () => {
      const result = classifier.classify(KEYWORD_MESSAGES.reportQuery.ko)

      expect(result.intent).toBe(ChatIntent.REPORT_QUERY)
      expect(result.method).toBe('KEYWORD')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('should classify KPI analysis intent', () => {
      const result = classifier.classify(KEYWORD_MESSAGES.kpiAnalysis.ko)

      expect(result.intent).toBe(ChatIntent.KPI_ANALYSIS)
      expect(result.method).toBe('KEYWORD')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('should classify pixel setup intent', () => {
      const result = classifier.classify(KEYWORD_MESSAGES.pixelSetup.ko)

      expect(result.intent).toBe(ChatIntent.PIXEL_SETUP)
      expect(result.method).toBe('KEYWORD')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('should classify budget optimization intent', () => {
      const result = classifier.classify(KEYWORD_MESSAGES.budgetOptimization.ko)

      expect(result.intent).toBe(ChatIntent.BUDGET_OPTIMIZATION)
      expect(result.method).toBe('KEYWORD')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('should return high confidence for exact keyword matches', () => {
      const result = classifier.classify('캠페인 생성')

      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
    })

    it('should be case-insensitive for English keywords', () => {
      const result = classifier.classify('CREATE A NEW CAMPAIGN')

      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
      expect(result.method).toBe('KEYWORD')
    })

    it('should handle messages with extra whitespace', () => {
      const result = classifier.classify('  캠페인   만들기  ')

      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
    })
  })

  // =========================================================================
  // 2. LLM fallback classification (Stage 2)
  // =========================================================================
  describe('classify() — LLM fallback (Stage 2)', () => {
    it('should fall back to LLM when no keywords match', () => {
      const result = classifier.classify('매출을 올리려면 어떤 전략이 좋을까요?')

      expect(result.method).toBe('LLM')
      expect(result.intent).not.toBe(ChatIntent.GENERAL)
    })

    it('should use LLM for nuanced intent detection', () => {
      const result = classifier.classify('지난 달 대비 이번 달 광고 효율이 어떤가요?')

      expect(result.method).toBe('LLM')
      expect(result.intent).toBe(ChatIntent.KPI_ANALYSIS)
    })

    it('should use LLM for complex multi-intent messages', () => {
      const result = classifier.classify(AMBIGUOUS_MESSAGES.complex)

      expect(result.method).toBe('LLM')
      // Complex message should resolve to the primary intent
      expect([ChatIntent.REPORT_QUERY, ChatIntent.BUDGET_OPTIMIZATION]).toContain(result.intent)
    })

    it('should return lower confidence for LLM classifications', () => {
      const keywordResult = classifier.classify(KEYWORD_MESSAGES.reportQuery.ko)
      const llmResult = classifier.classify('광고 데이터를 좀 살펴봐 주세요')

      // LLM results should generally have lower confidence than keyword matches
      expect(llmResult.confidence).toBeLessThanOrEqual(keywordResult.confidence)
    })
  })

  // =========================================================================
  // 3. Confidence threshold behavior
  // =========================================================================
  describe('confidence threshold', () => {
    it('should return confidence between 0 and 1', () => {
      const result = classifier.classify(KEYWORD_MESSAGES.campaignCreation.ko)

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it('should classify as GENERAL when confidence is below threshold', () => {
      // Gibberish message should produce very low confidence
      const result = classifier.classify('asdfjkl;qwerty zxcvbnm')

      expect(result.intent).toBe(ChatIntent.GENERAL)
      expect(result.confidence).toBeLessThan(0.3)
    })

    it('should have HIGH confidence (≥0.8) for direct keyword hits', () => {
      const result = classifier.classify('리포트 조회')

      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })

    it('should have MEDIUM confidence (0.5–0.8) for partial keyword matches', () => {
      const result = classifier.classify('성과 좀 알려줘')

      expect(result.confidence).toBeGreaterThanOrEqual(0.5)
      expect(result.confidence).toBeLessThan(0.8)
    })

    it('should expose confidence thresholds as static constants', () => {
      expect(IntentClassifier.CONFIDENCE_HIGH).toBe(0.8)
      expect(IntentClassifier.CONFIDENCE_MEDIUM).toBe(0.5)
      expect(IntentClassifier.CONFIDENCE_LOW).toBe(0.3)
    })
  })

  // =========================================================================
  // 4. Unknown intent handling
  // =========================================================================
  describe('unknown intent handling', () => {
    it('should return GENERAL for greeting messages', () => {
      const result = classifier.classify(AMBIGUOUS_MESSAGES.greeting)

      expect(result.intent).toBe(ChatIntent.GENERAL)
    })

    it('should return GENERAL for off-topic messages', () => {
      const result = classifier.classify(AMBIGUOUS_MESSAGES.offTopic)

      expect(result.intent).toBe(ChatIntent.GENERAL)
    })

    it('should return GENERAL for empty-ish input', () => {
      const result = classifier.classify('   ')

      expect(result.intent).toBe(ChatIntent.GENERAL)
      expect(result.confidence).toBe(0)
    })

    it('should throw for truly empty string input', () => {
      expect(() => classifier.classify('')).toThrow()
    })

    it('should return GENERAL for vague questions', () => {
      const result = classifier.classify(AMBIGUOUS_MESSAGES.vague)

      expect(result.intent).toBe(ChatIntent.GENERAL)
    })

    it('should include the original input in the result', () => {
      const message = '안녕하세요'
      const result = classifier.classify(message)

      expect(result.originalInput).toBe(message)
    })
  })

  // =========================================================================
  // 5. Korean language support
  // =========================================================================
  describe('Korean language support', () => {
    it('should handle Korean campaign-related terms', () => {
      const koreanVariants = [
        '캠페인 만들기',
        '광고 캠페인 생성',
        '새로운 캠페인 시작',
        '캠페인을 새로 만들어줘',
      ]

      for (const message of koreanVariants) {
        const result = classifier.classify(message)
        expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
      }
    })

    it('should handle Korean report-related terms', () => {
      const koreanVariants = ['보고서 확인', '리포트 보기', '주간 보고서', '실적 보고서 보여줘']

      for (const message of koreanVariants) {
        const result = classifier.classify(message)
        expect(result.intent).toBe(ChatIntent.REPORT_QUERY)
      }
    })

    it('should handle Korean KPI-related terms', () => {
      const koreanVariants = ['ROAS 분석', 'CPC 확인', '성과 지표 분석', '전환율 분석해줘']

      for (const message of koreanVariants) {
        const result = classifier.classify(message)
        expect(result.intent).toBe(ChatIntent.KPI_ANALYSIS)
      }
    })

    it('should handle Korean pixel-related terms', () => {
      const koreanVariants = ['메타 픽셀 설치', '페이스북 픽셀 설정', '픽셀 코드 설치해줘']

      for (const message of koreanVariants) {
        const result = classifier.classify(message)
        expect(result.intent).toBe(ChatIntent.PIXEL_SETUP)
      }
    })

    it('should handle Korean polite endings (-요, -습니다)', () => {
      const politeVariants = [
        '캠페인을 만들고 싶습니다',
        '리포트를 보고 싶어요',
        '성과를 분석해 주세요',
      ]

      const expectedIntents = [
        ChatIntent.CAMPAIGN_CREATION,
        ChatIntent.REPORT_QUERY,
        ChatIntent.KPI_ANALYSIS,
      ]

      politeVariants.forEach((message, i) => {
        const result = classifier.classify(message)
        expect(result.intent).toBe(expectedIntents[i])
      })
    })

    it('should handle Korean informal/casual style', () => {
      const casualVariants = ['캠페인 만들어줘', '리포트 보여줘', '성과 분석해줘']

      const expectedIntents = [
        ChatIntent.CAMPAIGN_CREATION,
        ChatIntent.REPORT_QUERY,
        ChatIntent.KPI_ANALYSIS,
      ]

      casualVariants.forEach((message, i) => {
        const result = classifier.classify(message)
        expect(result.intent).toBe(expectedIntents[i])
      })
    })

    it('should handle mixed Korean-English messages', () => {
      const result = classifier.classify('Facebook 캠페인 새로 만들어줘')

      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
    })
  })

  // =========================================================================
  // 6. IntentClassificationResult value object behavior
  // =========================================================================
  describe('IntentClassificationResult value object', () => {
    it('should be immutable', () => {
      const result = classifier.classify(KEYWORD_MESSAGES.campaignCreation.ko)

      expect(() => {
        ;(result as { intent: ChatIntent }).intent = ChatIntent.GENERAL
      }).toThrow()
    })

    it('should expose intent, confidence, method, and originalInput', () => {
      const result = classifier.classify(KEYWORD_MESSAGES.campaignCreation.ko)

      expect(result).toHaveProperty('intent')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('method')
      expect(result).toHaveProperty('originalInput')
    })

    it('should support equality comparison', () => {
      const result1 = classifier.classify(KEYWORD_MESSAGES.campaignCreation.ko)
      const result2 = classifier.classify(KEYWORD_MESSAGES.campaignCreation.ko)

      expect(result1.equals(result2)).toBe(true)
    })
  })

  // =========================================================================
  // 7. ChatIntent enum completeness
  // =========================================================================
  describe('ChatIntent enum', () => {
    it('should have all required intent types', () => {
      expect(ChatIntent.CAMPAIGN_CREATION).toBeDefined()
      expect(ChatIntent.REPORT_QUERY).toBeDefined()
      expect(ChatIntent.KPI_ANALYSIS).toBeDefined()
      expect(ChatIntent.PIXEL_SETUP).toBeDefined()
      expect(ChatIntent.BUDGET_OPTIMIZATION).toBeDefined()
      expect(ChatIntent.GENERAL).toBeDefined()
    })

    it('should have string values matching the enum key', () => {
      expect(ChatIntent.CAMPAIGN_CREATION).toBe('CAMPAIGN_CREATION')
      expect(ChatIntent.REPORT_QUERY).toBe('REPORT_QUERY')
      expect(ChatIntent.KPI_ANALYSIS).toBe('KPI_ANALYSIS')
      expect(ChatIntent.PIXEL_SETUP).toBe('PIXEL_SETUP')
      expect(ChatIntent.BUDGET_OPTIMIZATION).toBe('BUDGET_OPTIMIZATION')
      expect(ChatIntent.GENERAL).toBe('GENERAL')
    })
  })

  // =========================================================================
  // 8. Edge cases & robustness
  // =========================================================================
  describe('edge cases', () => {
    it('should handle very long messages', () => {
      const longMessage = '캠페인을 만들고 싶어요. '.repeat(100)
      const result = classifier.classify(longMessage)

      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
    })

    it('should handle special characters in message', () => {
      const result = classifier.classify('캠페인!!! 만들기??')

      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
    })

    it('should handle emoji in messages', () => {
      const result = classifier.classify('캠페인 만들어줘 🚀✨')

      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
    })

    it('should handle numeric input mixed with intent', () => {
      const result = classifier.classify('100만원 예산으로 캠페인 만들어줘')

      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
    })

    it('should not be confused by negation keywords', () => {
      const result = classifier.classify('캠페인을 만들지 마세요')

      // Negation — should NOT classify as CAMPAIGN_CREATION
      expect(result.intent).not.toBe(ChatIntent.CAMPAIGN_CREATION)
    })
  })

  // =========================================================================
  // 9. Config injection
  // =========================================================================
  describe('config injection', () => {
    it('should use default config when none provided', () => {
      const classifier = IntentClassifier.create()
      const result = classifier.classify('캠페인 만들어줘')
      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
    })

    it('should use custom config when provided', () => {
      const customConfig = {
        ...DEFAULT_INTENT_CLASSIFIER_CONFIG,
        keywordMap: {
          ...DEFAULT_INTENT_CLASSIFIER_CONFIG.keywordMap,
          [ChatIntent.CAMPAIGN_CREATION]: ['테스트키워드'],
        },
      }
      const classifier = IntentClassifier.create(customConfig)
      const result = classifier.classify('테스트키워드로 해줘')
      expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
    })

    it('should expose config via getConfig()', () => {
      const classifier = IntentClassifier.create()
      expect(classifier.getConfig().ambiguityThreshold).toBe(2.0)
    })
  })
})
