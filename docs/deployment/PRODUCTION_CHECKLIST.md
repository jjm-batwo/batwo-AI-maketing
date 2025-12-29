# 프로덕션 배포 체크리스트

바투 AI 마케팅 솔루션의 프로덕션 배포 전 필수 확인 사항입니다.

---

## 배포 전 체크리스트

### 1. 코드 품질 검증

- [ ] **모든 PR 승인됨**: 관련 코드 리뷰 완료
- [ ] **CI 파이프라인 통과**: `ci.yml` 워크플로우 성공
  ```bash
  # 로컬 확인
  npm run lint
  npm run type-check
  npm run test:unit
  npm run test:integration
  ```
- [ ] **빌드 성공**: 프로덕션 빌드 정상 완료
  ```bash
  npm run build
  ```

### 2. 테스트 검증

- [ ] **단위 테스트 통과**: 커버리지 ≥85%
  ```bash
  npm run test:unit -- --coverage
  ```
- [ ] **통합 테스트 통과**: 모든 API 엔드포인트 검증
  ```bash
  npm run test:integration
  ```
- [ ] **E2E 테스트 통과**: 스테이징 환경에서 전체 사용자 시나리오 검증
  ```bash
  PLAYWRIGHT_BASE_URL=https://staging.batwo.ai npx playwright test
  ```

### 3. 스테이징 환경 검증

- [ ] **스테이징 배포 완료**: `develop` 브랜치 → staging.batwo.ai
- [ ] **전체 기능 수동 테스트**:
  - [ ] 로그인/회원가입 플로우
  - [ ] Meta 계정 연결
  - [ ] 캠페인 생성/조회/수정
  - [ ] 보고서 생성 및 다운로드
  - [ ] 대시보드 KPI 표시
- [ ] **성능 테스트**: Lighthouse Score ≥90
  ```bash
  npx lighthouse https://staging.batwo.ai --output=json --output-path=./lighthouse-report.json
  ```

### 4. 보안 검증

- [ ] **보안 헤더 확인**: CSP, HSTS, X-Frame-Options 등
  ```bash
  curl -sI https://staging.batwo.ai | grep -i "security\|csp\|frame\|transport"
  ```
- [ ] **민감 정보 노출 없음**: API 응답에 비밀번호, 토큰 등 미포함
- [ ] **Rate Limiting 동작 확인**: API 호출 제한 정상 작동

### 5. 데이터베이스 검증

- [ ] **마이그레이션 완료**: 프로덕션 스키마 최신화
  ```bash
  npx prisma migrate status
  ```
- [ ] **백업 확인**: Supabase 자동 백업 활성화 확인
- [ ] **Connection Pooling 설정**: PgBouncer 연결 정상

### 6. 모니터링 검증

- [ ] **Sentry 연결 확인**: 테스트 에러 전송 성공
- [ ] **헬스체크 엔드포인트**: `/api/health` 정상 응답
  ```bash
  curl https://staging.batwo.ai/api/health
  ```
- [ ] **Vercel Analytics 활성화**: 데이터 수집 확인

### 7. 환경변수 검증

- [ ] **프로덕션 환경변수 설정 완료**: Vercel Dashboard 확인
- [ ] **시크릿 값 갱신**: 만료 예정 토큰 없음
- [ ] **필수 환경변수 목록**:
  - [ ] `DATABASE_URL` (Connection Pooling)
  - [ ] `DIRECT_URL` (마이그레이션용)
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `NEXTAUTH_URL=https://batwo.ai`
  - [ ] `META_APP_ID`, `META_APP_SECRET`
  - [ ] `OPENAI_API_KEY`
  - [ ] `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - [ ] `SENTRY_DSN`

### 8. 롤백 준비

- [ ] **이전 배포 버전 확인**: Vercel Dashboard에서 롤백 가능 여부
- [ ] **데이터베이스 롤백 스크립트**: 마이그레이션 롤백 준비
- [ ] **롤백 전략 문서 숙지**: [ROLLBACK_STRATEGY.md](./ROLLBACK_STRATEGY.md)

### 9. 커뮤니케이션

- [ ] **팀 알림 완료**: Slack/Teams 등 배포 예정 공지
- [ ] **유지보수 시간 안내**: 필요 시 사용자 공지
- [ ] **장애 대응 담당자 지정**: 온콜 담당자 확인

---

## 배포 실행

### GitHub Actions를 통한 배포

1. [GitHub Actions](https://github.com/<org>/<repo>/actions) 페이지로 이동
2. **Deploy to Production** 워크플로우 선택
3. **Run workflow** 클릭
4. 확인 입력창에 `deploy` 입력
5. **Run workflow** 버튼 클릭

### 배포 확인

```bash
# 헬스체크
curl https://batwo.ai/api/health

# 보안 헤더 확인
curl -sI https://batwo.ai

# 응답 시간 확인
curl -w "@curl-format.txt" -o /dev/null -s https://batwo.ai
```

---

## 배포 후 체크리스트

### 즉시 확인 (배포 후 5분 이내)

- [ ] **사이트 접속 가능**: https://batwo.ai
- [ ] **헬스체크 통과**: `/api/health` 200 응답
- [ ] **로그인 정상**: OAuth 플로우 동작
- [ ] **Sentry 에러 없음**: 대시보드 확인

### 30분 후 확인

- [ ] **성능 정상**: 응답 시간 <2초
- [ ] **에러율 정상**: <1%
- [ ] **사용자 피드백**: 주요 기능 문제 보고 없음

### 24시간 후 확인

- [ ] **Vercel Analytics 데이터**: 트래픽 정상
- [ ] **Sentry 리포트**: 새로운 이슈 확인 및 분류
- [ ] **데이터베이스 상태**: 연결 풀 정상, 쿼리 성능 정상

---

## 긴급 롤백 절차

문제 발생 시 즉시 롤백:

1. **Vercel Dashboard** → Deployments
2. 이전 성공 배포 선택
3. **Instant Rollback** 클릭
4. 롤백 완료 확인 (약 1분)

자세한 내용: [ROLLBACK_STRATEGY.md](./ROLLBACK_STRATEGY.md)

---

## 관련 문서

- [브랜치 전략](./BRANCH_STRATEGY.md)
- [환경변수 설정](./VERCEL_ENV_SETUP.md)
- [데이터베이스 마이그레이션](./DATABASE_MIGRATION.md)
- [롤백 전략](./ROLLBACK_STRATEGY.md)
