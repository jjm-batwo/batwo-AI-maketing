import { PrismaClient, CampaignObjective, CampaignStatus, ReportType, ReportStatus } from '../src/generated/prisma';

const prisma = new PrismaClient();

// =============================================================================
// 환경 확인
// =============================================================================
const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.NEXT_PUBLIC_APP_URL?.includes('staging');

// =============================================================================
// 프로덕션 시드 데이터 (필수 데이터만)
// =============================================================================
async function seedProduction() {
  console.log('🌱 Production Seed: 필수 데이터 생성 중...');

  // 프로덕션에서는 필수 시스템 데이터만 생성
  // 현재는 추가 시스템 데이터가 없으므로 스킵
  console.log('✅ Production: 필수 데이터 시드 완료 (추가 데이터 없음)');
}

// =============================================================================
// 개발/스테이징 시드 데이터 (테스트용)
// =============================================================================
async function seedDevelopment() {
  console.log('🌱 Development Seed: 테스트 데이터 생성 중...');

  // 테스트 사용자 생성
  const testUser = await prisma.user.upsert({
    where: { email: 'test@batwo.ai' },
    update: {},
    create: {
      email: 'test@batwo.ai',
      name: '테스트 사용자',
      emailVerified: new Date(),
    },
  });
  console.log(`✅ 테스트 사용자 생성: ${testUser.email}`);

  // 테스트 캠페인 생성
  const campaigns = await Promise.all([
    prisma.campaign.upsert({
      where: { id: 'test-campaign-1' },
      update: {},
      create: {
        id: 'test-campaign-1',
        userId: testUser.id,
        name: '테스트 브랜드 인지도 캠페인',
        objective: CampaignObjective.AWARENESS,
        status: CampaignStatus.ACTIVE,
        dailyBudget: 50000,
        currency: 'KRW',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        targetAudience: {
          ageMin: 25,
          ageMax: 45,
          interests: ['마케팅', 'AI', '스타트업'],
        },
      },
    }),
    prisma.campaign.upsert({
      where: { id: 'test-campaign-2' },
      update: {},
      create: {
        id: 'test-campaign-2',
        userId: testUser.id,
        name: '테스트 전환 캠페인',
        objective: CampaignObjective.CONVERSIONS,
        status: CampaignStatus.DRAFT,
        dailyBudget: 100000,
        currency: 'KRW',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        targetAudience: {
          ageMin: 30,
          ageMax: 55,
          interests: ['이커머스', '온라인 쇼핑'],
        },
      },
    }),
  ]);
  console.log(`✅ 테스트 캠페인 생성: ${campaigns.length}개`);

  // 테스트 KPI 스냅샷 생성
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const kpiSnapshots = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    kpiSnapshots.push({
      campaignId: campaigns[0].id,
      impressions: Math.floor(Math.random() * 10000) + 5000,
      clicks: Math.floor(Math.random() * 500) + 100,
      conversions: Math.floor(Math.random() * 50) + 10,
      spend: Math.floor(Math.random() * 30000) + 20000,
      currency: 'KRW',
      revenue: Math.floor(Math.random() * 100000) + 50000,
      date: date,
    });
  }

  await prisma.kPISnapshot.createMany({
    data: kpiSnapshots,
    skipDuplicates: true,
  });
  console.log(`✅ 테스트 KPI 스냅샷 생성: ${kpiSnapshots.length}개`);

  // 테스트 리포트 생성
  const report = await prisma.report.upsert({
    where: { id: 'test-report-1' },
    update: {},
    create: {
      id: 'test-report-1',
      userId: testUser.id,
      type: ReportType.WEEKLY,
      campaignIds: [campaigns[0].id],
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      status: ReportStatus.GENERATED,
      generatedAt: new Date(),
      sections: [
        { title: '요약', content: '이번 주 캠페인 성과 요약입니다.' },
        { title: 'KPI 분석', content: '주요 KPI 분석 결과입니다.' },
      ],
      aiInsights: [
        { type: 'optimization', content: 'CTR 개선을 위해 광고 소재 A/B 테스트를 권장합니다.' },
        { type: 'warning', content: 'CPA가 목표 대비 15% 높습니다.' },
      ],
    },
  });
  console.log(`✅ 테스트 리포트 생성: ${report.id}`);

  // 테스트 사용량 로그 생성
  const usageLogs = [
    { userId: testUser.id, type: 'CAMPAIGN_CREATE' },
    { userId: testUser.id, type: 'AI_COPY_GEN' },
    { userId: testUser.id, type: 'AI_COPY_GEN' },
    { userId: testUser.id, type: 'AI_ANALYSIS' },
  ];

  await prisma.usageLog.createMany({
    data: usageLogs,
    skipDuplicates: true,
  });
  console.log(`✅ 테스트 사용량 로그 생성: ${usageLogs.length}개`);

  console.log('✅ Development: 테스트 데이터 시드 완료');
}

// =============================================================================
// 메인 함수
// =============================================================================
async function main() {
  console.log('================================================');
  console.log('  바투 AI 마케팅 솔루션 - 데이터베이스 시드');
  console.log('================================================');
  console.log(`환경: ${isProduction ? 'Production' : isStaging ? 'Staging' : 'Development'}`);
  console.log('');

  if (isProduction) {
    await seedProduction();
  } else {
    await seedDevelopment();
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
