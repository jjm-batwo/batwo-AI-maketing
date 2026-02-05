# OpenAPI 문서 빠른 시작 가이드

## 🚀 5분 안에 API 문서 보기

### 1. 온라인에서 바로 보기 (가장 빠름)

1. [Swagger Editor](https://editor.swagger.io/) 접속
2. `File` → `Import file` 클릭
3. `docs/api/openapi.yaml` 파일 선택
4. ✨ 완료! 인터랙티브 API 문서 확인

### 2. 로컬에서 보기

```bash
# Swagger CLI 설치 (한 번만)
npm install -g @apidevtools/swagger-cli

# 문서 서버 시작
swagger-cli serve docs/api/openapi.yaml

# 브라우저에서 http://localhost:8080 접속
```

### 3. VS Code에서 보기

1. [OpenAPI (Swagger) Editor](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi) 설치
2. `docs/api/openapi.yaml` 파일 열기
3. `Ctrl+K V` (또는 `Cmd+K V`) - 미리보기

## 📝 문서 검증

```bash
# OpenAPI 스펙 검증
npm run api:validate

# 결과 예시:
# ✅ All validations passed!
# ✓ Found 18 endpoints
# ✓ Found 36 schemas
```

## 🔍 주요 API 엔드포인트

### 캠페인 관리
```
GET    /api/campaigns           # 캠페인 목록
POST   /api/campaigns           # 캠페인 생성
POST   /api/campaigns/sync      # Meta 동기화
```

### KPI 및 분석
```
GET    /api/dashboard/kpi       # 대시보드 KPI
GET    /api/reports             # 보고서 목록
POST   /api/reports             # 보고서 생성
```

### AI 기능
```
POST   /api/ai/copy             # AI 카피 생성
GET    /api/ai/copy             # 카피 힌트
```

### 픽셀 관리
```
GET    /api/pixel               # 픽셀 목록
POST   /api/pixel               # 픽셀 생성
```

## 💡 빠른 테스트

### cURL로 테스트

```bash
# 헬스체크
curl http://localhost:3000/api/health

# 캠페인 목록 (인증 필요)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/campaigns

# AI 카피 생성 (인증 필요)
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"productName":"테스트 상품","productDescription":"설명","targetAudience":"타겟","tone":"professional","objective":"conversion"}' \
     http://localhost:3000/api/ai/copy
```

## 📚 더 알아보기

- 📖 [상세 가이드](./README.md) - 완전한 API 문서 가이드
- 📋 [구현 보고서](./IMPLEMENTATION_SUMMARY.md) - 문서화 완료 내역
- 🔗 [OpenAPI 스펙](./openapi.yaml) - 메인 스펙 파일

## 🎯 다음 단계

1. ✅ API 문서 확인
2. ✅ Postman/Insomnia로 테스트
3. ✅ 프론트엔드 연동
4. ✅ 에러 처리 구현

## 💬 지원

문제가 있나요?
- 📧 Email: support@batwo.ai
- 📖 Docs: https://docs.batwo.ai
