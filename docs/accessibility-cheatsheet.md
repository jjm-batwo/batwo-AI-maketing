# 접근성 치트시트 (WCAG 2.1 AA)

빠르게 참고할 수 있는 접근성 패턴 모음

---

## 1. 버튼 (Button)

### 기본 버튼
```tsx
<Button aria-label="명확한 동작 설명">
  버튼 텍스트
</Button>
```

### 아이콘만 있는 버튼
```tsx
<Button aria-label="닫기">
  <X className="h-4 w-4" aria-hidden="true" />
</Button>
```

### 로딩 버튼
```tsx
<Button
  disabled={isLoading}
  aria-busy={isLoading}
  aria-label={isLoading ? '처리 중...' : '제출하기'}
>
  {isLoading ? '처리 중...' : '제출'}
</Button>
```

---

## 2. 폼 필드 (Form Fields)

### Input (필수)
```tsx
<Label htmlFor="email">
  이메일 <span className="text-red-500" aria-label="필수">*</span>
</Label>
<Input
  id="email"
  type="email"
  aria-required="true"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : 'email-hint'}
/>
{!errors.email && (
  <p id="email-hint" className="text-sm text-muted-foreground">
    example@domain.com 형식으로 입력하세요
  </p>
)}
{errors.email && (
  <p id="email-error" className="text-sm text-red-500" role="alert" aria-live="polite">
    {errors.email.message}
  </p>
)}
```

### Textarea
```tsx
<Label htmlFor="description">설명</Label>
<Textarea
  id="description"
  aria-describedby="description-hint"
  maxLength={500}
/>
<p id="description-hint" className="text-sm text-muted-foreground">
  최대 500자까지 입력 가능합니다
</p>
```

---

## 3. Radio Group (커스텀)

```tsx
<fieldset>
  <legend className="sr-only">옵션 선택</legend>
  <Label id="option-label">옵션</Label>

  <div role="radiogroup" aria-labelledby="option-label" aria-required="true">
    {options.map((option) => {
      const isSelected = value === option.id
      return (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={isSelected}
          aria-label={option.label}
          onClick={() => setValue(option.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setValue(option.id)
            }
          }}
          className={cn(
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            isSelected && 'bg-primary text-primary-foreground'
          )}
        >
          {option.label}
        </button>
      )
    })}
  </div>
</fieldset>
```

---

## 4. Checkbox Group (커스텀)

```tsx
<fieldset>
  <legend className="sr-only">선택 항목</legend>
  <Label id="items-label">항목 (복수 선택 가능)</Label>

  <div
    role="group"
    aria-labelledby="items-label"
    aria-describedby="items-hint"
  >
    {items.map((item) => {
      const isChecked = selected.includes(item.id)
      return (
        <button
          key={item.id}
          type="button"
          role="checkbox"
          aria-checked={isChecked}
          aria-label={item.label}
          onClick={() => toggleItem(item.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleItem(item.id)
            }
          }}
          className="focus:ring-2 focus:ring-primary"
        >
          {item.label}
        </button>
      )
    })}
  </div>
  <p id="items-hint" className="text-sm text-muted-foreground">
    여러 항목을 선택할 수 있습니다
  </p>
</fieldset>
```

---

## 5. 네비게이션 (Navigation)

### 사이드바
```tsx
<aside aria-label="주요 네비게이션">
  <nav aria-label="메인 메뉴">
    {links.map((link) => {
      const isActive = pathname === link.href
      return (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive ? 'page' : undefined}
          aria-label={`${link.name}${isActive ? ' (현재 페이지)' : ''}`}
          className="focus:ring-2 focus:ring-primary"
        >
          <link.icon aria-hidden="true" />
          <span>{link.name}</span>
        </Link>
      )
    })}
  </nav>
</aside>
```

### 헤더
```tsx
<header>
  <a href="#main-content" className="skip-to-content">
    Skip to main content
  </a>

  <nav aria-label="Main navigation">
    {/* nav items */}
  </nav>
</header>
```

---

## 6. 알림/상태 메시지

### Alert (중요 알림)
```tsx
<div
  role="alert"
  aria-live="assertive"
  className="flex items-center gap-2 p-4 bg-red-50 text-red-800"
>
  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
  <span>오류가 발생했습니다</span>
</div>
```

### Status (상태 표시)
```tsx
<div
  role="status"
  aria-live="polite"
  aria-label={`현재 ${currentStep}/${totalSteps} 단계`}
>
  {currentStep}/{totalSteps}
</div>
```

### Badge
```tsx
<span
  role="status"
  aria-label="14일 무료 체험 제공"
  className="badge"
>
  <span aria-hidden="true">14일 무료</span>
</span>
```

---

## 7. 모달/다이얼로그

```tsx
<Dialog
  open={isOpen}
  onOpenChange={setIsOpen}
>
  <DialogContent
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogHeader>
      <DialogTitle id="dialog-title">제목</DialogTitle>
      <DialogDescription id="dialog-description">
        설명 텍스트
      </DialogDescription>
    </DialogHeader>

    {/* Dialog content */}

    <DialogFooter>
      <Button
        onClick={() => setIsOpen(false)}
        aria-label="대화상자 닫기"
      >
        닫기
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 8. 섹션/랜딩 페이지

### Hero Section
```tsx
<section
  className="hero"
  aria-labelledby="hero-heading"
