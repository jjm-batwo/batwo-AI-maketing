import { ChatIntent } from './ChatIntent'

/**
 * FewShotExample 값 객체
 * - AI 모델에 주입할 도메인별 few-shot 예시 쌍을 표현합니다.
 */
export interface FewShotExample {
  role: 'user' | 'assistant'
  content: string
  category: ChatIntent
}
