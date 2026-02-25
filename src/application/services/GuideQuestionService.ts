import { ChatIntent } from '@domain/value-objects/ChatIntent'

export interface GuideQuestion {
  id: string
  text: string
  intent: string
  order: number
}

const GUIDE_QUESTION_TEMPLATES: Record<ChatIntent, string[]> = {
  [ChatIntent.CAMPAIGN_CREATION]: [
    '캠페인 예산을 얼마로 설정할까요?',
    '타겟 오디언스는 어떻게 설정하시겠어요?',
    '캠페인 목표는 무엇인가요?',
  ],
  [ChatIntent.REPORT_QUERY]: [
    '어떤 기간의 보고서를 보시겠어요?',
    '특정 캠페인의 성과를 분석할까요?',
    '어떤 지표를 중심으로 볼까요?',
  ],
  [ChatIntent.KPI_ANALYSIS]: [
    '어떤 KPI를 확인하시겠어요?',
    '특정 기간의 KPI 추이를 볼까요?',
    'KPI 목표 대비 달성률을 확인할까요?',
  ],
  [ChatIntent.PIXEL_SETUP]: [
    '어떤 플랫폼에 픽셀을 설치하시겠어요?',
    '전환 이벤트 설정이 필요하신가요?',
    '기존 픽셀 상태를 확인할까요?',
  ],
  [ChatIntent.BUDGET_OPTIMIZATION]: [
    '현재 예산 분배를 확인하시겠어요?',
    '예산 최적화 제안을 받으시겠어요?',
    '예산 한도를 조정하시겠어요?',
  ],
  [ChatIntent.GENERAL]: [
    '캠페인을 만들어 볼까요?',
    '성과 분석이 필요하신가요?',
    '예산 최적화를 도와드릴까요?',
  ],
}

export interface GuideQuestionConfig {
  questions: Record<string, GuideQuestion[]>
  maxQuestionsPerIntent?: number
}

export interface QuestionContext {
  intent: ChatIntent
  answeredQuestionIds: string[]
}

export class GuideQuestionService {
  private readonly config: GuideQuestionConfig
  private readonly answers: Map<string, string> = new Map()
  private trackedIntent: string | null = null

  constructor(config: GuideQuestionConfig) {
    this.config = config
  }

  getQuestionsForIntent(intent: ChatIntent): GuideQuestion[] {
    const questions = this.config.questions[intent] ?? []
    const sorted = [...questions].sort((a, b) => a.order - b.order)

    if (this.config.maxQuestionsPerIntent !== undefined && this.config.maxQuestionsPerIntent > 0) {
      return sorted.slice(0, this.config.maxQuestionsPerIntent)
    }

    return sorted
  }

  getNextQuestion(context: QuestionContext): GuideQuestion | null {
    const questions = this.getQuestionsForIntent(context.intent)
    const answered = new Set(context.answeredQuestionIds)

    for (const question of questions) {
      if (!answered.has(question.id)) {
        return question
      }
    }

    return null
  }

  trackAnswer(questionId: string, answer: string): void {
    this.answers.set(questionId, answer)

    if (this.trackedIntent === null) {
      this.trackedIntent = this.findIntentForQuestion(questionId)
    }
  }

  getProgress(): { current: number; total: number } {
    const current = this.answers.size

    if (this.trackedIntent !== null) {
      const intentQuestions = this.getQuestionsForIntent(this.trackedIntent as ChatIntent)
      return { current, total: intentQuestions.length }
    }

    // Before any tracking, total = all questions across all intents
    let total = 0
    for (const intent of Object.keys(this.config.questions)) {
      total += this.getQuestionsForIntent(intent as ChatIntent).length
    }

    return { current, total }
  }

  isComplete(): boolean {
    const { current, total } = this.getProgress()
    return current >= total
  }

  generateGuideQuestions(intent: ChatIntent): string[] {
    return GUIDE_QUESTION_TEMPLATES[intent] ?? GUIDE_QUESTION_TEMPLATES[ChatIntent.GENERAL]
  }

  private findIntentForQuestion(questionId: string): string | null {
    for (const [intent, questions] of Object.entries(this.config.questions)) {
      if (questions.some((q) => q.id === questionId)) {
        return intent
      }
    }
    return null
  }
}