>
  <h1 id="hero-heading">
    메인 헤딩
  </h1>

  <p>설명 텍스트</p>

  <Button aria-label="무료 체험 시작하기 - 회원가입 페이지로 이동">
    무료로 시작하기
    <ArrowRight aria-hidden="true" />
  </Button>
</section>
```

### Features Section
```tsx
<section aria-labelledby="features-heading">
  <header className="text-center">
    <h2 id="features-heading">주요 기능</h2>
    <p>설명</p>
  </header>

  <div className="grid">
    {/* feature cards */}
  </div>
</section>
```

---

## 9. 이미지/아이콘

### 의미 있는 이미지
```tsx
<img
  src="/dashboard-preview.png"
  alt="바투 대시보드 미리보기 - 실시간 캠페인 성과 데이터와 AI 인사이트"
/>
```

### 장식 이미지
```tsx
<img src="/decoration.svg" alt="" role="presentation" />
{/* 또는 */}
<div className="decorative-bg" aria-hidden="true" />
```

### 아이콘 (장식)
```tsx
<Sparkles className="h-4 w-4" aria-hidden="true" />
```

### 아이콘 (의미)
```tsx
<CheckCircle className="h-5 w-5" aria-label="완료됨" role="img" />
```

---

## 10. 테이블

```tsx
<table>
  <caption className="sr-only">캠페인 목록</caption>
  <thead>
    <tr>
      <th scope="col">캠페인명</th>
      <th scope="col">상태</th>
      <th scope="col">예산</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{campaign.name}</td>
      <td>
        <span role="status" aria-label={`캠페인 상태: ${campaign.status}`}>
          {campaign.status}
        </span>
      </td>
      <td>{formatCurrency(campaign.budget)}</td>
    </tr>
  </tbody>
</table>
```

---

## 11. 링크

### 내부 링크
```tsx
<Link
  href="/campaigns"
  aria-label="캠페인 목록 페이지로 이동"
>
  캠페인
</Link>
```

### 외부 링크
```tsx
<a
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="외부 사이트 새 탭에서 열기"
>
  자세히 보기
  <ExternalLink className="h-4 w-4" aria-hidden="true" />
</a>
```

### 이메일 링크
```tsx
<a
  href="mailto:support@batwo.io"
  aria-label="이메일로 문의하기 support@batwo.io"
>
  support@batwo.io
</a>
```

---

## 12. 스크린 리더 전용 텍스트

### sr-only 클래스
```tsx
<h2 className="sr-only">
  1단계: 기본 정보
</h2>

<Label htmlFor="price" className="sr-only">
  가격
</Label>
```

---

## 13. Focus Management

### Focus Trap (모달)
```tsx
import { Dialog, DialogContent } from '@/components/ui/dialog'

// shadcn/ui Dialog는 자동으로 focus trap 적용
<Dialog open={isOpen}>
  <DialogContent>
    {/* 첫 번째 focusable 요소에 자동 focus */}
  </DialogContent>
</Dialog>
```

### Focus Visible
```css
/* globals.css - 이미 적용됨 */
*:focus-visible {
  @apply outline-2 outline-offset-2 outline-primary;
}
```

---

## 14. Keyboard Shortcuts

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Escape로 닫기
    if (e.key === 'Escape') {
      onClose()
    }

    // Cmd/Ctrl + K로 검색
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      openSearch()
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [])
```

---

## 15. 색상 대비 체크

### Tailwind 색상 (WCAG AA 통과)
- ✅ `text-foreground` on `bg-background`
- ✅ `text-primary` on `bg-primary-foreground`
- ✅ `text-muted-foreground` on `bg-muted`

### 피해야 할 조합
- ❌ `text-gray-400` on `bg-white` (대비율 부족)
- ❌ `text-yellow-500` on `bg-white` (대비율 부족)

### 검증 도구
```bash
# Chrome DevTools
1. 요소 검사
2. Styles 패널에서 색상 클릭
3. 대비율 확인 (AA/AAA 표시)
```

---

## 16. 모바일 메뉴

```tsx
<button
  className="md:hidden"
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
  aria-expanded={isMenuOpen}
  aria-controls="mobile-menu"
>
  {isMenuOpen ? <X /> : <Menu />}
</button>

<div
  id="mobile-menu"
  aria-hidden={!isMenuOpen}
  className={isMenuOpen ? 'block' : 'hidden'}
>
  {/* menu items */}
</div>
```

---

## 체크리스트

새 컴포넌트 작성 시 확인:

- [ ] 모든 이미지/아이콘에 alt 또는 aria-label
- [ ] 모든 버튼에 명확한 텍스트 또는 aria-label
- [ ] 폼 필드에 label 연결 (htmlFor + id)
- [ ] 오류 메시지에 role="alert" + aria-live
- [ ] 커스텀 컨트롤에 적절한 role 적용
- [ ] 키보드로 모든 기능 접근 가능
- [ ] focus indicator 명확히 표시
- [ ] 색상 대비 4.5:1 이상
- [ ] 시맨틱 HTML 사용 (section, nav, header)
- [ ] aria-hidden 장식 요소에만 적용

---

## 테스트 명령어

```bash
# axe DevTools 실행
1. Chrome 개발자 도구 열기
2. axe DevTools 탭 선택
3. "Scan ALL of my page" 클릭

# 키보드 테스트
Tab, Shift+Tab, Enter, Space로 전체 UI 탐색

# 스크린 리더 (macOS)
Cmd+F5 (VoiceOver 시작/종료)
```

---

**빠른 참고용입니다. 상세 내용은 [accessibility-improvements.md](./accessibility-improvements.md) 참조.**
