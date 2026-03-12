# /image-audit - Next.js 이미지 최적화 진단

Google Core Web Vitals 전문 컨설턴트이자 Next.js 수석 개발자로서, 프로젝트의 **이미지 최적화 상태(LCP, CLS, Bandwidth)**를 정밀 진단합니다.

---

## 진단 절차

### 0단계: 데이터 수집

아래 파일들을 병렬로 읽어 분석 데이터를 수집합니다:

1. **설정 파일**: `next.config.ts` (또는 `next.config.js`, `next.config.mjs`)
2. **이미지 사용 컴포넌트**: `src/` 내 `<Image`, `<img`, `next/image` 패턴 검색
3. **정적 이미지 자산**: `public/` 내 `*.png, *.jpg, *.jpeg, *.svg, *.webp, *.avif, *.gif` 목록
4. **CSS 배경 이미지**: `background-image`, `backgroundImage`, `url(` 패턴 검색
5. **priority 속성 사용처**: `priority` 패턴 검색 (LCP 최적화 여부)
6. **placeholder 사용처**: `placeholder`, `blurDataURL` 패턴 검색

---

### 1단계: 구성 및 설정 (Configuration)

`next.config` 파일에서 `images` 설정을 진단합니다:

| 점검 항목 | 확인 내용 |
|----------|----------|
| `remotePatterns` | 와일드카드 범위가 최소한인가? `pathname` 제한이 있는가? |
| `formats` | `['image/avif', 'image/webp']` 순서로 AVIF 우선인가? |
| `deviceSizes` | 프로젝트 타겟 디바이스에 맞게 커스텀했는가? |
| `imageSizes` | 썸네일/아바타 크기에 맞는 사이즈가 포함되어 있는가? |
| `minimumCacheTTL` | 프로덕션에서 충분한 캐시 시간인가? (권장: 3600초 이상) |
| 외부 도메인 관리 | 사용하지 않는 도메인이 등록되어 있지 않은가? |

---

### 2단계: 컴포넌트 구현 (Implementation)

| 점검 항목 | 확인 내용 |
|----------|----------|
| `next/image` 사용 | `<img>` 태그 직접 사용 대신 `<Image>` 컴포넌트를 사용하는가? |
| `width`/`height` | CLS 방지를 위해 명시적 크기가 지정되어 있는가? |
| `sizes` 속성 | 반응형 레이아웃에서 적절한 sizes 힌트를 제공하는가? |
| `fill` 속성 | 동적 크기 이미지에 fill + object-fit을 올바르게 사용하는가? |
| `priority` 속성 | LCP 요소(히어로 배너, 메인 이미지)에 priority가 부여되었는가? |
| `fetchPriority` | Next.js 15+에서 `fetchPriority="high"` 활용 여부 |
| `loading="lazy"` 남용 | viewport 내 이미지에 불필요한 lazy loading이 적용되지 않았는가? |
| 외부 이미지 최적화 | Radix Avatar 등 서드파티 컴포넌트가 Next.js 파이프라인을 우회하지 않는가? |

---

### 3단계: 코드 패턴 및 구조

| 점검 항목 | 확인 내용 |
|----------|----------|
| 로컬/원격 혼재 | `import` 방식과 URL 문자열 방식이 일관적인가? |
| `placeholder` | blur/shimmer placeholder로 로딩 UX를 개선했는가? |
| `blurDataURL` | 로컬 이미지에 자동 blur, 원격 이미지에 수동 blur 설정 여부 |
| `<link rel="preload">` | LCP 이미지에 대한 프리로드 힌트가 있는가? |
| Bundle 내 이미지 | base64 인라인 임계값을 초과하는 이미지가 번들에 포함되지 않았는가? |
| Font 최적화 | `next/font` + `display: 'swap'` 사용 여부 (LCP 연관) |

---

### 4단계: 개선 제안

수집된 데이터를 바탕으로 다음을 출력합니다:

1. **Bad Practice 목록**: 현재 성능 점수를 깎는 구체적 코드 위치와 이유
2. **개선 코드**: Before/After 형식으로 수정된 코드 제안
3. **우선순위 분류**: P0(즉시)/P1(다음 스프린트)/P2(백로그)
4. **추가 개선 기회**: 위 체크리스트 외에 발견된 최적화 포인트

---

## 출력 형식

```markdown
## 이미지 최적화 진단 보고서 (YYYY-MM-DD)

### 종합 점수
| 항목 | 점수 | 비고 |
|------|------|------|
| Configuration | ?/10 | |
| LCP | ?/10 | |
| CLS | ?/10 | |
| Bandwidth | ?/10 | |
| 코드 패턴 | ?/10 | |

### 1. 구성 및 설정
(진단 결과)

### 2. 컴포넌트 구현
(진단 결과 + 문제 코드 위치)

### 3. 코드 패턴 및 구조
(진단 결과)

### 4. 개선 제안
#### P0 (즉시 개선)
- 문제 → 개선 코드

#### P1 (다음 스프린트)
- 문제 → 개선 코드

#### P2 (백로그)
- 문제 → 개선 방향
```

---

## 참고

- 이 진단은 **코드 정적 분석** 기반입니다. 실제 Lighthouse 점수와는 차이가 있을 수 있습니다.
- 이미지가 거의 없는 CSS/SVG 기반 프로젝트는 해당 사항을 명시하고, 향후 이미지 추가 시 주의사항을 제안합니다.
- 진단 결과는 변경하지 않고 읽기 전용으로 보고합니다.
