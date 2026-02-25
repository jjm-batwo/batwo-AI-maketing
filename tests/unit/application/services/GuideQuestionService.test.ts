/**
 * GuideQuestionService - TDD RED Phase Tests
 *
 * Tests for contextual guide question generation based on detected chat intent.
 * GuideQuestionService loads questions from configuration and provides them
 * based on the user's current intent, tracking progress through the flow.
 *
 * Expected to FAIL: GuideQuestionService, GuideQuestionConfig, ChatIntent,
 * GuideQuestion, QuestionContext types do not exist yet.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GuideQuestionService } from '@application/services/GuideQuestionService'
import {
  GuideQuestionConfig,
  GuideQuestion,
  QuestionContext,
} from '@application/services/GuideQuestionService'
import { ChatIntent } from '@domain/value-objects/ChatIntent'

describe('GuideQuestionService', () => {
  let service: GuideQuestionService
  let mockConfig: GuideQuestionConfig

  beforeEach(() => {
    mockConfig = {
      questions: {
        CAMPAIGN_CREATION: [
          {
            id: 'q1',
            text: '어떤 캠페인을 만드시겠어요?',
            intent: 'CAMPAIGN_CREATION',
            order: 1,
          },
          {
            id: 'q2',
            text: '예산은 얼마로 설정할까요?',
            intent: 'CAMPAIGN_CREATION',
            order: 2,
          },
          {
            id: 'q3',
            text: '타겟 오디언스를 선택해주세요.',
            intent: 'CAMPAIGN_CREATION',
            order: 3,
          },
        ],
        REPORT_QUERY: [
          {
            id: 'q4',
            text: '어떤 기간의 리포트를 보시겠어요?',
            intent: 'REPORT_QUERY',
            order: 1,
          },
          {
            id: 'q5',
            text: '특정 캠페인 리포트를 원하시나요?',
            intent: 'REPORT_QUERY',
            order: 2,
          },
        ],
        KPI_ANALYSIS: [
          {
            id: 'q6',
            text: '어떤 KPI를 확인하시겠어요?',
            intent: 'KPI_ANALYSIS',
            order: 1,
          },
        ],
      },
      maxQuestionsPerIntent: 5,
    } as unknown as GuideQuestionConfig

    service = new GuideQuestionService(mockConfig)
  })

  describe('getQuestionsForIntent - 인텐트 기반 가이드 질문 생성', () => {
    it('should_return_questions_matching_campaign_create_intent', () => {
      const intent = ChatIntent.CAMPAIGN_CREATION

      const questions = service.getQuestionsForIntent(intent)

      expect(questions).toHaveLength(3)
      expect(questions[0].id).toBe('q1')
      expect(questions[0].text).toBe('어떤 캠페인을 만드시겠어요?')
      expect(questions[1].id).toBe('q2')
      expect(questions[2].id).toBe('q3')
    })

    it('should_return_questions_matching_report_view_intent', () => {
      const intent = ChatIntent.REPORT_QUERY

      const questions = service.getQuestionsForIntent(intent)

      expect(questions).toHaveLength(2)
      expect(questions[0].id).toBe('q4')
      expect(questions[1].id).toBe('q5')
    })

    it('should_return_empty_array_for_unknown_intent', () => {
      const intent = 'UNKNOWN_INTENT' as unknown as ChatIntent

      const questions = service.getQuestionsForIntent(intent)

      expect(questions).toEqual([])
    })

    it('should_return_questions_in_order', () => {
      const intent = ChatIntent.CAMPAIGN_CREATION

      const questions = service.getQuestionsForIntent(intent)

      for (let i = 0; i < questions.length - 1; i++) {
        expect(questions[i].order).toBeLessThan(questions[i + 1].order)
      }
    })
  })

  describe('constructor - 설정 로드', () => {
    it('should_load_questions_from_configuration', () => {
      const configWithSingleIntent: GuideQuestionConfig = {
        questions: {
          CAMPAIGN_CREATION: [
            {
              id: 'only-q',
              text: '단일 질문입니다.',
              intent: 'CAMPAIGN_CREATION',
              order: 1,
            },
          ],
        },
        maxQuestionsPerIntent: 1,
      } as unknown as GuideQuestionConfig

      const svc = new GuideQuestionService(configWithSingleIntent)
      const questions = svc.getQuestionsForIntent(ChatIntent.CAMPAIGN_CREATION)

      expect(questions).toHaveLength(1)
      expect(questions[0].id).toBe('only-q')
    })

    it('should_respect_maxQuestionsPerIntent_limit', () => {
      const limitedConfig: GuideQuestionConfig = {
        questions: {
          CAMPAIGN_CREATION: [
            { id: 'q1', text: '질문 1', intent: 'CAMPAIGN_CREATION', order: 1 },
            { id: 'q2', text: '질문 2', intent: 'CAMPAIGN_CREATION', order: 2 },
            { id: 'q3', text: '질문 3', intent: 'CAMPAIGN_CREATION', order: 3 },
          ],
        },
        maxQuestionsPerIntent: 2,
      } as unknown as GuideQuestionConfig

      const svc = new GuideQuestionService(limitedConfig)
      const questions = svc.getQuestionsForIntent(ChatIntent.CAMPAIGN_CREATION)

      expect(questions.length).toBeLessThanOrEqual(2)
    })
  })

  describe('getNextQuestion - 다음 질문 반환', () => {
    it('should_return_first_question_when_no_answers_given', () => {
      const context: QuestionContext = {
        intent: ChatIntent.CAMPAIGN_CREATION,
        answeredQuestionIds: [],
      } as unknown as QuestionContext

      const next = service.getNextQuestion(context)

      expect(next).not.toBeNull()
      expect(next!.id).toBe('q1')
    })

    it('should_return_next_unanswered_question', () => {
      const context: QuestionContext = {
        intent: ChatIntent.CAMPAIGN_CREATION,
        answeredQuestionIds: ['q1'],
      } as unknown as QuestionContext

      const next = service.getNextQuestion(context)

      expect(next).not.toBeNull()
      expect(next!.id).toBe('q2')
    })

    it('should_return_null_when_all_questions_answered', () => {
      const context: QuestionContext = {
        intent: ChatIntent.CAMPAIGN_CREATION,
        answeredQuestionIds: ['q1', 'q2', 'q3'],
      } as unknown as QuestionContext

      const next = service.getNextQuestion(context)

      expect(next).toBeNull()
    })
  })

  describe('trackAnswer - 답변 추적', () => {
    it('should_track_answer_for_question', () => {
      service.trackAnswer('q1', '판매 캠페인')

      const progress = service.getProgress()
      expect(progress.current).toBe(1)
    })

    it('should_increment_progress_with_each_answer', () => {
      service.trackAnswer('q1', '판매 캠페인')
      service.trackAnswer('q2', '100만원')

      const progress = service.getProgress()
      expect(progress.current).toBe(2)
    })
  })

  describe('isComplete - 완료 상태 확인', () => {
    it('should_return_false_when_questions_remain', () => {
      service.trackAnswer('q1', '판매 캠페인')

      expect(service.isComplete()).toBe(false)
    })

    it('should_return_true_when_all_questions_answered', () => {
      // Answer all questions for the default intent (CAMPAIGN_CREATION has 3)
      service.trackAnswer('q1', '판매 캠페인')
      service.trackAnswer('q2', '100만원')
      service.trackAnswer('q3', '20-30대 여성')

      expect(service.isComplete()).toBe(true)
    })

    it('should_return_true_initially_when_no_questions_configured', () => {
      const emptyConfig: GuideQuestionConfig = {
        questions: {},
        maxQuestionsPerIntent: 5,
      } as unknown as GuideQuestionConfig

      const emptySvc = new GuideQuestionService(emptyConfig)

      expect(emptySvc.isComplete()).toBe(true)
    })
  })

  describe('getProgress - 진행 상황 추적', () => {
    it('should_return_zero_progress_initially', () => {
      const progress = service.getProgress()

      expect(progress.current).toBe(0)
      expect(progress.total).toBeGreaterThan(0)
    })

    it('should_track_current_and_total_correctly', () => {
      service.trackAnswer('q1', '판매 캠페인')

      const progress = service.getProgress()

      expect(progress.current).toBe(1)
      expect(progress.total).toBe(3) // CAMPAIGN_CREATION has 3 questions
    })

    it('should_show_full_progress_when_complete', () => {
      service.trackAnswer('q1', '판매 캠페인')
      service.trackAnswer('q2', '100만원')
      service.trackAnswer('q3', '20-30대 여성')

      const progress = service.getProgress()

      expect(progress.current).toBe(progress.total)
    })
  })

  describe('Korean guide questions - 한국어 가이드 질문 지원', () => {
    it('should_support_korean_question_text', () => {
      const intent = ChatIntent.CAMPAIGN_CREATION

      const questions = service.getQuestionsForIntent(intent)

      questions.forEach((q: GuideQuestion) => {
        expect(q.text).toBeTruthy()
        expect(typeof q.text).toBe('string')
        // Verify Korean characters present (Hangul range)
        expect(q.text).toMatch(/[\uAC00-\uD7AF]/)
      })
    })

    it('should_support_korean_answers_in_tracking', () => {
      // Korean answers should be tracked without issues
      service.trackAnswer('q1', '브랜드 인지도 캠페인')
      service.trackAnswer('q2', '월 50만원')

      const progress = service.getProgress()
      expect(progress.current).toBe(2)
    })

    it('should_provide_kpi_check_questions_in_korean', () => {
      const intent = ChatIntent.KPI_ANALYSIS

      const questions = service.getQuestionsForIntent(intent)

      expect(questions).toHaveLength(1)
      expect(questions[0].text).toBe('어떤 KPI를 확인하시겠어요?')
    })
  })

  describe('generateGuideQuestions - 의도 기반 동적 추천 질문 생성', () => {
    it('should_return_three_suggestions_for_campaign_creation_intent', () => {
      const suggestions = service.generateGuideQuestions(ChatIntent.CAMPAIGN_CREATION)

      expect(suggestions).toHaveLength(3)
      suggestions.forEach((s) => expect(s).toMatch(/[\uAC00-\uD7AF]/))
    })

    it('should_return_three_suggestions_for_report_query_intent', () => {
      const suggestions = service.generateGuideQuestions(ChatIntent.REPORT_QUERY)

      expect(suggestions).toHaveLength(3)
      suggestions.forEach((s) => expect(s).toMatch(/[\uAC00-\uD7AF]/))
    })

    it('should_return_three_suggestions_for_kpi_analysis_intent', () => {
      const suggestions = service.generateGuideQuestions(ChatIntent.KPI_ANALYSIS)

      expect(suggestions).toHaveLength(3)
      suggestions.forEach((s) => expect(s).toMatch(/[\uAC00-\uD7AF]/))
    })

    it('should_return_three_suggestions_for_pixel_setup_intent', () => {
      const suggestions = service.generateGuideQuestions(ChatIntent.PIXEL_SETUP)

      expect(suggestions).toHaveLength(3)
      suggestions.forEach((s) => expect(s).toMatch(/[\uAC00-\uD7AF]/))
    })

    it('should_return_three_suggestions_for_budget_optimization_intent', () => {
      const suggestions = service.generateGuideQuestions(ChatIntent.BUDGET_OPTIMIZATION)

      expect(suggestions).toHaveLength(3)
      suggestions.forEach((s) => expect(s).toMatch(/[\uAC00-\uD7AF]/))
    })

    it('should_return_fallback_suggestions_for_general_intent', () => {
      const suggestions = service.generateGuideQuestions(ChatIntent.GENERAL)

      expect(suggestions).toHaveLength(3)
      suggestions.forEach((s) => expect(s).toMatch(/[\uAC00-\uD7AF]/))
    })

    it('should_return_campaign_creation_specific_question', () => {
      const suggestions = service.generateGuideQuestions(ChatIntent.CAMPAIGN_CREATION)

      expect(suggestions).toContain('캠페인 예산을 얼마로 설정할까요?')
    })

    it('should_return_pixel_setup_specific_question', () => {
      const suggestions = service.generateGuideQuestions(ChatIntent.PIXEL_SETUP)

      expect(suggestions).toContain('어떤 플랫폼에 픽셀을 설치하시겠어요?')
    })

    it('should_not_exceed_five_suggestions', () => {
      const allIntents = Object.values(ChatIntent)

      allIntents.forEach((intent) => {
        const suggestions = service.generateGuideQuestions(intent)
        expect(suggestions.length).toBeLessThanOrEqual(5)
      })
    })
  })
})
