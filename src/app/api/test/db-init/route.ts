import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Test Database Initialization API
 *
 * E2E 테스트를 위한 데이터베이스 초기화 및 시드
 * - 프로덕션에서는 비활성화됨
 * - 테스트 환경에서만 사용
 */
export async function GET() {
  // 프로덕션 환경에서는 차단
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_API) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  // DATABASE_URL에 'test'가 포함되어 있는지 확인 (안전장치)
  const databaseUrl = process.env.DATABASE_URL || ''
  if (!databaseUrl.includes('test') && process.env.NODE_ENV !== 'test') {
    console.warn('[DB Init] Skipping database init - not a test database')
    return NextResponse.json({
      success: false,
      message: 'Not a test database - skipping init',
    })
  }

  try {
    console.log('[DB Init] Initializing test database...')

    // 1. 테스트 사용자 생성 또는 조회
    const testUser = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: new Date(),
        globalRole: 'USER',
      },
    })

    console.log('[DB Init] Test user created:', testUser.email)

    // 2. 테스트 Meta 연동 생성
    await prisma.metaAdAccount.upsert({
      where: { userId: testUser.id },
      update: {
        metaAccountId: 'act_123456789',
        accessToken: 'test_token',
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60일
      },
      create: {
        userId: testUser.id,
        metaAccountId: 'act_123456789',
        accessToken: 'test_token',
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    })

    console.log('[DB Init] Meta ad account created')

    // 3. 테스트 캠페인 생성 또는 업데이트
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        userId: testUser.id,
        metaCampaignId: 'campaign_test_001',
      },
    })

    const testCampaign = existingCampaign
      ? await prisma.campaign.update({
          where: { id: existingCampaign.id },
          data: {
            name: 'E2E Test Campaign',
            status: 'ACTIVE',
            objective: 'CONVERSIONS',
            dailyBudget: 50000,
          },
        })
      : await prisma.campaign.create({
          data: {
            userId: testUser.id,
            metaCampaignId: 'campaign_test_001',
            name: 'E2E Test Campaign',
            status: 'ACTIVE',
            objective: 'CONVERSIONS',
            dailyBudget: 50000,
            startDate: new Date(),
          },
        })

    console.log('[DB Init] Test campaign created:', testCampaign.name)

    // 4. 테스트 KPI 데이터 생성
    const today = new Date(new Date().setHours(0, 0, 0, 0))
    const existingKPI = await prisma.kPISnapshot.findFirst({
      where: {
        campaignId: testCampaign.id,
        date: today,
      },
    })

    const testKPI = existingKPI
      ? await prisma.kPISnapshot.update({
          where: { id: existingKPI.id },
          data: {
            impressions: 10000,
            clicks: 500,
            spend: 25000,
            conversions: 50,
            revenue: 125000,
          },
        })
      : await prisma.kPISnapshot.create({
          data: {
            campaignId: testCampaign.id,
            date: today,
            impressions: 10000,
            clicks: 500,
            spend: 25000,
            conversions: 50,
            revenue: 125000,
          },
        })

    console.log('[DB Init] Test KPI snapshot created')

    return NextResponse.json({
      success: true,
      message: 'Test database initialized',
      data: {
        user: {
          id: testUser.id,
          email: testUser.email,
        },
        campaign: {
          id: testCampaign.id,
          name: testCampaign.name,
        },
        kpi: {
          impressions: testKPI.impressions,
          clicks: testKPI.clicks,
          spend: testKPI.spend,
        },
      },
    })
  } catch (error) {
    console.error('[DB Init] Error initializing database:', error)

    // Prisma가 없는 경우 (DB 연결 실패)
    if (error instanceof Error && error.message.includes('PrismaClient')) {
      return NextResponse.json({
        success: false,
        message: 'Database not available - skipping init',
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * 테스트 데이터 정리
 */
export async function DELETE() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_API) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const databaseUrl = process.env.DATABASE_URL || ''
  if (!databaseUrl.includes('test') && process.env.NODE_ENV !== 'test') {
    return NextResponse.json({
      success: false,
      message: 'Not a test database - skipping cleanup',
    })
  }

  try {
    console.log('[DB Cleanup] Cleaning up test data...')

    // 테스트 데이터 삭제
    await prisma.kPISnapshot.deleteMany({
      where: {
        campaign: {
          user: {
            email: 'test@example.com',
          },
        },
      },
    })

    await prisma.campaign.deleteMany({
      where: {
        user: {
          email: 'test@example.com',
        },
      },
    })

    await prisma.metaAdAccount.deleteMany({
      where: {
        user: {
          email: 'test@example.com',
        },
      },
    })

    await prisma.user.deleteMany({
      where: {
        email: 'test@example.com',
      },
    })

    console.log('[DB Cleanup] Test data cleaned up')

    return NextResponse.json({
      success: true,
      message: 'Test data cleaned up',
    })
  } catch (error) {
    console.error('[DB Cleanup] Error cleaning up:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
