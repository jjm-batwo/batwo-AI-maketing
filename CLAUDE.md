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

## 바투 AI 개발팀 시스템

**모든 개발 관련 요청은 AI 개발팀을 통해 처리**

### 팀 구성
| 역할 | 담당 업무 | 자동 실행 |
|------|----------|----------|
| **총괄 PM** | 모든 요청 접수, 작업 분배 | 항상 |
| **품질 관리자** | 테스트 실행, 품질 검증 | 코드 변경 후 |
| **보안 책임자** | 보안 검사, 취약점 탐지 | API/인증 변경 시 |
| **분석 담당** | 오류 분석, 성능 모니터링 | 에러 발생 시 |
| **설계 담당** | 아키텍처 검토 | 새 기능 요청 시 |
| **개발 담당** | 기능 구현 | 구현 요청 시 |
| **문서 담당** | 변경사항 기록 | 모든 작업 완료 후 |

### 기본 명령어
```
/상태          현재 시스템 상태 확인
/기능요청      새 기능 요청 (→ PM Agent → Feature Planner 자동 실행)
/버그신고      버그 신고 (→ QA Agent 자동 분석)
/검증          모든 품질 검사 실행
/배포          프로덕션 배포 (승인 필요)
/보고서        일일 또는 주간 보고서 생성
```

### 정보 확인 명령어
```
/변경사항      최근 코드 변경 내역
/진행상황      진행 중인 작업 목록
/품질          테스트 커버리지, 린트 결과
/보안          보안 검사 결과
```

### 작업 명령어
```
/수정 #123     Issue #123 수정 시작
/승인          대기 중인 작업 승인
/거부          대기 중인 작업 거부
/롤백          이전 버전으로 복원
/문의          도움말 표시
```

### 자동 워크플로우
- **기능 요청** → PM Agent 접수 → 설계 담당 검토 → 개발 담당 구현 → 품질 관리자 검증 → 문서 담당 기록
- **버그 신고** → PM Agent 접수 → 분석 담당 조사 → 개발 담당 수정 → 품질 관리자 검증
- **코드 변경** → 자동 테스트 → 보안 검사 (API/인증 변경 시) → 빌드 검증

### 승인 필요 작업
| 작업 유형 | 이유 |
|----------|------|
| 데이터베이스 변경 | 데이터 구조 영향 |
| API 변경 | 외부 연동 영향 |
| 새 라이브러리 | 보안/호환성 |
| 보안 변경 | 인증/권한 영향 |
| 프로덕션 배포 | 실서비스 영향 |

### 사용자 가이드
상세 사용법: `docs/ai-team/user-guide-ko.md`

## UX/UI 디자인 팀

**홈페이지 및 랜딩 페이지 UX/UI 개선 전문 에이전트**

### UX/UI 팀 구성
| 역할 | 담당 업무 | 자동 실행 |
|------|----------|----------|
| **UX 리서처** | 사용자 여정 분석, A/B 테스트 설계 | audit 모드 |
| **UI 디자이너** | 컴포넌트 설계, 비주얼 개선 | design 모드 |
| **접근성 전문가** | WCAG 2.1 AA 검증 | 모든 UI 변경 후 |
| **전환 최적화** | CTA 개선, 이탈률 분석 | --focus conversion |

### UX/UI 명령어
```
/ux감사          홈페이지 전체 UX/UI 분석
/ux개선 [섹션]   특정 섹션 개선 제안
/ux구현 [섹션]   승인된 디자인 구현
/접근성검사      WCAG 2.1 AA 검증
/전환율분석      CTA 및 전환 퍼널 분석
```

### SuperClaude 스킬
```bash
/sc:ux-studio [target] --mode [audit|design|implement] --focus [conversion|accessibility|mobile]
```

### UX/UI 자동 워크플로우
- **감사** → Playwright 캡처 → 4 페르소나 분석 → 우선순위 매트릭스 → 보고서
- **개선** → 현황 분석 → 옵션 제안 → 접근성 검증 → 사용자 승인
- **구현** → TDD (RED → GREEN → REFACTOR) → Playwright 검증

### 랜딩 페이지 구조
```
src/presentation/components/landing/
├── LandingHeader.tsx      # 네비게이션
├── HeroSection.tsx        # 메인 헤로우
├── SocialProofSection.tsx # 신뢰 지표
├── FeaturesSection.tsx    # 기능 소개
├── ProductShowcaseSection.tsx
├── HowItWorksSection.tsx  # 사용 방법
├── TestimonialsSection.tsx # 후기
├── PricingSection.tsx     # 가격
├── FAQSection.tsx         # FAQ
├── CTASection.tsx         # 최종 CTA
└── LandingFooter.tsx      # 푸터
```

## 참고 문서
- 상세 구현 계획: `docs/plans/PLAN_batwo-ai-marketing.md`
- Prisma 스키마: `prisma/schema.prisma`
- 환경 변수: `.env.example`
