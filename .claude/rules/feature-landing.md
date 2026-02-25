---
paths:
  - "src/presentation/components/landing/**"
  - "src/app/page.tsx"
---

# 랜딩 페이지 구조

## 컴포넌트 트리
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

## 상태: Evolving
- CSS/Tailwind 변경은 브라우저 시각적 검증 우선
- 구조 변경 시 빌드 확인 필수
- 반응형: `lg`(1024px)와 `xl`(1280px) 사이 브레이크포인트 필수 확인
