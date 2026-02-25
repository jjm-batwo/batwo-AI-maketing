import { ChatIntent } from '@domain/value-objects/ChatIntent'
import { FewShotExample } from '@domain/value-objects/FewShotExample'

/**
 * IFewShotExampleRegistry 포트
 * - 도메인별 few-shot 예시를 제공하는 레지스트리 인터페이스
 */
export interface IFewShotExampleRegistry {
  getExamples(intent: ChatIntent): FewShotExample[]
  getAllExamples(): FewShotExample[]
}
