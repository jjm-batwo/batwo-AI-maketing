/**
 * RAG 검색 baseline 정확도 측정
 * Usage: npx tsx scripts/eval-rag-baseline.ts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

interface EvalCase {
  query: string
  expectedSource: string  // 정답 문서의 source
  expectedTitle: string   // 정답 문서의 title (부분 일치)
  difficulty: 'easy' | 'medium' | 'hard'
}

// 정답이 있는 평가 세트
const EVAL_SET: EvalCase[] = [
  // Easy — 직접적 키워드
  { query: 'CAPI 설정 방법', expectedSource: 'tracking_health', expectedTitle: 'CAPI', difficulty: 'easy' },
  { query: 'EMQ 점수 개선', expectedSource: 'tracking_health', expectedTitle: 'EMQ', difficulty: 'easy' },
  { query: 'Entity ID란 무엇인가', expectedSource: 'creative_diversity', expectedTitle: 'Entity ID', difficulty: 'easy' },
  { query: 'Advantage+ 캠페인', expectedSource: 'campaign_structure', expectedTitle: 'Advantage+', difficulty: 'easy' },
  { query: 'Cialdini 설득 원칙', expectedSource: 'marketing_psychology', expectedTitle: 'Cialdini', difficulty: 'easy' },
  { query: 'GEM Lattice Andromeda', expectedSource: 'meta_best_practices', expectedTitle: 'Trinity', difficulty: 'easy' },
  { query: '인지 부하 이론', expectedSource: 'neuromarketing', expectedTitle: '인지 부하', difficulty: 'easy' },
  { query: '리드 품질 관리 방법', expectedSource: 'lead_quality', expectedTitle: '리드 품질', difficulty: 'easy' },
  { query: '예산 배분 전략', expectedSource: 'budget_optimization', expectedTitle: '예산 배분', difficulty: 'easy' },
  { query: '추석 마케팅', expectedSource: 'korean_market', expectedTitle: '캘린더', difficulty: 'easy' },
  { query: '이커머스 CTR 벤치마크', expectedSource: 'kpi_analysis', expectedTitle: 'KPI 벤치마크', difficulty: 'easy' },
  { query: 'SUCCESs 프레임워크', expectedSource: 'copywriting_psychology', expectedTitle: '카피 작성', difficulty: 'easy' },

  // Medium — 간접 표현
  { query: '광고 소재 피로도가 높아졌어', expectedSource: 'creative_diversity', expectedTitle: 'Entity ID', difficulty: 'medium' },
  { query: '전환 추적이 제대로 안 되고 있어', expectedSource: 'tracking_health', expectedTitle: 'CAPI', difficulty: 'medium' },
  { query: '캠페인 구조를 단순화하고 싶어', expectedSource: 'campaign_structure', expectedTitle: 'Advantage+', difficulty: 'medium' },
  { query: '학습 단계에서 벗어나질 못해', expectedSource: 'campaign_structure', expectedTitle: 'Advantage+', difficulty: 'medium' },
  { query: '광고비 대비 매출이 안 나와', expectedSource: 'budget_optimization', expectedTitle: '예산 배분', difficulty: 'medium' },
  { query: '허수 고객이 너무 많아', expectedSource: 'lead_quality', expectedTitle: '리드 품질', difficulty: 'medium' },
  { query: '블랙프라이데이 준비', expectedSource: 'korean_market', expectedTitle: '캘린더', difficulty: 'medium' },
  { query: '카피에 숫자를 넣으면 효과적인가', expectedSource: 'copywriting_psychology', expectedTitle: '카피 작성', difficulty: 'medium' },
  { query: '동영상 광고 길이 권장', expectedSource: 'meta_best_practices', expectedTitle: '포맷 최적화', difficulty: 'medium' },
  { query: '할인 심리학', expectedSource: 'marketing_psychology', expectedTitle: '인지 편향', difficulty: 'medium' },
  { query: '도파민 마케팅', expectedSource: 'neuromarketing', expectedTitle: '도파민', difficulty: 'medium' },
  { query: 'ROAS 4배 이상이면 좋은 건가', expectedSource: 'kpi_analysis', expectedTitle: 'KPI 벤치마크', difficulty: 'medium' },

  // Hard — 모호한 표현
  { query: '같은 사람한테 계속 광고가 보여', expectedSource: 'creative_diversity', expectedTitle: 'Entity ID', difficulty: 'hard' },
  { query: '돈은 쓰는데 효과가 없어', expectedSource: 'budget_optimization', expectedTitle: '예산 배분', difficulty: 'hard' },
  { query: '숫자가 안 맞아', expectedSource: 'tracking_health', expectedTitle: 'CAPI', difficulty: 'hard' },
  { query: '어버이날 선물 광고 언제 시작해야 해', expectedSource: 'korean_market', expectedTitle: '캘린더', difficulty: 'hard' },
  { query: '광고가 멈춰버렸어', expectedSource: 'campaign_structure', expectedTitle: 'Advantage+', difficulty: 'hard' },
  { query: '클릭은 많은데 구매가 없어', expectedSource: 'kpi_analysis', expectedTitle: 'KPI 벤치마크', difficulty: 'hard' },
  { query: '사람들이 왜 우리 광고를 안 클릭할까', expectedSource: 'copywriting_psychology', expectedTitle: '카피 작성', difficulty: 'hard' },
  { query: '경쟁사보다 광고 효율이 낮아', expectedSource: 'kpi_analysis', expectedTitle: 'KPI 벤치마크', difficulty: 'hard' },
  { query: '진짜 고객인지 구분하는 방법', expectedSource: 'lead_quality', expectedTitle: '리드 품질', difficulty: 'hard' },
  { query: '광고 세트가 너무 많은 것 같아', expectedSource: 'campaign_structure', expectedTitle: 'Advantage+', difficulty: 'hard' },
  { query: '손실 회피 심리를 광고에 활용하려면', expectedSource: 'marketing_psychology', expectedTitle: '인지 편향', difficulty: 'hard' },
]

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })
  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`)
  const data = await res.json()
  return data.data[0].embedding
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter } as never)

  console.log('=== RAG 검색 Baseline 측정 ===')
  console.log(`평가 세트: ${EVAL_SET.length}개`)
  console.log('')

  let correct = 0
  let top3Correct = 0
  const byDifficulty: Record<string, { correct: number; top3: number; total: number }> = {
    easy: { correct: 0, top3: 0, total: 0 },
    medium: { correct: 0, top3: 0, total: 0 },
    hard: { correct: 0, top3: 0, total: 0 },
  }
  const failures: { query: string; expected: string; got: string; similarity: number }[] = []

  for (const evalCase of EVAL_SET) {
    byDifficulty[evalCase.difficulty].total++

    const embedding = await generateEmbedding(evalCase.query)
    const results = await prisma.$queryRaw`
      SELECT title, source, 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM knowledge_documents
      ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT 3
    ` as { title: string; source: string; similarity: number }[]

    const top1 = results[0]
    const isTop1Correct = top1?.source === evalCase.expectedSource
    const isTop3Correct = results.some((r) => r.source === evalCase.expectedSource)

    if (isTop1Correct) {
      correct++
      byDifficulty[evalCase.difficulty].correct++
    } else {
      failures.push({
        query: evalCase.query,
        expected: `[${evalCase.expectedSource}] ${evalCase.expectedTitle}`,
        got: `[${top1?.source}] ${top1?.title}`,
        similarity: top1?.similarity ?? 0,
      })
    }

    if (isTop3Correct) {
      top3Correct++
      byDifficulty[evalCase.difficulty].top3++
    }

    const mark = isTop1Correct ? '✓' : '✗'
    console.log(`${mark} "${evalCase.query.slice(0, 25).padEnd(25)}" → [${top1?.source}] ${(top1?.similarity * 100).toFixed(1)}%`)

    await new Promise((r) => setTimeout(r, 100)) // rate limit
  }

  console.log('')
  console.log('=== 결과 ===')
  console.log(`Top-1 정확도: ${(correct / EVAL_SET.length * 100).toFixed(1)}% (${correct}/${EVAL_SET.length})`)
  console.log(`Top-3 정확도: ${(top3Correct / EVAL_SET.length * 100).toFixed(1)}% (${top3Correct}/${EVAL_SET.length})`)
  console.log('')
  console.log('=== 난이도별 ===')
  for (const [diff, stats] of Object.entries(byDifficulty)) {
    if (stats.total > 0) {
      console.log(`${diff.padEnd(8)} Top-1: ${(stats.correct / stats.total * 100).toFixed(1)}% (${stats.correct}/${stats.total})  Top-3: ${(stats.top3 / stats.total * 100).toFixed(1)}% (${stats.top3}/${stats.total})`)
    }
  }

  if (failures.length > 0) {
    console.log('')
    console.log(`=== 실패 케이스 (${failures.length}개) ===`)
    for (const f of failures) {
      console.log(`  "${f.query}"`)
      console.log(`    expected: ${f.expected}`)
      console.log(`    got:      ${f.got} (${(f.similarity * 100).toFixed(1)}%)`)
    }
  }

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
