/**
 * 기존 평문 토큰을 AES-256-GCM으로 일괄 암호화하는 마이그레이션 스크립트
 *
 * 사용법:
 *   npx tsx scripts/encrypt-existing-tokens.ts --dry-run   # 미리보기 (실제 변경 없음)
 *   npx tsx scripts/encrypt-existing-tokens.ts              # 실제 실행
 *
 * 대상 테이블:
 *   - MetaAdAccount.accessToken
 *   - PlatformIntegration.accessToken, refreshToken
 *   - OAuthSession.accessToken
 *
 * 주의:
 *   - TOKEN_ENCRYPTION_KEY 환경변수가 반드시 설정되어 있어야 합니다.
 *   - 이미 암호화된 토큰은 자동으로 스킵됩니다.
 *   - --dry-run 플래그로 먼저 확인 후 실행하세요.
 */

import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { encryptToken, isEncrypted } from '../src/application/utils/TokenEncryption'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const isDryRun = process.argv.includes('--dry-run')

interface MigrationResult {
    table: string
    total: number
    encrypted: number
    skipped: number
    errors: string[]
}

async function encryptMetaAdAccountTokens(): Promise<MigrationResult> {
    const result: MigrationResult = {
        table: 'MetaAdAccount',
        total: 0,
        encrypted: 0,
        skipped: 0,
        errors: [],
    }

    const accounts = await prisma.metaAdAccount.findMany({
        select: { id: true, accessToken: true, userId: true },
    })

    result.total = accounts.length

    for (const account of accounts) {
        try {
            if (isEncrypted(account.accessToken)) {
                result.skipped++
                continue
            }

            const encrypted = encryptToken(account.accessToken)

            if (!isDryRun) {
                await prisma.metaAdAccount.update({
                    where: { id: account.id },
                    data: { accessToken: encrypted },
                })
            }

            result.encrypted++
            console.log(
                `  ${isDryRun ? '[DRY-RUN] ' : ''}MetaAdAccount ${account.id.substring(0, 8)}... → 암호화 완료 (userId: ${account.userId.substring(0, 8)}...)`
            )
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error'
            result.errors.push(`MetaAdAccount ${account.id}: ${msg}`)
        }
    }

    return result
}

async function encryptPlatformIntegrationTokens(): Promise<MigrationResult> {
    const result: MigrationResult = {
        table: 'PlatformIntegration',
        total: 0,
        encrypted: 0,
        skipped: 0,
        errors: [],
    }

    const integrations = await prisma.platformIntegration.findMany({
        select: { id: true, accessToken: true, refreshToken: true },
    })

    result.total = integrations.length

    for (const integration of integrations) {
        try {
            let needsUpdate = false
            const updateData: { accessToken?: string; refreshToken?: string } = {}

            // accessToken 처리
            if (!isEncrypted(integration.accessToken)) {
                updateData.accessToken = encryptToken(integration.accessToken)
                needsUpdate = true
            }

            // refreshToken 처리
            if (integration.refreshToken && !isEncrypted(integration.refreshToken)) {
                updateData.refreshToken = encryptToken(integration.refreshToken)
                needsUpdate = true
            }

            if (!needsUpdate) {
                result.skipped++
                continue
            }

            if (!isDryRun) {
                await prisma.platformIntegration.update({
                    where: { id: integration.id },
                    data: updateData,
                })
            }

            result.encrypted++
            console.log(
                `  ${isDryRun ? '[DRY-RUN] ' : ''}PlatformIntegration ${integration.id.substring(0, 8)}... → 암호화 완료`
            )
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error'
            result.errors.push(`PlatformIntegration ${integration.id}: ${msg}`)
        }
    }

    return result
}

async function encryptOAuthSessionTokens(): Promise<MigrationResult> {
    const result: MigrationResult = {
        table: 'OAuthSession',
        total: 0,
        encrypted: 0,
        skipped: 0,
        errors: [],
    }

    const sessions = await prisma.oAuthSession.findMany({
        select: { id: true, accessToken: true },
    })

    result.total = sessions.length

    for (const session of sessions) {
        try {
            if (isEncrypted(session.accessToken)) {
                result.skipped++
                continue
            }

            const encrypted = encryptToken(session.accessToken)

            if (!isDryRun) {
                await prisma.oAuthSession.update({
                    where: { id: session.id },
                    data: { accessToken: encrypted },
                })
            }

            result.encrypted++
            console.log(
                `  ${isDryRun ? '[DRY-RUN] ' : ''}OAuthSession ${session.id.substring(0, 8)}... → 암호화 완료`
            )
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error'
            result.errors.push(`OAuthSession ${session.id}: ${msg}`)
        }
    }

    return result
}

async function main() {
    console.log('='.repeat(60))
    console.log('🔐 기존 평문 토큰 → AES-256-GCM 일괄 암호화')
    console.log('='.repeat(60))

    if (isDryRun) {
        console.log('📋 [DRY-RUN 모드] 실제 DB 변경 없이 미리보기만 합니다.\n')
    } else {
        console.log('⚡ [실행 모드] 실제 DB에 암호화를 적용합니다.\n')
    }

    // TOKEN_ENCRYPTION_KEY 확인
    if (!process.env.TOKEN_ENCRYPTION_KEY) {
        console.error('❌ TOKEN_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.')
        console.error('   .env 파일에 다음을 추가하세요:')
        console.error('   TOKEN_ENCRYPTION_KEY="<64자 hex 문자열>"')
        process.exit(1)
    }

    console.log(`✅ TOKEN_ENCRYPTION_KEY 확인 완료 (길이: ${process.env.TOKEN_ENCRYPTION_KEY.length}자)\n`)

    const results: MigrationResult[] = []

    // 1. MetaAdAccount
    console.log('📌 MetaAdAccount.accessToken 처리 중...')
    results.push(await encryptMetaAdAccountTokens())

    // 2. PlatformIntegration
    console.log('\n📌 PlatformIntegration.accessToken/refreshToken 처리 중...')
    results.push(await encryptPlatformIntegrationTokens())

    // 3. OAuthSession
    console.log('\n📌 OAuthSession.accessToken 처리 중...')
    results.push(await encryptOAuthSessionTokens())

    // 결과 요약
    console.log('\n' + '='.repeat(60))
    console.log('📊 결과 요약')
    console.log('='.repeat(60))

    let totalEncrypted = 0
    let totalErrors = 0

    for (const result of results) {
        const status = result.errors.length > 0 ? '⚠️' : '✅'
        console.log(
            `${status} ${result.table}: 전체 ${result.total}개 → 암호화 ${result.encrypted}개, 스킵(이미 암호화) ${result.skipped}개, 오류 ${result.errors.length}개`
        )
        totalEncrypted += result.encrypted
        totalErrors += result.errors.length

        if (result.errors.length > 0) {
            for (const err of result.errors) {
                console.log(`   ❗ ${err}`)
            }
        }
    }

    console.log('')
    if (isDryRun) {
        console.log(`📋 [DRY-RUN] 총 ${totalEncrypted}개 토큰이 암호화 대상입니다.`)
        console.log('   실제 적용하려면 --dry-run 플래그를 제거하고 다시 실행하세요.')
    } else {
        console.log(`✅ 총 ${totalEncrypted}개 토큰이 성공적으로 암호화되었습니다.`)
    }

    if (totalErrors > 0) {
        console.log(`⚠️ ${totalErrors}개 오류가 발생했습니다. 위 로그를 확인하세요.`)
    }
}

main()
    .catch((error) => {
        console.error('❌ 치명적 오류:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
