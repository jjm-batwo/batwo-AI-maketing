# 백로그

> `/wrap` 실행 시 P2 항목이 자동으로 이관됩니다.
> `/wrap-todo` 실행 시 블로킹 해제 여부를 자동 확인합니다.

---

## 블로킹 대기 (P2a) — 외부 의존성/선행 작업 필요

| # | 항목 | 블로킹 조건 | 승격 기준 | 등록일 |
|---|------|-----------|----------|--------|
| 1 | PPR(Partial Prerendering) 활성화 검토 | Turbopack + PPR 안정화 필요 | Next.js 릴리즈 노트에서 PPR stable 확인 | 2026-02-12 |
| 2 | `unstable_cache` → `'use cache'` 전환 | dynamicIO 활성화 필요 | Next.js에서 dynamicIO stable 확인 | 2026-02-12 |
| 3 | Playwright MCP 스크린샷 타임아웃 근본 해결 | MCP 타임아웃 설정 미지원 | Playwright MCP에 타임아웃 옵션 추가 시 | 2026-02-12 |

## 백로그 (P2b) — 기능 동작에 문제없는 개선사항

| # | 항목 | 관련 파일 | 비고 | 등록일 |
|---|------|----------|------|--------|
| 1 | RSC 전환 페이지 서버 fetch → 직접 DB 조회 전환 | `src/app/(dashboard)/*/page.tsx` | 내부 API 라우트 중복 제거 | 2026-02-12 |
| 2 | Sentry SDK 번들 크기 추가 최적화 | `src/lib/errors/reportError.ts` | 클라이언트 번들 기여도 측정 | 2026-02-12 |
| 3 | 랜딩페이지 섹션별 성능 최적화 | `src/presentation/components/landing/` | intersection observer 애니메이션 지연 로딩 | 2026-02-12 |
| 4 | 랜딩 섹션 'use client' 경계 세분화 | `src/presentation/components/landing/` | 애니메이션 부분만 클라이언트 격리 | 2026-02-12 |
| 5 | PerplexityResearchService.test.ts 수정 | `tests/unit/infrastructure/external/` | 2개 테스트 실패 (사전 존재 이슈) | 2026-02-13 |
| 6 | CSR 12페이지 metadata 추가 | `src/app/(dashboard)/dashboard/page.tsx` 외 11개 | layout.tsx 추가 또는 RSC 전환 필요 | 2026-02-19 |
| 7 | RSC Suspense wrapping | `src/app/(dashboard)/*/page.tsx` | fetch 블로킹 해소, 스트리밍 SSR 활성화 | 2026-02-19 |
| 8 | Dashboard/meta-connect CSR→RSC 전환 | `dashboard/page.tsx`, `meta-connect/page.tsx` | 대형 리팩토링, Zustand 의존성 분리 필요 | 2026-02-19 |
| 9 | AdSet/Creative/Asset mutation API revalidateTag 추가 | `src/app/api/adsets/`, `src/app/api/creatives/`, `src/app/api/assets/` | 8개 API, ISR 페이지 연결 시 승격 | 2026-02-25 |
| 10 | AgentStreamChunk 타입 서버/클라이언트 공유 파일 도입 | `src/application/services/ConversationalAgentService.ts`, `src/presentation/hooks/useAgentChat.ts` | 변경 시 양쪽 동기화 필요 제거 | 2026-02-25 |
| 11 | toCoreMessages()에 tool 메시지 포함 | `src/application/services/ConversationalAgentService.ts` | LLM이 이전 도구 호출 결과 참조 가능하도록 | 2026-02-25 |
| 12 | Domain/Application IntentClassifier 이름 중복 해소 | `src/domain/services/IntentClassifier.ts`, `src/application/services/IntentClassifier.ts` | 개발자 혼란 방지, 리네이밍 | 2026-02-25 |
| 13 | SSE eventsource-parser 도입 | `src/presentation/hooks/useAgentChat.ts` | TCP 패킷 분할 시 JSON 파싱 실패 방지 | 2026-02-25 |
| 14 | `meta-warmup/route.ts:176` accessToken 변수명 명확화 | `src/app/api/meta/meta-warmup/route.ts` | verify-token-encryption WARN | 2026-02-27 |
| 15 | `INTEGRATION_EXAMPLE.tsx` 'use client' 지시어 추가 | `src/presentation/components/INTEGRATION_EXAMPLE.tsx` | verify-ui-components WARN | 2026-02-27 |
