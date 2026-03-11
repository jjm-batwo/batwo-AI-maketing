# Contract Tests (Meta Graph API)

## 개요

Meta Graph API 응답 스키마 변경을 자동 감지하기 위한 Contract 테스트입니다.
Zod 스키마로 기대 응답 구조를 정의하고, fixture 데이터 및 실제 API 응답과 비교합니다.

## 구조

```
tests/contract/
├── schemas/
│   ├── index.ts                    # 스키마 배럴 re-export
│   ├── meta-campaign.schema.ts     # Campaign API 스키마
│   ├── meta-insights.schema.ts     # Insights API 스키마
│   └── meta-ad-account.schema.ts   # Ad Account & Error 스키마
├── meta-api-contract.test.ts       # Contract 테스트
└── README.md                       # 이 파일
```

## 실행 방법

```bash
# Fixture 기반 (항상 실행 가능)
npm run test:contract

# Live API 검증 (환경 변수 필요)
META_ACCESS_TOKEN=your-token \
META_AD_ACCOUNT_ID=act_123456 \
npm run test:contract
```

## 스키마 업데이트

Meta API 버전 업그레이드 시:

1. [Meta API Changelog](https://developers.facebook.com/docs/graph-api/changelog) 확인
2. 변경된 필드를 `schemas/` 디렉토리의 해당 스키마에 반영
3. fixture 데이터 업데이트
4. `MetaAdsClient.ts`의 인터페이스와 동기화 확인
5. `npm run test:contract` 실행하여 검증

## 감지 가능한 변경사항

- ✅ 필드 추가/제거
- ✅ 필드 타입 변경 (string → number 등)
- ✅ 필드 필수/옵션 변경
- ✅ Enum 값 변경 (status 등)
- ✅ 중첩 구조 변경 (paging, actions 등)
