/**
 * Intent Lab 실행 스크립트
 * Usage: npx tsx scripts/run-intent-lab.ts [duration_ms] [mode]
 *   mode: "synthetic" (default) | "combined"
 * Default: 5분 (300000ms)
 *
 * 비용: $0 (LLM 호출 없음)
 */
import { IntentLabRunner, type TrainSetMode } from '../src/application/intent-lab/IntentLabRunner'

const DURATION_MS = Number(process.argv[2]) || 300_000
const MODE = (process.argv[3] as TrainSetMode) || 'synthetic'

function pct(n: number): string {
  return (n * 100).toFixed(1) + '%'
}

async function main() {
  console.log('=== Intent Lab 시작 ===')
  console.log(`실행 시간: ${(DURATION_MS / 60_000).toFixed(1)}분`)
  console.log(`학습 모드: ${MODE}`)
  console.log(`비용: $0 (LLM 호출 없음)`)
  console.log('')

  const runner = new IntentLabRunner()
  const report = await runner.run({ maxDurationMs: DURATION_MS, iterationDelayMs: 0, trainSetMode: MODE })

  console.log('')
  console.log('=== Intent Lab 결과 ===')
  console.log(`총 반복: ${report.totalIterations.toLocaleString()}회`)
  console.log(`총 시간: ${(report.totalDurationMs / 1000).toFixed(1)}초`)
  console.log('')
  console.log(`baseline 정확도: ${pct(report.baselineAccuracy)}`)
  console.log(`최고 정확도 (train): ${pct(report.bestAccuracy)}`)
  console.log(`검증 정확도 (validation): ${pct(report.validationAccuracy)}`)
  console.log(`개선율: ${report.improvementFromBaseline.toFixed(1)}%`)
  console.log('')
  console.log('=== 난이도별 정확도 (합성) ===')
  console.log(`easy:   ${pct(report.byDifficulty.easy.accuracy)} (${report.byDifficulty.easy.correct}/${report.byDifficulty.easy.total})`)
  console.log(`medium: ${pct(report.byDifficulty.medium.accuracy)} (${report.byDifficulty.medium.correct}/${report.byDifficulty.medium.total})`)
  console.log(`hard:   ${pct(report.byDifficulty.hard.accuracy)} (${report.byDifficulty.hard.correct}/${report.byDifficulty.hard.total})`)
  console.log('')

  // Gap Report
  const gap = report.gapReport
  console.log('=== Gap Report: Synthetic vs Real ===')
  console.log(`합성 정확도:   ${pct(gap.syntheticAccuracy)}`)
  console.log(`실패턴 정확도: ${pct(gap.realAccuracy)}`)
  console.log(`통합 정확도:   ${pct(gap.combinedAccuracy)}`)
  console.log(`GAP:           ${(gap.gap * 100).toFixed(1)}pp`)
  console.log('')
  console.log('=== 실패턴 난이도별 정확도 ===')
  console.log(`easy:   ${pct(gap.realByDifficulty.easy.accuracy)} (${gap.realByDifficulty.easy.correct}/${gap.realByDifficulty.easy.total})`)
  console.log(`medium: ${pct(gap.realByDifficulty.medium.accuracy)} (${gap.realByDifficulty.medium.correct}/${gap.realByDifficulty.medium.total})`)
  console.log(`hard:   ${pct(gap.realByDifficulty.hard.accuracy)} (${gap.realByDifficulty.hard.correct}/${gap.realByDifficulty.hard.total})`)
  console.log('')

  if (gap.realFailures.length > 0) {
    console.log(`=== 실패턴 실패 케이스 (${gap.realFailures.length}개) ===`)
    for (const f of gap.realFailures) {
      console.log(`  "${f.input}" → expected: ${f.expected}, got: ${f.got}`)
    }
    console.log('')
  }

  if (report.failures.length > 0) {
    console.log(`=== 합성 실패 케이스 (${report.failures.length}개) ===`)
    for (const f of report.failures) {
      console.log(`  "${f.input}" → expected: ${f.expected}, got: ${f.got}`)
    }
  }

  console.log('')
  console.log(`=== KEEP 기록 (${report.results.filter((r) => r.status === 'keep').length}개) ===`)
  for (const r of report.results.filter((r) => r.status === 'keep')) {
    console.log(`  ${pct(r.trainAccuracy)} | ${r.description}`)
  }

  // JSON 저장
  const fs = await import('fs')
  fs.mkdirSync('data/intent-lab', { recursive: true })
  const outputPath = `data/intent-lab/result-${new Date().toISOString().slice(0, 10)}.json`
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
  console.log(`\n결과 저장: ${outputPath}`)
}

main()
