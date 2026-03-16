/**
 * Intent Lab 실행 스크립트
 * Usage: npx tsx scripts/run-intent-lab.ts [duration_ms]
 * Default: 5분 (300000ms)
 *
 * 비용: $0 (LLM 호출 없음)
 */
import { IntentLabRunner } from '../src/application/intent-lab/IntentLabRunner'

const DURATION_MS = Number(process.argv[2]) || 300_000

async function main() {
  console.log('=== Intent Lab 시작 ===')
  console.log(`실행 시간: ${(DURATION_MS / 60_000).toFixed(1)}분`)
  console.log(`비용: $0 (LLM 호출 없음)`)
  console.log('')

  const runner = new IntentLabRunner()
  const report = await runner.run({ maxDurationMs: DURATION_MS, iterationDelayMs: 0 })

  console.log('')
  console.log('=== Intent Lab 결과 ===')
  console.log(`총 반복: ${report.totalIterations.toLocaleString()}회`)
  console.log(`총 시간: ${(report.totalDurationMs / 1000).toFixed(1)}초`)
  console.log('')
  console.log(`baseline 정확도: ${(report.baselineAccuracy * 100).toFixed(1)}%`)
  console.log(`최고 정확도 (train): ${(report.bestAccuracy * 100).toFixed(1)}%`)
  console.log(`검증 정확도 (validation): ${(report.validationAccuracy * 100).toFixed(1)}%`)
  console.log(`개선율: ${report.improvementFromBaseline.toFixed(1)}%`)
  console.log('')
  console.log('=== 난이도별 정확도 ===')
  console.log(`easy:   ${(report.byDifficulty.easy.accuracy * 100).toFixed(1)}% (${report.byDifficulty.easy.correct}/${report.byDifficulty.easy.total})`)
  console.log(`medium: ${(report.byDifficulty.medium.accuracy * 100).toFixed(1)}% (${report.byDifficulty.medium.correct}/${report.byDifficulty.medium.total})`)
  console.log(`hard:   ${(report.byDifficulty.hard.accuracy * 100).toFixed(1)}% (${report.byDifficulty.hard.correct}/${report.byDifficulty.hard.total})`)
  console.log('')

  if (report.failures.length > 0) {
    console.log(`=== 실패 케이스 (${report.failures.length}개) ===`)
    for (const f of report.failures) {
      console.log(`  "${f.input}" → expected: ${f.expected}, got: ${f.got}`)
    }
  }

  console.log('')
  console.log(`=== KEEP 기록 (${report.results.filter((r) => r.status === 'keep').length}개) ===`)
  for (const r of report.results.filter((r) => r.status === 'keep')) {
    console.log(`  ${(r.trainAccuracy * 100).toFixed(1)}% | ${r.description}`)
  }

  // JSON 저장
  const fs = await import('fs')
  fs.mkdirSync('data/intent-lab', { recursive: true })
  const outputPath = `data/intent-lab/result-${new Date().toISOString().slice(0, 10)}.json`
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
  console.log(`\n결과 저장: ${outputPath}`)
}

main()
