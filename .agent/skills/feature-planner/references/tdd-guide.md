# TDD 가이드 — Feature Planner 참조

> SKILL.md에서 TDD 세부사항이 필요할 때 이 파일을 참조합니다.

## Red-Green-Refactor 사이클

```
🔴 RED: 실패하는 테스트 작성
├── 기능에 대한 테스트 작성
├── 실행 → 실패 확인 ❌
└── 커밋: "test: add failing test for X"

🟢 GREEN: 최소 구현
├── 테스트 통과하는 최소 코드 작성
├── 실행 → 통과 ✅
└── 커밋: "feat: implement X to pass tests"

🔵 REFACTOR: 코드 개선
├── 테스트 유지하면서 코드 품질 개선
├── 실행 → 여전히 통과 ✅
└── 커밋: "refactor: improve X design"
```

## 테스트 유형

### Unit 테스트
- **대상**: 개별 함수, 메서드, 클래스
- **의존성**: 모킹/스텁 처리
- **속도**: <100ms/테스트
- **커버리지**: Domain ≥95%, Application ≥90%

### Integration 테스트
- **대상**: 컴포넌트 간 상호작용
- **의존성**: 실제 또는 인메모리 의존성
- **속도**: <1s/테스트
- **커버리지**: Infrastructure ≥85%

### E2E 테스트
- **대상**: 전체 사용자 워크플로우
- **의존성**: 실제 환경
- **속도**: 수 초~분
- **커버리지**: 핵심 사용자 여정

## 테스트 패턴

### Arrange-Act-Assert (AAA)
```typescript
test('should validate user credentials', () => {
  // Arrange
  const authService = new AuthService(mockRepo);
  const credentials = { email: 'test@example.com', password: 'valid' };

  // Act
  const result = authService.authenticate(credentials);

  // Assert
  expect(result.isSuccess).toBe(true);
});
```

### Given-When-Then (BDD)
```typescript
test('logged-in user should see dashboard', () => {
  // Given
  const user = givenAuthenticatedUser();

  // When
  const page = whenUserVisitsDashboard(user);

  // Then
  expect(page).toContainComponent('DashboardContent');
});
```

## 계획서 Phase별 테스트 명세

각 Phase에 아래 항목을 포함:

1. **테스트 파일 위치**: `tests/unit/{domain}/{Component}.test.ts`
2. **테스트 시나리오**: 구체적인 테스트 케이스 목록
3. **초기 실패 사유**: RED 단계에서 왜 실패하는지
4. **커버리지 목표**: 이 Phase의 목표 %
5. **모킹 대상**: 어떤 의존성을 모킹하는지
6. **테스트 데이터**: 필요한 픽스처/팩토리

## 이 프로젝트 검증 명령어

```bash
# 타입 체크
npx tsc --noEmit

# 테스트 (--pool forks 필수)
npx vitest run --pool forks

# 린트
npm run lint

# 빌드
npx next build
```
