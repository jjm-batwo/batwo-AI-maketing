import { PrismaClient, CampaignObjective, CampaignStatus, ReportType, ReportStatus, GlobalRole } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import { encryptToken } from '../src/application/utils/TokenEncryption';

// Prisma 7.x: pg adapter 사용
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
// Meta 앱 검수용 데모 데이터 (스크린캐스트 촬영용)
// =============================================================================
async function seedDemoData() {
  console.log('🎬 Demo Seed: Meta 앱 검수용 데모 데이터 생성 중...');

  // 1. 관리자 사용자 생성
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@batwo.ai' },
    update: { globalRole: GlobalRole.SUPER_ADMIN },
    create: {
      id: 'demo-admin-001',
      email: 'admin@batwo.ai',
      name: '바투 관리자',
      emailVerified: new Date(),
      globalRole: GlobalRole.SUPER_ADMIN,
    },
  });
  console.log(`✅ 관리자 사용자 생성: ${adminUser.email}`);

  // 1-2. 관리자용 Meta 광고 계정 연결
  await prisma.metaAdAccount.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      metaAccountId: 'act_admin_987654321',
      accessToken: encryptToken('admin_demo_access_token_for_review'),
      businessName: '바투 관리자 계정',
      currency: 'KRW',
      timezone: 'Asia/Seoul',
    },
  });
  console.log(`✅ 관리자 Meta 광고 계정 연결 완료`);

  // 2. 데모 사용자 생성 (Meta 연동된 사용자)
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@batwo.ai' },
    update: {},
    create: {
      id: 'demo-user-001',
      email: 'demo@batwo.ai',
      name: '김마케터',
      emailVerified: new Date(),
      globalRole: GlobalRole.USER,
    },
  });
  console.log(`✅ 데모 사용자 생성: ${demoUser.email}`);

  // 3. Meta 광고 계정 연결 (데모용)
  await prisma.metaAdAccount.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      metaAccountId: 'act_123456789012345',
      accessToken: encryptToken('demo_access_token_for_review'),
      businessName: '바투컴퍼니',
      currency: 'KRW',
      timezone: 'Asia/Seoul',
    },
  });
  console.log(`✅ Meta 광고 계정 연결 완료`);

  // 4. 다양한 상태의 캠페인 생성
  const campaignData = [
    {
      id: 'demo-campaign-001',
      name: '2025 신년 프로모션 캠페인',
      objective: CampaignObjective.CONVERSIONS,
      status: CampaignStatus.ACTIVE,
      dailyBudget: 150000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      targetAudience: {
        ageMin: 25,
        ageMax: 45,
        gender: 'all',
        interests: ['온라인 쇼핑', '패션', '뷰티'],
        locations: ['서울', '경기'],
      },
    },
    {
      id: 'demo-campaign-002',
      name: '브랜드 인지도 확대 캠페인',
      objective: CampaignObjective.AWARENESS,
      status: CampaignStatus.ACTIVE,
      dailyBudget: 80000,
      startDate: new Date('2025-01-10'),
      endDate: new Date('2025-02-28'),
      targetAudience: {
        ageMin: 20,
        ageMax: 55,
        gender: 'all',
        interests: ['스타트업', 'IT', '마케팅'],
        locations: ['전국'],
      },
    },
    {
      id: 'demo-campaign-003',
      name: '앱 다운로드 유도 캠페인',
      objective: CampaignObjective.APP_PROMOTION,
      status: CampaignStatus.PAUSED,
      dailyBudget: 200000,
      startDate: new Date('2025-01-05'),
      endDate: new Date('2025-03-31'),
      targetAudience: {
        ageMin: 18,
        ageMax: 35,
        gender: 'all',
        interests: ['모바일 앱', '게임', '엔터테인먼트'],
        locations: ['서울', '부산', '대구'],
      },
    },
    {
      id: 'demo-campaign-004',
      name: '리드 수집 캠페인',
      objective: CampaignObjective.LEADS,
      status: CampaignStatus.ACTIVE,
      dailyBudget: 120000,
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-02-15'),
      targetAudience: {
        ageMin: 30,
        ageMax: 50,
        gender: 'all',
        interests: ['B2B', '비즈니스', '마케팅 솔루션'],
        locations: ['서울', '경기'],
      },
    },
    {
      id: 'demo-campaign-005',
      name: '설 연휴 특가 캠페인',
      objective: CampaignObjective.SALES,
      status: CampaignStatus.DRAFT,
      dailyBudget: 300000,
      startDate: new Date('2025-01-25'),
      endDate: new Date('2025-02-05'),
      targetAudience: {
        ageMin: 25,
        ageMax: 60,
        gender: 'all',
        interests: ['선물', '명절', '쇼핑'],
        locations: ['전국'],
      },
    },
  ];

  // 데모 사용자 캠페인 생성
  const demoCampaigns = await Promise.all(
    campaignData.map((c) =>
      prisma.campaign.upsert({
        where: { id: c.id },
        update: {},
        create: {
          ...c,
          userId: demoUser.id,
          currency: 'KRW',
          metaCampaignId: `meta_${c.id}`,
        },
      })
    )
  );
  console.log(`✅ 데모 사용자 캠페인 생성: ${demoCampaigns.length}개`);

  // 관리자용 캠페인 생성 (동일한 데이터를 관리자 계정으로)
  const adminCampaignData = campaignData.map((c) => ({
    ...c,
    id: c.id.replace('demo-', 'admin-'),
    name: `[관리자] ${c.name}`,
  }));

  const adminCampaigns = await Promise.all(
    adminCampaignData.map((c) =>
      prisma.campaign.upsert({
        where: { id: c.id },
        update: {},
        create: {
          ...c,
          userId: adminUser.id,
          currency: 'KRW',
          metaCampaignId: `meta_${c.id}`,
        },
      })
    )
  );
  console.log(`✅ 관리자 캠페인 생성: ${adminCampaigns.length}개`);

  // 모든 캠페인 합치기
  const campaigns = [...demoCampaigns, ...adminCampaigns];
  console.log(`✅ 총 캠페인 생성: ${campaigns.length}개`);

  // 5. 풍부한 KPI 스냅샷 생성 (30일치)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const kpiSnapshots: Array<{
    campaignId: string;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    currency: string;
    revenue: number;
    date: Date;
  }> = [];

  // 활성 캠페인들에 대해 30일치 데이터 생성
  const activeCampaigns = campaigns.filter(
    (c) => c.status === CampaignStatus.ACTIVE || c.status === CampaignStatus.PAUSED
  );

  for (const campaign of activeCampaigns) {
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // 캠페인별로 다른 성과 패턴 생성
      const baseImpressions = campaign.objective === CampaignObjective.AWARENESS ? 15000 : 8000;
      const baseCTR = campaign.objective === CampaignObjective.CONVERSIONS ? 0.035 : 0.025;
      const baseConvRate = campaign.objective === CampaignObjective.CONVERSIONS ? 0.08 : 0.03;

      // 주말에는 성과가 더 좋음
      const dayOfWeek = date.getDay();
      const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1.0;

      // 랜덤 변동 추가
      const randomFactor = 0.8 + Math.random() * 0.4;

      const impressions = Math.floor(baseImpressions * weekendBoost * randomFactor);
      const clicks = Math.floor(impressions * baseCTR * randomFactor);
      const conversions = Math.floor(clicks * baseConvRate * randomFactor);
      const spend = Math.floor(Number(campaign.dailyBudget) * (0.7 + Math.random() * 0.3));
      const revenue = conversions * (15000 + Math.floor(Math.random() * 35000));

      kpiSnapshots.push({
        campaignId: campaign.id,
        impressions,
        clicks,
        conversions,
        spend,
        currency: 'KRW',
        revenue,
        date,
      });
    }
  }

  // 기존 KPI 삭제 후 새로 생성
  await prisma.kPISnapshot.deleteMany({
    where: { campaignId: { in: activeCampaigns.map((c) => c.id) } },
  });
  await prisma.kPISnapshot.createMany({ data: kpiSnapshots });
  console.log(`✅ KPI 스냅샷 생성: ${kpiSnapshots.length}개 (30일치)`);

  // 6. 주간 보고서 생성
  const reports = [
    {
      id: 'demo-report-001',
      type: ReportType.WEEKLY,
      campaignIds: [campaigns[0].id, campaigns[1].id],
      startDate: new Date('2025-01-13'),
      endDate: new Date('2025-01-19'),
      status: ReportStatus.GENERATED,
      generatedAt: new Date('2025-01-20T09:00:00'),
      sections: [
        {
          title: '주간 요약',
          content:
            '이번 주 전체 캠페인 성과가 전주 대비 15% 향상되었습니다. 특히 신년 프로모션 캠페인의 전환율이 크게 개선되었습니다.',
          // Metrics for KPI calculation
          metrics: {
            impressions: 245000,
            clicks: 8500,
            conversions: 680,
            spend: 1420000,
            revenue: 4686000, // ROAS 약 3.3
          },
        },
        {
          title: 'KPI 분석',
          content:
            '총 노출수 245,000회, 클릭수 8,500회, 전환수 680건을 기록했습니다. CTR 3.47%, CVR 8.0%로 업계 평균을 상회합니다.',
        },
        {
          title: '예산 소진 현황',
          content:
            '주간 예산 1,610,000원 중 1,420,000원(88%)을 소진했습니다. 효율적인 예산 운영이 이루어지고 있습니다.',
        },
      ],
      aiInsights: [
        {
          type: 'performance',
          insight: '신년 프로모션 캠페인의 전환율이 전주 대비 23% 상승했습니다. 현재 광고 소재 유지를 권장합니다.',
        },
        {
          type: 'recommendation',
          insight:
            '브랜드 인지도 캠페인의 CTR 개선을 위해 새로운 헤드라인 A/B 테스트를 권장합니다.',
        },
        {
          type: 'anomaly',
          insight:
            '앱 다운로드 캠페인의 일일 예산이 오후 3시경 소진되고 있습니다. 예산 증액 또는 입찰가 조정을 검토해주세요.',
        },
        {
          type: 'trend',
          insight: '25-34세 여성 타겟에서 가장 높은 ROAS(4.2)를 기록하고 있습니다. 해당 타겟 비중 확대를 고려해보세요.',
        },
      ],
    },
    {
      id: 'demo-report-002',
      type: ReportType.WEEKLY,
      campaignIds: [campaigns[0].id],
      startDate: new Date('2025-01-06'),
      endDate: new Date('2025-01-12'),
      status: ReportStatus.SENT,
      generatedAt: new Date('2025-01-13T09:00:00'),
      sentAt: new Date('2025-01-13T09:30:00'),
      sections: [
        {
          title: '주간 요약',
          content: '신년 프로모션 캠페인 첫 주 성과입니다. 초기 학습 기간을 거쳐 성과가 안정화되고 있습니다.',
          // Metrics for KPI calculation
          metrics: {
            impressions: 180000,
            clicks: 5200,
            conversions: 320,
            spend: 980000,
            revenue: 2744000, // ROAS 약 2.8
          },
        },
      ],
      aiInsights: [
        {
          type: 'trend',
          insight: 'Meta 알고리즘 학습이 완료되었습니다. 본격적인 성과 최적화가 시작됩니다.',
        },
      ],
    },
  ];

  // 데모 사용자 보고서 생성
  for (const report of reports) {
    await prisma.report.upsert({
      where: { id: report.id },
      update: {
        // Update sections and aiInsights if report already exists
        sections: report.sections,
        aiInsights: report.aiInsights,
      },
      create: {
        ...report,
        userId: demoUser.id,
      },
    });
  }
  console.log(`✅ 데모 사용자 보고서 생성: ${reports.length}개`);

  // 관리자용 보고서 생성 (동일 데이터, 관리자 캠페인 ID로)
  const adminReports = reports.map((r) => ({
    ...r,
    id: r.id.replace('demo-', 'admin-'),
    campaignIds: r.campaignIds.map((id: string) => id.replace('demo-', 'admin-')),
  }));

  for (const report of adminReports) {
    await prisma.report.upsert({
      where: { id: report.id },
      update: {
        // Update sections and aiInsights if report already exists
        sections: report.sections,
        aiInsights: report.aiInsights,
      },
      create: {
        ...report,
        userId: adminUser.id,
      },
    });
  }
  console.log(`✅ 관리자 보고서 생성: ${adminReports.length}개`);

  // 7. 예산 알림 설정
  for (const campaign of campaigns.filter((c) => c.status === CampaignStatus.ACTIVE)) {
    await prisma.budgetAlert.upsert({
      where: { campaignId: campaign.id },
      update: {},
      create: {
        campaignId: campaign.id,
        thresholdPercent: 80,
        isEnabled: true,
      },
    });
  }
  console.log(`✅ 예산 알림 설정 완료`);

  // 8. Meta API 로그 (성공 기록)
  const apiLogs = [];
  for (let i = 0; i < 50; i++) {
    const date = new Date();
    date.setHours(date.getHours() - i * 2);
    apiLogs.push({
      endpoint: ['campaigns', 'insights', 'adaccount', 'adsets'][Math.floor(Math.random() * 4)],
      method: 'GET',
      statusCode: 200,
      success: true,
      latencyMs: 100 + Math.floor(Math.random() * 300),
      accountId: 'act_123456789012345',
      createdAt: date,
    });
  }
  await prisma.metaApiLog.createMany({ data: apiLogs, skipDuplicates: true });
  console.log(`✅ Meta API 로그 생성: ${apiLogs.length}개`);

  // 9. 사용량 로그
  const usageLogs = [
    { userId: demoUser.id, type: 'CAMPAIGN_CREATE', createdAt: new Date('2025-01-01T10:00:00') },
    { userId: demoUser.id, type: 'CAMPAIGN_CREATE', createdAt: new Date('2025-01-05T14:00:00') },
    { userId: demoUser.id, type: 'CAMPAIGN_CREATE', createdAt: new Date('2025-01-10T11:00:00') },
    { userId: demoUser.id, type: 'AI_COPY_GEN', createdAt: new Date('2025-01-02T09:00:00') },
    { userId: demoUser.id, type: 'AI_COPY_GEN', createdAt: new Date('2025-01-05T15:00:00') },
    { userId: demoUser.id, type: 'AI_COPY_GEN', createdAt: new Date('2025-01-08T16:00:00') },
    { userId: demoUser.id, type: 'AI_COPY_GEN', createdAt: new Date('2025-01-12T10:00:00') },
    { userId: demoUser.id, type: 'AI_ANALYSIS', createdAt: new Date('2025-01-07T11:00:00') },
    { userId: demoUser.id, type: 'AI_ANALYSIS', createdAt: new Date('2025-01-14T14:00:00') },
  ];
  await prisma.usageLog.createMany({ data: usageLogs, skipDuplicates: true });
  console.log(`✅ 사용량 로그 생성: ${usageLogs.length}개`);

  // 10. 구독 정보 생성
  await prisma.subscription.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      plan: 'PRO',
      status: 'ACTIVE',
      currentPeriodStart: new Date('2025-01-01'),
      currentPeriodEnd: new Date('2025-02-01'),
    },
  });
  console.log(`✅ 구독 정보 생성 완료`);

  console.log('');
  console.log('🎬 Demo Seed 완료!');
  console.log('================================================');
  console.log('📧 관리자 로그인: admin@batwo.ai');
  console.log('📧 데모 사용자: demo@batwo.ai');
  console.log('================================================');
}

// =============================================================================
// 메인 함수
// =============================================================================
async function main() {
  console.log('================================================');
  console.log('  바투 AI 마케팅 솔루션 - 데이터베이스 시드');
  console.log('================================================');

  // CLI 인자로 --demo 옵션 확인
  const isDemo = process.argv.includes('--demo');

  console.log(`환경: ${isProduction ? 'Production' : isStaging ? 'Staging' : 'Development'}`);
  console.log(`모드: ${isDemo ? 'Demo (Meta 앱 검수용)' : 'Standard'}`);
  console.log('');

  if (isDemo) {
    await seedDemoData();
  } else if (isProduction) {
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
