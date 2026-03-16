/**
 * Prompt Lab 실행 스크립트
 * Usage: npx tsx scripts/run-prompt-lab.ts
 *
 * 1시간 동안 이커머스 산업 프롬프트 최적화 실행
 */
import 'dotenv/config'
import { AIService } from '../src/infrastructure/external/openai/AIService'
import { PromptLabService } from '../src/application/services/PromptLabService'
import { PromptLabEvaluator } from '../src/infrastructure/prompt-lab/PromptLabEvaluator'
import { PromptLabRuleScorer } from '../src/application/services/PromptLabRuleScorer'
import { PromptLabLLMJudge } from '../src/infrastructure/prompt-lab/PromptLabLLMJudge'
import { PromptLabMutator } from '../src/infrastructure/prompt-lab/PromptLabMutator'
import { PromptLabAIAdapter } from '../src/infrastructure/prompt-lab/PromptLabAIAdapter'
import { createPromptLabConfig } from '../src/domain/value-objects/PromptLabTypes'
import type { Industry } from '../src/domain/value-objects/Industry'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY 환경변수가 필요합니다')
  process.exit(1)
}

const DURATION_MS = 3_600_000 // 1시간
const INDUSTRY: Industry = 'ecommerce'

async function main() {
  console.log('=== Prompt Lab 시작 ===')
  console.log(`산업: ${INDUSTRY}`)
  console.log(`실행 시간: ${DURATION_MS / 60_000}분`)
  console.log(`예상 반복: ~${Math.floor(DURATION_MS / 36_000)}회`)
  console.log(`예상 비용: ~$${(DURATION_MS / 3_600_000 * 0.20).toFixed(2)}`)
  console.log('')

  const ai = new AIService(OPENAI_API_KEY!, 'gpt-4o-mini')
  const ruleScorer = new PromptLabRuleScorer()
  const llmJudge = new PromptLabLLMJudge(ai)
  const evaluator = new PromptLabEvaluator(ruleScorer, llmJudge)
  const mutator = new PromptLabMutator()
  const adapter = new PromptLabAIAdapter(ai)

  const service = new PromptLabService(adapter, evaluator, mutator)

  const config = createPromptLabConfig({
    industry: INDUSTRY,
    maxDurationMs: DURATION_MS,
    sampleInput: {
      productName: '프리미엄 스킨케어 세트',
      productDescription: '피부과 전문의와 공동 개발한 올인원 스킨케어. 세럼, 크림, 토너 3종 세트. 민감 피부에도 안전한 저자극 포뮬러.',
      targetAudience: '25-45세 여성, 피부 고민 있는 직장인',
      tone: 'professional',
      objective: 'conversion',
      keywords: ['스킨케어', '세럼', '할인', '민감피부', '피부과'],
      industry: INDUSTRY,
    },
  })

  // 진행 상황 로깅용 interval
  const startTime = Date.now()
  const progressInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 60_000)
    const remaining = Math.floor((DURATION_MS - (Date.now() - startTime)) / 60_000)
    console.log(`[${elapsed}분 경과, ${remaining}분 남음]`)
  }, 300_000) // 5분마다

  try {
    const report = await service.run(config)

    clearInterval(progressInterval)

    console.log('')
    console.log('=== Prompt Lab 결과 ===')
    console.log(`총 반복: ${report.totalIterations}회`)
    console.log(`총 시간: ${(report.totalDurationMs / 60_000).toFixed(1)}분`)
    console.log(`총 토큰: ${report.totalTokensUsed.toLocaleString()}`)
    console.log('')
    console.log(`baseline 점수: ${report.baselineScore}`)
    console.log(`최고 점수: ${report.bestScore}`)
    console.log(`개선율: ${report.improvementFromBaseline.toFixed(1)}%`)
    console.log('')
    console.log('=== 최적 변형 ===')
    console.log(JSON.stringify(report.bestVariant, null, 2))
    console.log('')

    // 결과 요약 테이블
    console.log('=== 실험 로그 (results.tsv 스타일) ===')
    console.log('status\tscore\trule\tllm\tdescription')
    for (const r of report.results) {
      console.log(`${r.status}\t${r.score}\t${r.ruleScore}\t${r.llmScore}\t${r.description}`)
    }

    // JSON으로 전체 결과 저장
    const fs = await import('fs')
    const outputPath = `data/prompt-lab/${INDUSTRY}-${new Date().toISOString().slice(0, 10)}.json`
    fs.mkdirSync('data/prompt-lab', { recursive: true })
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
    console.log(`\n결과 저장: ${outputPath}`)

  } catch (error) {
    clearInterval(progressInterval)
    console.error('실험 실패:', error)
    process.exit(1)
  }
}

main()
