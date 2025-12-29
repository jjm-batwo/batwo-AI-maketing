# 바투 AI 마케팅 솔루션 - Claude 지침

## 프로젝트 개요
커머스 사업자를 위한 AI 마케팅 대행 솔루션. Meta 광고 캠페인 자동화, KPI 대시보드, 주간 보고서 생성.

## 기술 스택
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL + Prisma 7.x
- **Auth**: NextAuth.js v5
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand + TanStack Query
- **Testing**: Vitest + Playwright

## 클린 아키텍처 구조

```
src/
├── domain/           # 핵심 비즈니스 로직 (외부 의존성 없음)
│   ├── entities/     # Campaign, Report, KPI
│   ├── value-objects/# Money, DateRange
│   └── repositories/ # 인터페이스 (포트)
│
├── application/      # 유스케이스
│   ├── use-cases/    # CreateCampaign, GenerateReport
│   ├── dto/          # Data Transfer Objects
│   └── ports/        # 외부 서비스 인터페이스
│
├── infrastructure/   # 어댑터 구현
│   ├── database/     # Prisma 리포지토리
│   ├── external/     # Meta Ads, OpenAI
│   └── auth/         # NextAuth 설정
│
├── presentation/     # UI 계층
│   ├── components/   # React 컴포넌트
│   ├── hooks/        # 커스텀 훅
│   └── stores/       # Zustand 스토어
│
└── app/              # Next.js App Router
```

**의존성 규칙**: domain ← application ← infrastructure/presentation

## TDD 개발 방식

### 필수 프로세스
```
🔴 RED    → 실패하는 테스트 먼저 작성
🟢 GREEN  → 테스트 통과하는 최소 구현
🔵 REFACTOR → 코드 정리 (테스트 유지)
```

### 테스트 구조
```
tests/
├── unit/           # 단위 테스트 (domain, application)
├── integration/    # 통합 테스트 (repositories)
└── e2e/            # E2E 테스트 (Playwright)
```

### 커버리지 목표
- Domain: ≥95%
- Application: ≥90%
- Infrastructure: ≥85%
- E2E: 주요 시나리오 100%

## 주요 명령어

```bash
npm run dev          # 개발 서버
npm run build        # 빌드
npm run type-check   # 타입 체크
npm run lint         # ESLint
npm test             # 단위 테스트
npm run test:int     # 통합 테스트
npx playwright test  # E2E 테스트
```

## MVP 사용량 제한
- 캠페인 생성: 5회/주
- AI 카피 생성: 20회/일
- AI 분석: 5회/주

## 계획 수립 규칙

**기능 구현 계획 시 반드시 `/feature-planner` 스킬 사용**:
- 새 기능 구현 요청 시 → `/feature-planner` 실행
- 복잡한 리팩토링 계획 시 → `/feature-planner` 실행
- 다단계 작업 계획 시 → `/feature-planner` 실행

```bash
# 예시
/feature-planner "사용자 인증 시스템 구현"
/feature-planner "Meta Ads API 연동"
```

계획 파일은 `docs/plans/` 디렉토리에 저장됩니다.

## 참고 문서
- 상세 구현 계획: `docs/plans/PLAN_batwo-ai-marketing.md`
- Prisma 스키마: `prisma/schema.prisma`
- 환경 변수: `.env.example`
