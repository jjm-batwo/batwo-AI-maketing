/**
 * 마케팅 도메인 지식 인제스트 스크립트
 * Usage: npx tsx scripts/ingest-knowledge.ts
 *
 * 9개 도메인 분석기의 지식 + Meta 2026 가이드라인을 벡터 DB에 저장
 */
import 'dotenv/config'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY 필요')
  process.exit(1)
}

interface KnowledgeDocument {
  source: string
  title: string
  content: string
}

// === 마케팅 도메인 지식 문서 ===
const KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  // 뉴로마케팅
  {
    source: 'neuromarketing',
    title: '인지 부하와 광고 효과',
    content: '광고 텍스트는 12-20단어가 최적입니다. Miller(1956)의 인지 부하 이론에 따르면 단기 기억은 7±2개 정보 단위를 처리할 수 있습니다. Sweller(1988)의 인지 부하 이론은 불필요한 복잡성이 학습과 정보 처리를 방해함을 보여줍니다. 헤드라인은 27자 이내, 본문은 125자 이내가 Meta 광고 권장 기준입니다.',
  },
  {
    source: 'neuromarketing',
    title: '감정 단어와 도파민 반응',
    content: '광고에서 감정적 파워 워드의 비율은 15-30%가 최적입니다. 도파민 트리거에는 기대감(anticipation), 신기함(novelty), 보상 언어(reward)가 있습니다. "무료", "할인", "한정" 같은 단어가 보상 시스템을 활성화합니다. Kahneman의 이중 프로세스 이론에서 System 1(빠른 직관)을 활용하면 인지도 광고에 효과적이고, System 2(느린 분석)는 전환 광고에 적합합니다.',
  },
  // 마케팅 심리학
  {
    source: 'marketing_psychology',
    title: 'Cialdini의 6가지 설득 원칙',
    content: '1. 상호성(Reciprocity): 무료 샘플, 가이드 제공 → 구매 의무감. 2. 희소성(Scarcity): "한정 수량", "오늘만" → 긴급성 유발. 3. 권위(Authority): 전문가 추천, 인증 마크 → 신뢰 구축. 4. 일관성(Consistency): 작은 약속 → 큰 행동 유도. 5. 호감(Liking): 유사성, 칭찬 → 브랜드 친밀감. 6. 사회적 증거(Social Proof): "2,847명이 선택" → 군중 심리.',
  },
  {
    source: 'marketing_psychology',
    title: '인지 편향과 광고',
    content: '앵커링 효과: 정가를 먼저 보여주고 할인가를 제시하면 할인 폭이 커 보입니다. 프레이밍 효과: "90% 성공률"이 "10% 실패율"보다 긍정적으로 인식됩니다. 손실 회피: "놓치면 후회"가 "얻으면 이득"보다 2배 강력합니다. FOMO(Fear of Missing Out): 시간 제한, 재고 표시로 긴급성을 만듭니다.',
  },
  // Meta 2026 베스트 프랙티스
  {
    source: 'meta_best_practices',
    title: 'Meta 2026 Trinity: GEM, Lattice, Andromeda',
    content: 'GEM(예측 모델): 광고 시퀀스를 학습하여 전환 가능성을 예측합니다. 전환 데이터가 부족하면(주 50회 미만) 학습 단계(Learning Phase)에 정체됩니다. Lattice(통합 랭킹): 피드, 릴스, 스토리 등 모든 지면을 통합 랭킹합니다. 크로스 서피스 학습을 위해 캠페인 구조를 단순화해야 합니다. Andromeda(개인화 검색 엔진): Entity ID 기반으로 시각적으로 상이한 소재를 매칭합니다. 10-15개의 시각적으로 다른 소재가 권장됩니다.',
  },
  {
    source: 'meta_best_practices',
    title: 'Meta 광고 포맷 최적화',
    content: '동영상: 가장 높은 참여율, 15초 이하 권장, 세로형(9:16) 우선. 캐러셀: 스토리텔링 효과, 3-5장 권장. 이미지: 빠른 제작, 20% 텍스트 규칙은 폐지되었지만 텍스트 적을수록 효과적. 헤드라인 27자 이내, 본문 125자 이내, 설명 30자 이내가 권장 기준. CTA는 "더 알아보기", "지금 구매하기", "회원가입" 등 명확한 행동 유도.',
  },
  // 크리에이티브 다양성
  {
    source: 'creative_diversity',
    title: 'Entity ID와 광고 피로도',
    content: 'Entity ID는 Meta가 각 소재에 부여하는 고유 식별자입니다. 동일 사용자에게 같은 Entity ID가 3.5회 이상 노출되면 CPA가 19% 상승합니다. 시각적으로 상이한 10-15개 소재를 유지하면 Andromeda 알고리즘이 최적 매칭을 수행합니다. 소재 교체 주기는 2-3주가 권장됩니다. CPM이 급등하면 소재 피로도 신호입니다.',
  },
  // 캠페인 구조
  {
    source: 'campaign_structure',
    title: 'Advantage+ 캠페인 구조 최적화',
    content: 'Advantage+ 캠페인은 Lattice 알고리즘에 최적화된 구조입니다. 캠페인 수를 최소화하고(목표당 1-2개), 광고 세트를 통합해야 합니다. 파편화된 구조(10개 이상 세트)는 학습 데이터가 분산되어 최적화가 느려집니다. 광범위 타겟팅(Broad Targeting)이 수동 타겟팅보다 효과적입니다. 일일 예산 $50 이상이 학습 단계 탈출의 최소 조건입니다.',
  },
  // 추적 건강성
  {
    source: 'tracking_health',
    title: 'CAPI와 EMQ (Event Match Quality)',
    content: 'CAPI(Conversions API)는 서버 사이드 전환 추적입니다. 브라우저 쿠키 제한으로 CAPI 설정이 필수입니다. EMQ(Event Match Quality)는 서버 이벤트와 사용자 매칭 품질을 측정합니다. EMQ 6.0 이상이 권장됩니다. 이벤트 매칭에는 이메일, 전화번호, fbclid 등의 식별자가 사용됩니다. 이벤트 누락률이 20% 이상이면 추적 건강성에 문제가 있습니다.',
  },
  // 예산 최적화
  {
    source: 'budget_optimization',
    title: '광고 예산 배분 전략',
    content: 'ROAS 기반 배분: ROAS가 높은 캠페인에 예산 집중. CPA 기반 배분: 목표 CPA 이하인 캠페인에 예산 우선 할당. 예산 증액은 10-20% 점진적으로, 급격한 증액은 학습 단계를 초기화할 수 있습니다. 안정화 기간(Stabilization Window)을 반드시 확보하세요. 광고비 대비 매출(ROAS)이 2.5배 이상이면 Good, 4배 이상이면 Excellent입니다.',
  },
  // 리드 품질
  {
    source: 'lead_quality',
    title: '리드 품질 관리',
    content: '허수 리드 징후: 무응답률 50% 이상, 이메일 바운스 30% 이상, 전화 부재율 높음. 개선 방법: 1) 리드 폼에 질문 추가(form friction)로 진성 리드만 필터링. 2) Lookalike 소스를 구매자 기반으로 변경. 3) 리드 점수화(Lead Scoring) 도입. 4) 하위 퍼널 이벤트(구매, 장바구니)로 최적화 목표 변경.',
  },
  // 한국 시장 캘린더
  {
    source: 'korean_market',
    title: '한국 마케팅 시즌 캘린더 2026',
    content: '1월: 설날 연휴(선물 세트), 2월: 발렌타인데이, 3월: 화이트데이+신학기, 4월: 봄맞이+아웃도어, 5월: 어버이날+어린이날(가족 마케팅 최대 시즌), 6월: 보너스 시즌, 7-8월: 여름 바캉스+서머 세일, 9월: 추석 연휴(선물 세트), 10월: 할로윈+가을 패션, 11월: 블랙프라이데이+빼빼로데이+수능, 12월: 크리스마스+연말 세일+송년회.',
  },
  // KPI 분석
  {
    source: 'kpi_analysis',
    title: '이커머스 KPI 벤치마크 (한국 시장)',
    content: 'CTR(클릭률): 이커머스 평균 1.5-2.5%, 뷰티 2.0-3.0%, 패션 1.8-2.8%. CVR(전환율): 이커머스 2-4%, 뷰티 3-5%, SaaS 5-8%. CPA(전환 비용): 이커머스 15,000-30,000원, 뷰티 10,000-20,000원. ROAS: 이커머스 목표 3-5배, 뷰티 4-6배. CPM: 이커머스 5,000-15,000원. 성과 급락 시 확인: 소재 피로도, 시즌 변동, 경쟁 심화, 추적 문제.',
  },
  // 카피라이팅 심리학
  {
    source: 'copywriting_psychology',
    title: '효과적인 광고 카피 작성 원칙',
    content: 'SUCCESs 프레임워크: Simple(단순), Unexpected(의외), Concrete(구체적), Credible(신뢰), Emotional(감성), Story(스토리). Hook 유형별 효과: 혜택(benefit) - 가장 범용적, 긴급성(urgency) - 전환율 높음, 사회적 증거(social proof) - 신규 브랜드에 효과적, 호기심(curiosity) - 클릭률 높음. 파워 워드: "무료", "즉시", "한정", "검증된", "비밀", "새로운". CTA는 행동+혜택 조합이 효과적: "지금 구매하고 50% 할인받기".',
  },
]

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })
  if (!response.ok) throw new Error(`Embedding API error: ${response.status}`)
  const data = await response.json()
  return data.data[0].embedding
}

