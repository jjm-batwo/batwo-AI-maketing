/**
 * IGuideQuestionService - 가이드 질문 서비스 포트 인터페이스
 *
 * 챗봇 인터페이스에서 사용자 의도에 따라 안내 질문과 추천 질문을 제공한다.
 */
import { ChatIntent } from '@domain/value-objects/ChatIntent'
import type { GuideQuestion, QuestionContext } from '@application/services/GuideQuestionService'

export interface IGuideQuestionService {
  getQuestionsForIntent(intent: ChatIntent): GuideQuestion[]
  getNextQuestion(context: QuestionContext): GuideQuestion | null
  generateGuideQuestions(intent: ChatIntent): string[]
  trackAnswer(questionId: string, answer: string): void
  getProgress(): { current: number; total: number }
  isComplete(): boolean
}
