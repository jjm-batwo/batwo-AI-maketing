---
paths:
  - "src/domain/entities/AdSet.ts"
  - "src/domain/entities/Ad.ts"
  - "src/domain/entities/Creative.ts"
  - "src/domain/value-objects/AdSetStatus.ts"
  - "src/domain/value-objects/AdStatus.ts"
  - "src/domain/value-objects/AdvantageConfig.ts"
  - "src/domain/value-objects/BidStrategy.ts"
  - "src/domain/value-objects/BillingEvent.ts"
  - "src/domain/value-objects/CreativeAsset.ts"
  - "src/domain/value-objects/CreativeFormat.ts"
  - "src/domain/value-objects/CTAType.ts"
  - "src/domain/repositories/IAdSetRepository.ts"
  - "src/domain/repositories/IAdRepository.ts"
  - "src/domain/repositories/ICreativeRepository.ts"
  - "src/domain/repositories/ICreativeAssetRepository.ts"
  - "src/application/use-cases/ad/**"
  - "src/application/use-cases/adset/**"
  - "src/application/use-cases/creative/**"
  - "src/application/dto/adset/**"
  - "src/application/dto/creative/**"
  - "src/infrastructure/database/repositories/PrismaAdRepository.ts"
  - "src/infrastructure/database/repositories/PrismaAdSetRepository.ts"
  - "src/infrastructure/database/repositories/PrismaCreativeRepository.ts"
  - "src/infrastructure/database/repositories/PrismaCreativeAssetRepository.ts"
  - "src/infrastructure/database/mappers/AdMapper.ts"
  - "src/infrastructure/database/mappers/AdSetMapper.ts"
  - "src/infrastructure/database/mappers/CreativeMapper.ts"
  - "src/app/api/adsets/**"
  - "src/app/api/campaigns/[id]/adsets/**"
  - "src/app/api/creatives/**"
  - "src/app/api/assets/**"
---

# AdSet/Ad/Creative 광고 소재 구조

## 개요
AdSet/Ad/Creative 3계층 광고 구조 + Advantage+ 캠페인 자동 최적화.

## 도메인 모델
- **AdSet**: 예산/일정/타겟팅 설정 (Campaign 하위)
- **Ad**: 개별 광고 (AdSet 하위)
- **Creative**: 광고 소재 (텍스트/이미지/영상)
- **AdvantageConfig**: Advantage+ 캠페인 자동 최적화 설정

## Campaign 확장
- `Campaign.buyingType`: STANDARD | ADVANTAGE
- `Campaign.advantageConfig`: Advantage+ 설정 (AdvantageConfig 값객체)

## 값객체
| 값객체 | 설명 |
|--------|------|
| AdSetStatus | ACTIVE, PAUSED, DELETED, ARCHIVED |
| AdStatus | ACTIVE, PAUSED, DELETED |
| BidStrategy | LOWEST_COST, TARGET_COST, BID_CAP |
| BillingEvent | IMPRESSIONS, LINK_CLICKS, ACTIONS |
| CreativeFormat | SINGLE_IMAGE, CAROUSEL, VIDEO |
| CreativeAsset | 소재 에셋 (URL, 타입, 크기) |
| CTAType | LEARN_MORE, SHOP_NOW, SIGN_UP 등 |

## BlobStorageService
- `@vercel/blob` 기반 에셋 업로드
- `POST /api/assets/upload` → Blob URL 반환

## DI 등록
Ad/Creative/CreativeAsset 리포지토리 + BlobStorageService + 유스케이스 7개

## 주의사항
- CampaignMapper/CreativeMapper에서 `as unknown as JsonValue` 캐스팅 필수
- MetaAdsClient v25.0: AdSet/Ad/Creative/Asset 메서드 8개 구현됨
