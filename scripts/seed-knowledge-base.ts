/**
 * Knowledge Base 시드 스크립트
 *
 * prisma/seeds/marketing-knowledge/ 디렉토리의 마크다운 시드 문서를
 * 청킹 → 임베딩(text-embedding-3-small) → pgvector DB에 적재합니다.
 *
 * 실행 방법:
 *   npm run seed:knowledge
 *   # 또는
 *   npx tsx scripts/seed-knowledge-base.ts
 *
 * 환경 변수 필요:
 *   - DATABASE_URL (Postgres + pgvector)
 *   - OPENAI_API_KEY
 */

import { PrismaClient } from '../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import 'dotenv/config'

import type { IEmbeddingService } from '../src/application/ports/IEmbeddingService'
import { KnowledgeIngestionService } from '../src/application/services/KnowledgeIngestionService'
import { PrismaKnowledgeBaseRepository } from '../src/infrastructure/database/repositories/PrismaKnowledgeBaseRepository'

// ============================================================================
// OpenAI Embedding 서비스 (openai 패키지 없이 fetch 기반 구현)
// ============================================================================

class FetchEmbeddingService implements IEmbeddingService {
    private readonly model = 'text-embedding-3-small'
    private readonly apiUrl = 'https://api.openai.com/v1/embeddings'

    constructor(private readonly apiKey: string) { }

    async generateEmbedding(text: string): Promise<number[]> {
        const result = await this.callApi([text.trim()])
        return result[0]
    }

    async generateEmbeddings(texts: string[]): Promise<number[][]> {
        const validTexts = texts.filter((t) => t.trim().length > 0)
        if (validTexts.length === 0) return []

        // OpenAI 배치 제한: 한번에 최대 2048개, 토큰 제한도 있으므로 50개씩 나눔
        const batchSize = 50
        const allEmbeddings: number[][] = []

        for (let i = 0; i < validTexts.length; i += batchSize) {
            const batch = validTexts.slice(i, i + batchSize)
            const embeddings = await this.callApi(batch)
            allEmbeddings.push(...embeddings)

            // Rate limit 대비 딜레이
            if (i + batchSize < validTexts.length) {
                await new Promise((resolve) => setTimeout(resolve, 200))
            }
        }

        return allEmbeddings
    }

    private async callApi(input: string[]): Promise<number[][]> {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({ model: this.model, input }),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            throw new Error(
                `OpenAI Embedding API error (${response.status}): ${errorBody}`
            )
        }

        const data = (await response.json()) as {
            data: Array<{ embedding: number[]; index: number }>
        }

        // index 순서 보장
        return data.data
            .sort((a, b) => a.index - b.index)
            .map((item) => item.embedding)
    }
}

// ============================================================================
// 설정
// ============================================================================

const SEED_DIR = path.resolve(__dirname, '../prisma/seeds/marketing-knowledge')

/** 파일명 → 카테고리 매핑. 파일 prefix 기준으로 분류. */
function resolveCategory(filename: string): string {
    const categoryMap: Record<string, string> = {
        '01-': 'meta-algorithm',
        '02-': 'creative-strategy',
        '03-': 'campaign-structure',
        '04-': 'data-infrastructure',
        '05-': 'api-migration',
        '06-': 'case-study',
        '07-': 'diagnostic-scenario',
        '08-': 'ad-policy',
        '09-': 'attribution',
        '10-': 'pixel-tracking',
    }

    for (const [prefix, category] of Object.entries(categoryMap)) {
        if (filename.startsWith(prefix)) return category
    }

    // 범용 마케팅 문서 (사용자가 직접 작성한 파일)
    return 'marketing-general'
}

/** 마크다운 파일의 첫 번째 # 헤딩을 추출하여 타이틀로 사용. */
function extractTitle(content: string, fallbackFilename: string): string {
    const match = content.match(/^#\s+(.+)$/m)
    if (match) return match[1].trim()

    // 헤딩이 없으면 파일명 → 타이틀
    return fallbackFilename
        .replace(/\.md$/, '')
        .replace(/^\d+-/, '')
        .replace(/-/g, ' ')
}

// ============================================================================
// 메인
// ============================================================================

async function main() {
    console.log('================================================')
    console.log('  📚 Knowledge Base 시드 스크립트')
    console.log('================================================')
    console.log()

    // 1. 환경 변수 검증
    const databaseUrl = process.env.DATABASE_URL
    const openaiKey = process.env.OPENAI_API_KEY

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL 환경 변수가 설정되지 않았습니다.')
        process.exit(1)
    }
    if (!openaiKey) {
        console.error('❌ OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.')
        process.exit(1)
    }

    // 2. 의존성 초기화
    const pool = new Pool({ connectionString: databaseUrl })
    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    const embeddingService = new FetchEmbeddingService(openaiKey)
    const knowledgeRepo = new PrismaKnowledgeBaseRepository(prisma)
    const ingestionService = new KnowledgeIngestionService(
        embeddingService,
        knowledgeRepo
    )

    try {
        // 3. 시드 디렉토리 스캔
        if (!fs.existsSync(SEED_DIR)) {
            console.error(`❌ 시드 디렉토리가 존재하지 않습니다: ${SEED_DIR}`)
            process.exit(1)
        }

        const files = fs
            .readdirSync(SEED_DIR)
            .filter((f) => f.endsWith('.md'))
            .sort()

        if (files.length === 0) {
            console.log('⚠️  마크다운 파일이 없습니다. 시드를 스킵합니다.')
            return
        }

        console.log(`📂 시드 디렉토리: ${SEED_DIR}`)
        console.log(`📄 발견된 마크다운 파일: ${files.length}개`)
        console.log()

        // 4. 파일별 적재
        const inputs = files.map((filename) => {
            const filepath = path.join(SEED_DIR, filename)
            const content = fs.readFileSync(filepath, 'utf-8')
            const title = extractTitle(content, filename)
            const category = resolveCategory(filename)

            return {
                title,
                content,
                source: `seed://marketing-knowledge/${filename}`,
                category,
                metadata: {
                    filename,
                    seedVersion: '1.0',
                    seededAt: new Date().toISOString(),
                },
            }
        })

        console.log('🚀 적재 시작...')
        console.log()

        const results = await ingestionService.ingestMultiple(inputs)

        // 5. 결과 출력
        let totalChunks = 0
        let errorCount = 0

        for (const result of results) {
            const shortSource = result.source.replace(
                'seed://marketing-knowledge/',
                ''
            )
            if (result.errors.length > 0) {
                console.log(
                    `  ❌ ${shortSource}: ${result.errors.join(', ')}`
                )
                errorCount++
            } else {
                console.log(
                    `  ✅ ${shortSource}: ${result.chunksProcessed} 청크`
                )
                totalChunks += result.chunksProcessed
            }
        }

        console.log()
        console.log('================================================')
        console.log(`  📊 적재 완료 요약`)
        console.log(`  - 총 파일: ${files.length}개`)
        console.log(`  - 총 청크: ${totalChunks}개`)
        console.log(`  - 오류: ${errorCount}개`)
        console.log('================================================')

        if (errorCount > 0) {
            process.exit(1)
        }
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

main().catch((e) => {
    console.error('❌ Knowledge Base 시드 실패:', e)
    process.exit(1)
})
