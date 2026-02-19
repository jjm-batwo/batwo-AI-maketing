<!-- OMC:START -->
<!-- OMC 전체 지침은 ~/.claude/CLAUDE.md (글로벌)에 있음. 여기는 프로젝트 오버라이드만 기록 -->
<!-- OMC:END -->

# 바투 프로젝트 에이전트 설정

## 에이전트 위임 규칙

### 레이어별 담당 에이전트
| 작업 영역 | 에이전트 | 모델 |
|----------|---------|------|
| Domain 엔티티/값 객체 | executor | sonnet |
| Application UseCase | executor | sonnet |
| Infrastructure 어댑터 | executor | sonnet |
| API Route Handler | executor + security-reviewer | sonnet |
| UI 컴포넌트 | designer | sonnet |
| 아키텍처 결정 | architect | opus |
| 테스트 전략 | test-engineer | sonnet |
| 빌드/타입 오류 | build-fixer | sonnet |

### TDD 에이전트 워크플로우
기능 구현 요청 시 에이전트는 반드시 다음 순서를 따른다:

```
1. RED   → 실패하는 테스트 작성 → `npx vitest run [파일]`로 실패 확인
2. GREEN → 최소 구현 작성 → `npx vitest run [파일]`로 통과 확인
3. REFACTOR → 코드 정리 → 전체 테스트 통과 확인
```

**Self-Healing**: 테스트 실패 시 테스트를 약화시키지 말고 구현 코드를 수정할 것.

### 검증 체크리스트
코드 변경 완료 후 반드시 실행:
```bash
npx tsc --noEmit        # 타입 체크
npx vitest run          # 단위 테스트
npx next build          # 빌드 확인
```

## 보안 자동 검토 대상
다음 경로 변경 시 security-reviewer 에이전트 자동 실행:
- `src/app/api/**` — API 엔드포인트
- `src/infrastructure/auth/**` — 인증/인가
- `src/infrastructure/external/**` — 외부 API 연동
- `prisma/schema.prisma` — DB 스키마 변경

## Skills

커스텀 검증 및 유지보수 스킬은 `.claude/skills/`에 정의되어 있습니다.

| Skill | Purpose |
|-------|---------|
| `verify-implementation` | 프로젝트의 모든 verify 스킬을 순차 실행하여 통합 검증 보고서를 생성합니다 |
| `manage-skills` | 세션 변경사항을 분석하고, 검증 스킬을 생성/업데이트하며, CLAUDE.md를 관리합니다 |
| `verify-architecture` | 클린 아키텍처 레이어 의존성 규칙 검증 (domain/application/infrastructure 간 import) |
| `verify-di-registration` | DI 컨테이너 토큰 정의와 실제 등록의 동기화 검증 |
| `verify-cache-tags` | ISR 캐시 태그와 revalidateTag 매핑 일관성 검증 |
| `verify-bundle` | 번들 최적화 검증 (namespace import, dev-only 누출, ssr:false) |
| `verify-meta-api-version` | Meta Graph API v25.0 버전 통일성 검증 |
| `verify-token-encryption` | DB accessToken 암복호화 적용 일관성 검증 |

## 린트 자동 수정 주의사항
- `no-unused-vars` 수정 시 사용 중인 변수에 `_` 접두사를 붙이는 실수 주의
- `any→unknown` 변환 시 제네릭 저장소(ToolRegistry 등) 타입 호환성 깨짐 → 의도적 any는 eslint-disable 처리
- **린트 자동 수정 후 반드시 전체 테스트 실행**
