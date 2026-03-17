# 자주 묻는 질문(FAQ) — 검증된 데이터 기반

광고를 처음 시작하거나 성과 개선에 막힌 광고주들이 가장 자주 묻는 질문과 답변이다. 모든 수치는 1차 출처가 확인된 데이터만 포함한다.

---

## 기본 설정 관련

### Q: 광고 예산은 하루에 얼마가 적당한가요?
**A:** Meta는 특정 금액을 명시하지 않습니다. 핵심 기준은 "7일 내 50회 최적화 이벤트 수집"입니다. 따라서 필요한 최소 주간 예산 = 타겟 CPA × 50입니다. 예를 들어 CPA가 ₩10,000이면 주간 예산 ₩500,000(일일 약 ₩71,000)이 필요합니다. 2024년 11월 업데이트로 구매(Purchase) 및 앱 설치 최적화 캠페인에 한해 50회에서 10회로 하향 조정되었습니다.

**출처**: Meta Business Help Center (facebook.com/business/help/112167992830700); Madgicx 2024년 11월 업데이트 보도

### Q: 광고 세트는 몇 개가 적당한가요?
**A:** 목표당 1-3개가 권장됩니다. 광고 세트가 너무 많으면 학습 데이터가 분산되어 각 세트가 개별적으로 50회 전환을 달성하기 어렵습니다. Advantage+ 캠페인으로 통합하면 Meta AI가 자동으로 최적 배분합니다.

**출처**: Meta Business Help Center — Learning Phase 문서

### Q: Advantage+ 캠페인이 일반 캠페인과 뭐가 다른가요?
**A:** Advantage+는 Meta AI가 타겟팅, 배치, 예산 배분을 자동 최적화하는 캠페인 유형입니다. Meta 공식 발표에 따르면, 15건의 A/B 테스트에서 Advantage+ 쇼핑 캠페인이 기존 캠페인 대비 구매당 비용이 12% 낮았습니다. Farfetch 사례에서는 판매 비용 30% 감소, Zenith UK 사례에서는 증분 전환 30% 상승 및 신규 고객 50% 증가가 보고되었습니다.

**출처**: Meta Newsroom (2022.08) — "Introducing New Automation Tools to Increase Sales and Drive Growth"; Meta Newsroom — Farfetch/Zenith 케이스 스터디

### Q: 픽셀(Pixel)이 뭔가요? 꼭 설치해야 하나요?
**A:** Meta 픽셀은 웹사이트 방문자의 행동을 추적하는 코드입니다. 필수입니다. 픽셀 없이는 전환 추적이 불가능하고, 리타겟팅도 할 수 없으며, 알고리즘 학습에 필요한 데이터가 수집되지 않습니다. 브라우저 쿠키 제한 확대로 CAPI(서버 사이드 전환 API) 병행 설치가 강력 권장됩니다.

**출처**: Meta Business Help Center — Meta Pixel 설정 가이드

---

## 성과 분석 관련

### Q: ROAS가 몇 배여야 성공인가요?
**A:** 업종과 마진율에 따라 다릅니다. Triple Whale 2025 데이터(35,000개 이커머스 브랜드)에 따르면 플랫폼 전체 평균 ROAS는 1.86입니다. 뷰티 1.57, 의류 2.18이 업종 평균입니다. 손익분기 ROAS를 먼저 계산하세요 — 마진율 50%라면 ROAS 2.0이 손익분기점, 마진율 30%라면 ROAS 3.3이 손익분기점입니다.

**출처**: Triple Whale — "Facebook Ad Benchmarks by Industry" (2025, 35,000개 브랜드 분석)

### Q: 클릭은 많은데 왜 구매가 없나요?
**A:** 이것은 광고 문제가 아니라 전환 퍼널 문제입니다. Google 연구에 따르면 모바일 페이지 로딩이 1초에서 3초로 늘어나면 이탈 확률이 32% 증가하고, 1초에서 10초로 늘어나면 123% 증가합니다. 확인 순서: 1) 랜딩페이지 로딩 속도(3초 이내 권장), 2) 랜딩페이지와 광고 메시지 일치 여부, 3) 결제 프로세스 복잡도, 4) 가격 경쟁력, 5) 모바일 최적화 상태.

**출처**: Google — "The Need for Mobile Speed" (11M 모바일 광고 랜딩페이지 분석, 213개국); web.dev — "Why does speed matter?"

### Q: CTR이 높으면 좋은 건가요?
**A:** CTR이 높으면 소재가 관심을 끌고 있다는 신호지만, CTR만으로는 부족합니다. CTR 높고 CVR 낮으면 = 소재와 랜딩페이지 불일치 또는 클릭베이트. CTR 낮고 CVR 높으면 = 소재가 정확한 타겟에 도달 중. 최종적으로 CPA와 ROAS를 기준으로 판단하세요. WordStream 2025 기준 전체 산업 평균 트래픽 CTR은 약 1.57%입니다.

**출처**: WordStream — "Facebook Ads Benchmarks 2024" (전체 산업 평균)

### Q: CPM이 갑자기 올랐어요. 왜 그런가요?
**A:** CPM 급등 주요 원인: 1) 소재 피로도 — Meta Ads Manager에 내장된 Creative Fatigue 권고 기능이 경고를 표시합니다. Meta는 작은/특정 오디언스의 경우 7-10일마다 소재 새로고침을 권장합니다. 2) 시즌 경쟁 — 연말, 블프 등 광고 경쟁 심화 시기. 3) 오디언스 포화 — 타겟이 너무 좁으면 경매 경쟁이 과열됩니다.