async function main() {
  // Prisma 7 requires adapter — use the project's prisma singleton
  const pg = await import('pg')
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const { PrismaClient } = await import('../src/generated/prisma')

  const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter } as never)

  console.log(`=== 지식 문서 인제스트 시작 ===`)
  console.log(`문서 수: ${KNOWLEDGE_DOCUMENTS.length}`)
  console.log('')

  // 기존 문서 삭제 (재인제스트)
  const deleted = await prisma.$executeRaw`DELETE FROM knowledge_documents`
  console.log(`기존 문서 삭제: ${deleted}건`)

  let success = 0
  let failed = 0

  for (const doc of KNOWLEDGE_DOCUMENTS) {
    try {
      console.log(`[${doc.source}] "${doc.title}" 임베딩 생성 중...`)
      const embedding = await generateEmbedding(`${doc.title}\n${doc.content}`)

      const id = `${doc.source}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      await prisma.$executeRaw`
        INSERT INTO knowledge_documents (id, source, title, content, embedding, metadata, "createdAt", "updatedAt")
        VALUES (
          ${id},
          ${doc.source},
          ${doc.title},
          ${doc.content},
          ${JSON.stringify(embedding)}::vector,
          ${JSON.stringify({ wordCount: doc.content.split(/\s+/).length })}::jsonb,
          NOW(),
          NOW()
        )
      `
      success++
      console.log(`  ✓ 완료 (${embedding.length}차원)`)

      // Rate limit 방지
      await new Promise((r) => setTimeout(r, 200))
    } catch (error) {
      failed++
      console.error(`  ✗ 실패: ${error instanceof Error ? error.message : error}`)
    }
  }

  console.log('')
  console.log(`=== 인제스트 완료 ===`)
  console.log(`성공: ${success}/${KNOWLEDGE_DOCUMENTS.length}`)
  if (failed > 0) console.log(`실패: ${failed}`)

  // 검증
  const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM knowledge_documents`
  console.log(`DB 문서 수: ${JSON.stringify(count)}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('인제스트 실패:', e)
  process.exit(1)
})
