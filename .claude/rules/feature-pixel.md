---
paths:
  - "src/domain/entities/MetaPixel.ts"
  - "src/domain/entities/PlatformIntegration.ts"
  - "src/domain/entities/ConversionEvent.ts"
  - "src/domain/repositories/IMetaPixelRepository.ts"
  - "src/application/use-cases/pixel/**"
  - "src/application/dto/pixel/**"
  - "src/application/ports/IMetaPixelService.ts"
  - "src/infrastructure/database/mappers/MetaPixelMapper.ts"
  - "src/infrastructure/database/repositories/PrismaMetaPixelRepository.ts"
  - "src/infrastructure/external/meta-pixel/**"
  - "src/app/api/pixel/**"
  - "src/app/api/platform/**"
  - "src/presentation/components/pixel/**"
  - "src/presentation/components/onboarding/**"
  - "src/lib/validations/pixel.ts"
---

# 픽셀 설치 기능

## 개요
Meta 픽셀 원클릭 설치 기능. 커머스 사업자가 버튼 한 번으로 픽셀 설치를 완료할 수 있음.

## 도메인 엔티티
```
src/domain/entities/
├── MetaPixel.ts              # 픽셀 설정 엔티티
├── PlatformIntegration.ts    # 플랫폼 연동 엔티티 (카페24)
└── ConversionEvent.ts        # CAPI 전환 이벤트 엔티티
```

## 주요 API
| 엔드포인트 | 용도 |
|-----------|------|
| `GET /api/pixel` | 사용자 픽셀 목록 |
| `POST /api/pixel` | 픽셀 선택/저장 |
| `GET /api/pixel/[id]` | 픽셀 상세 |
| `GET /api/pixel/[id]/tracker.js` | 동적 추적 스크립트 |
| `POST /api/pixel/[id]/event` | 클라이언트 이벤트 수신 |
| `GET /api/platform/cafe24/auth` | 카페24 OAuth URL |
| `GET /api/platform/cafe24/callback` | OAuth 콜백 |
| `POST /api/webhooks/cafe24` | 카페24 주문 웹훅 |

## 온보딩 플로우
1. Welcome (환영) → 2. Meta 연결 → 3. **픽셀 설치** → 4. 완료

## 환경 변수
```bash
# 카페24 API (선택)
CAFE24_CLIENT_ID=""
CAFE24_CLIENT_SECRET=""
CAFE24_REDIRECT_URI=""
```

## CAPI 이벤트 처리
- 클라이언트 → `/api/pixel/[id]/event` → 서버 사이드 CAPI 전송
- 카페24 웹훅 → `/api/webhooks/cafe24` → 주문 전환 이벤트 자동 전송