**출처**: Meta Business Help Center — Creative Fatigue Recommendations (facebook.com/business/help/1346816142327858)

---

## 소재 관련

### Q: 광고 이미지 vs 영상, 뭐가 더 효과적인가요?
**A:** Databox의 디지털 마케팅 전문가 설문 결과, 영상이 정적 이미지 대비 약 30% 더 많은 클릭을 유도합니다. Meta의 Advantage+ Creative 표준 향상(Standard Enhancements) 기능은 링크 클릭, 랜딩페이지 조회, 오프사이트 전환 캠페인에서 평균 4% 낮은 결과당 비용을 달성했습니다. 단, 영상은 일반적으로 이미지보다 노출 비용(CPM)이 높을 수 있으므로, 영상+이미지를 혼합하여 Meta AI가 최적 조합을 찾게 하는 것이 권장됩니다.

**출처**: Databox — "Videos vs. Images in Facebook Ads" (databox.com/videos-vs-images-in-facebook-ads); Meta Developer Blog (2023.04) — Advantage+ Creative Standard Enhancements

### Q: 소재를 얼마나 자주 바꿔야 하나요?
**A:** Meta 공식 가이드는 작은/특정 오디언스의 경우 7-10일마다 소재 새로고침을 권장합니다. Meta Ads Manager의 Creative Fatigue Recommendations 기능이 성과 하락 시 알림을 제공합니다. 핵심은 시각적으로 완전히 다른(Entity ID가 다른) 소재를 만드는 것입니다.

**출처**: Meta Business Help Center — Creative Fatigue Recommendations

### Q: 광고 텍스트(카피)는 어떻게 써야 하나요?
**A:** Meta 공식 권장 기준: 헤드라인 27자 이내, 본문 125자 이내, 설명 30자 이내. 효과적인 카피에 숫자를 포함하면 구체성과 신뢰도가 상승합니다. CTA는 행동+혜택 조합이 효과적입니다(예: "지금 구매하고 할인받기").

**출처**: Meta Business Help Center — Ad Format Specifications

---

## 타겟팅 관련

### Q: 타겟을 좁게 잡아야 하나요, 넓게 잡아야 하나요?
**A:** Meta의 Advantage+ 캠페인은 넓은 오디언스 풀에서 AI가 최적 사용자를 찾는 방식입니다. Meta 공식 A/B 테스트(15건)에서 Advantage+ 쇼핑 캠페인이 기존 수동 타겟팅 대비 12% 낮은 구매당 비용을 달성했습니다. 예외: 지역 비즈니스(반경 타겟팅 필요), 니치 B2B 제품.

**출처**: Meta Newsroom (2022.08) — Advantage+ 쇼핑 캠페인 A/B 테스트 결과

### Q: 룩어라이크(Lookalike) 오디언스는 아직 효과있나요?
**A:** 여전히 유효하지만, Advantage+ Audience가 대부분의 경우 동등하거나 더 나은 성과를 보입니다. 룩어라이크를 사용한다면 소스 오디언스를 '구매자' 기반으로 설정하세요.

**출처**: Meta Business Help Center — Advantage+ Audience

---

## 문제 해결 관련

### Q: 광고가 승인이 안 돼요 / 거부당했어요
**A:** Meta 광고 정책 위반 가능성: 1) 과장/허위 표현("100% 보장", "기적의 효과"), 2) 전후 비교 이미지(뷰티, 건강 카테고리), 3) 개인 속성 직접 언급, 4) 랜딩페이지 불일치. 거부 사유를 확인하고 수정 후 재심사를 요청하세요.

**출처**: Meta Advertising Standards (facebook.com/policies/ads/)

### Q: 학습 단계(Learning Phase)에서 벗어나질 못해요
**A:** 학습 단계 탈출 조건: 7일 내 50회 이상 최적화 이벤트(구매/앱 설치 캠페인은 2024년 11월부터 10회로 하향 조정). 탈출 전략: 1) 광고 세트 통합(데이터 집중), 2) 예산 증액(타겟 CPA × 50 이상/주), 3) 전환 이벤트를 상위 퍼널로 변경(구매→장바구니 담기), 4) 입찰을 '최대 볼륨'으로 설정. 학습 단계에서 설정을 계속 변경하면 학습이 리셋되므로 최소 3일간 관망하세요.

**출처**: Meta Business Help Center (facebook.com/business/help/112167992830700); Madgicx — "Meta Lowers Learning Phase Requirement" (2024.11)

### 전체 출처
- Meta Business Help Center — Learning Phase, Creative Fatigue, Ad Format Specs, Pixel Setup
- Meta Newsroom (2022.08) — Advantage+ Shopping Campaigns A/B Test (15건, 12% lower CPA)
- Meta Developer Blog (2023.04) — Advantage+ Creative Standard Enhancements (4% lower cost per result)
- WordStream — Facebook Ads Benchmarks 2024/2025
- Triple Whale — Facebook Ad Benchmarks by Industry (2025, 35,000 brands)
- Databox — Videos vs. Images in Facebook Ads
- Google — "The Need for Mobile Speed" (11M pages, 213 countries)
- Madgicx — Learning Phase Requirement Update (2024.11)
