---
paths:
  - "src/domain/value-objects/AuditScore.ts"
  - "src/application/use-cases/audit/**"
  - "src/application/dto/audit/**"
  - "src/infrastructure/pdf/AuditPDFGenerator.ts"
  - "src/app/api/audit/**"
  - "src/app/audit/**"
  - "src/lib/cache/auditShareCache.ts"
  - "src/lib/cache/auditStateCache.ts"
  - "src/lib/cache/auditTokenCache.ts"
  - "src/lib/validations/audit.ts"
  - "src/presentation/components/audit/**"
---

# 무료 광고 계정 감사

## 개요
인증 불필요 공개 API 기반 무료 광고 계정 감사. Meta OAuth로 임시 접근 후 분석.

## OAuth 플로우
1. `GET /api/audit/auth-url` → Meta OAuth URL 생성
2. 사용자 Meta 로그인/권한 허용
3. `GET /api/audit/callback` → 임시 토큰으로 계정 분석
4. 결과 페이지 표시 + PDF 다운로드

## Rate Limit 패턴
- IP 기반, 3 tokens / 24시간
- `auditTokenCache`: 인메모리 Map + 15분 TTL + 1분 정리 + 1회용 삭제
- `getClientIp()` + `checkRateLimit('audit:${ip}', 'audit')` 패턴

## AuditScore 값객체
카테고리별 점수 구조 (캠페인 구조, 타겟팅, 소재, 예산 배분)

## PDF 생성
- `AuditPDFGenerator`: 감사 결과를 PDF로 변환
- `GET /api/audit/pdf?token=...` — PDF 다운로드

## 공유 링크
- `POST /api/audit/share` → 공유 토큰 생성
- `/audit/shared/[token]` → 공유 결과 페이지

## 보안 참고
- 공개 API이므로 rate limit + IP 검증 필수
- 임시 토큰은 감사 완료 후 즉시 폐기
