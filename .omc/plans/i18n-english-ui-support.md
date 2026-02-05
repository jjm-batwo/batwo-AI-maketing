# i18n English UI Support Implementation Plan

## Context

### Original Request
Add English UI support to 7 core screens for Meta App Review submission. The reviewer needs to navigate the app in English.

### Interview Summary
- **Approach**: Standard (next-intl) - proper i18n setup with namespace separation
- **Scope**: 7 core pages + Sidebar/Header navigation
- **Priority**: Quality implementation following best practices
- **Default Language**: Korean (ko) - maintains current behavior
- **Target Language**: English (en) - for Meta reviewer

### Research Findings
- Next.js 16.1 App Router with React 19
- No existing i18n library installed
- ~225 Korean strings across target pages
- Components in `src/app/` (pages) and `src/presentation/components/` (shared UI)

---

## Work Objectives

### Core Objective
Implement bilingual (Korean/English) UI support using next-intl library with language toggle in header.

### Deliverables
1. next-intl library configured for Next.js App Router
2. Message files: `messages/ko.json` and `messages/en.json`
3. 7 core screens fully translated
4. Language toggle component (KO/EN) in header
5. Locale persistence via cookie

### Definition of Done
- [ ] User can toggle between KO/EN in header
- [ ] All 7 target pages display correctly in both languages
- [ ] Language preference persists across page refreshes
- [ ] No TypeScript errors
- [ ] No visual regressions

---

## Scope Guardrails

### MUST Have
- next-intl setup with App Router configuration
- Korean and English message files
- Translation of all visible UI text in 7 target pages
- Language toggle UI in header
- Cookie-based locale persistence

### MUST NOT Have
- URL-based locale routing (no `/en/`, `/ko/` prefixes)
- Server-side locale detection from Accept-Language header
- Translation of error messages from API responses
- Translation of user-generated content
- Changes to existing functionality or styling

---

## Task Flow

```
Phase 1: Setup (Tasks 1-3)
    |
    v
Phase 2: Infrastructure (Tasks 4-6)
    |
    v
Phase 3: Translation (Tasks 7-13)
    |
    v
Phase 4: Integration (Tasks 14-15)
    |
    v
Phase 5: Verification (Task 16)
```

---

## Detailed TODOs

### Phase 1: Setup & Configuration

#### TODO 1: Install next-intl dependency
**File**: `package.json`
**Action**: Add next-intl package
```bash
npm install next-intl
```
**Acceptance Criteria**:
- next-intl appears in package.json dependencies
- npm install completes without errors

#### TODO 2: Create i18n configuration file
**File**: `src/i18n/config.ts`
**Action**: Create i18n configuration
```typescript
export const locales = ['ko', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ko'
```
**Acceptance Criteria**:
- Type-safe locale definitions
- Default locale set to Korean

#### TODO 3: Create next-intl request configuration
**File**: `src/i18n/request.ts`
**Action**: Configure next-intl for App Router
```typescript
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, type Locale } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as Locale) || defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  }
})
```
**Acceptance Criteria**:
- Reads locale from cookie
- Falls back to Korean if no cookie
- Dynamically imports correct message file

### Phase 2: Infrastructure

#### TODO 4: Create Korean message file (baseline)
**File**: `messages/ko.json`
**Action**: Create structured Korean translations
```json
{
  "common": {
    "loading": "로딩 중...",
    "error": "오류가 발생했습니다",
    "retry": "다시 시도",
    "cancel": "취소",
    "save": "저장",
    "delete": "삭제",
    "confirm": "확인"
  },
  "navigation": {
    "dashboard": "대시보드",
    "campaigns": "캠페인",
    "reports": "보고서",
    "settings": "설정",
    "help": "도움말",
    "logout": "로그아웃"
  },
  "login": { ... },
  "dashboard": { ... },
  "campaigns": { ... },
  "metaConnect": { ... },
  "metaPages": { ... },
  "pixel": { ... }
}
```
**Acceptance Criteria**:
- All Korean strings from 7 target pages included
- Organized by namespace (page/feature)
- ~225 strings total

#### TODO 5: Create English message file
**File**: `messages/en.json`
**Action**: Create English translations matching Korean structure
```json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Retry",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "confirm": "Confirm"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "campaigns": "Campaigns",
    "reports": "Reports",
    "settings": "Settings",
    "help": "Help",
    "logout": "Log out"
  },
  "login": { ... },
  "dashboard": { ... },
  "campaigns": { ... },
  "metaConnect": { ... },
  "metaPages": { ... },
  "pixel": { ... }
}
```
**Acceptance Criteria**:
- 1:1 match with Korean message keys
- Natural English translations (not literal)
- Professional tone suitable for Meta review

#### TODO 6: Create language toggle component
**File**: `src/presentation/components/common/LanguageToggle.tsx`
**Action**: Create KO/EN toggle button
```typescript
'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()

  const toggleLocale = async () => {
    const newLocale = locale === 'ko' ? 'en' : 'ko'
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="gap-1.5"
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">{locale.toUpperCase()}</span>
    </Button>
  )
}
```
**Acceptance Criteria**:
- Displays current locale (KO/EN)
- Click toggles between locales
- Sets cookie for persistence
- Refreshes page to apply new locale

### Phase 3: Page Translations

#### TODO 7: Update root layout with NextIntlClientProvider
**File**: `src/app/layout.tsx`
**Action**: Wrap app with i18n provider
```typescript
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

export default async function RootLayout({ children }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```
**Acceptance Criteria**:
- Provider wraps entire app
- Locale passed to html lang attribute
- Messages available to all client components

#### TODO 8: Translate login page
**File**: `src/app/(auth)/login/page.tsx`
**Action**: Replace hardcoded Korean with useTranslations
- ERROR_MESSAGES object → t('login.errors.xxx')
- Button labels → t('login.continueWith.google'), etc.
- Terms text → t('login.termsAgreement')
**Acceptance Criteria**:
- All 25 strings translated
- Error messages display in current locale
- No visual changes

#### TODO 9: Translate Header component
**File**: `src/presentation/components/common/Layout/Header.tsx`
**Action**: Add translations + LanguageToggle
- aria-labels → t('common.openMenu')
- User menu → t('navigation.logout')
- Add LanguageToggle to header
**Acceptance Criteria**:
- Header shows language toggle
- Logout and menu labels translated

#### TODO 10: Translate Sidebar component
**File**: `src/presentation/components/common/Layout/Sidebar.tsx`
**Action**: Replace navigation array with translations
- navigation items → t('navigation.xxx')
- aria-labels → translated versions
**Acceptance Criteria**:
- All 5 navigation items translated
- Brand name "바투" changes to "Batwo" in English

#### TODO 11: Translate Dashboard page
**File**: `src/app/(dashboard)/dashboard/page.tsx`
**Action**: Replace hardcoded strings
- Page title → t('dashboard.title')
- KPI labels → t('dashboard.kpi.xxx')
- Tab labels → t('dashboard.period.xxx')
**Acceptance Criteria**:
- All 20 strings translated
- Chart titles in correct language

#### TODO 12: Translate Campaigns pages
**Files**:
- `src/app/(dashboard)/campaigns/page.tsx`
- `src/app/(dashboard)/campaigns/new/page.tsx`
**Action**: Replace hardcoded strings
- Page titles, button labels, filter options
- Form labels and placeholders
- Toast messages
**Acceptance Criteria**:
- Campaign list page fully translated
- New campaign page fully translated
- Status badges translated (활성 → Active)

#### TODO 13: Translate Settings pages
**Files**:
- `src/app/(dashboard)/settings/meta-connect/page.tsx`
- `src/app/(dashboard)/settings/meta-pages/page.tsx`
- `src/app/(dashboard)/settings/pixel/page.tsx`
**Action**: Replace all hardcoded Korean
- Page titles and descriptions
- Button labels and states
- Success/error messages
- Feature lists
**Acceptance Criteria**:
- Meta Connect page: 40 strings translated
- Meta Pages page: 35 strings translated
- Pixel Settings page: 45 strings translated

### Phase 4: Integration

#### TODO 14: Update next.config.js for next-intl
**File**: `next.config.js` or `next.config.ts`
**Action**: Add next-intl plugin configuration
```javascript
const withNextIntl = require('next-intl/plugin')('./src/i18n/request.ts')

module.exports = withNextIntl({
  // existing config
})
```
**Acceptance Criteria**:
- Build completes without errors
- next-intl plugin properly integrated

#### TODO 15: Create TypeScript declarations for messages
**File**: `src/types/i18n.d.ts`
**Action**: Add type safety for translations
```typescript
import ko from '../../messages/ko.json'

type Messages = typeof ko

declare global {
  interface IntlMessages extends Messages {}
}
```
**Acceptance Criteria**:
- TypeScript autocomplete works for translation keys
- Invalid keys cause type errors

### Phase 5: Verification

#### TODO 16: Manual verification checklist
**Action**: Test all pages in both languages
- [ ] Login page: KO and EN
- [ ] Dashboard: KO and EN
- [ ] Campaigns list: KO and EN
- [ ] New campaign: KO and EN
- [ ] Meta Connect: KO and EN
- [ ] Meta Pages: KO and EN
- [ ] Pixel Settings: KO and EN
- [ ] Language toggle works
- [ ] Locale persists after refresh
- [ ] No console errors
- [ ] No TypeScript errors (`npm run type-check`)
**Acceptance Criteria**:
- All checkboxes pass
- Ready for Meta reviewer

---

## Commit Strategy

### Commit 1: Setup
```
feat(i18n): add next-intl configuration and message files

- Install next-intl dependency
- Create i18n config and request files
- Add Korean and English message files
- Create LanguageToggle component
```

### Commit 2: Core pages translation
```
feat(i18n): translate core pages to support English UI

- Update root layout with NextIntlClientProvider
- Translate login, dashboard, campaigns pages
- Translate Header and Sidebar components
```

### Commit 3: Settings pages translation
```
feat(i18n): translate settings pages for Meta review

- Translate Meta Connect page
- Translate Meta Pages page
- Translate Pixel Settings page
- Add TypeScript declarations for i18n
```

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Functional | Language toggle switches UI language instantly |
| Complete | All 225 strings translated in both languages |
| Persistent | Locale preference survives page refresh |
| Type-safe | No TypeScript errors with `npm run type-check` |
| Visual | No layout shifts or styling issues |
| Build | `npm run build` completes successfully |

---

## Estimated Effort

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| Setup | 1-3 | 30 minutes |
| Infrastructure | 4-6 | 1.5 hours |
| Translations | 7-13 | 3 hours |
| Integration | 14-15 | 30 minutes |
| Verification | 16 | 30 minutes |
| **Total** | **16** | **~6 hours** |

---

## File Change Summary

### New Files (6)
- `src/i18n/config.ts`
- `src/i18n/request.ts`
- `messages/ko.json`
- `messages/en.json`
- `src/presentation/components/common/LanguageToggle.tsx`
- `src/types/i18n.d.ts`

### Modified Files (10)
- `package.json`
- `next.config.js` or `next.config.ts`
- `src/app/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/campaigns/page.tsx`
- `src/app/(dashboard)/campaigns/new/page.tsx`
- `src/app/(dashboard)/settings/meta-connect/page.tsx`
- `src/app/(dashboard)/settings/meta-pages/page.tsx`
- `src/app/(dashboard)/settings/pixel/page.tsx`
- `src/presentation/components/common/Layout/Header.tsx`
- `src/presentation/components/common/Layout/Sidebar.tsx`

---

## Notes for Executor

1. **Message Extraction**: When translating pages, extract ALL visible text including:
   - aria-labels (for accessibility)
   - placeholder text
   - toast messages
   - confirm dialog text

2. **Variable Interpolation**: Some strings have dynamic values. Use next-intl's interpolation:
   ```typescript
   // Korean: "동기화 완료: {created}개 생성"
   // English: "Sync complete: {created} created"
   t('metaConnect.syncComplete', { created: data.created })
   ```

3. **Pluralization**: next-intl supports ICU message format for plurals:
   ```json
   "followers": "{count, plural, one {# follower} other {# followers}}"
   ```

4. **Date/Number Formatting**: Use next-intl's formatting functions:
   ```typescript
   const format = useFormatter()
   format.dateTime(date, { dateStyle: 'medium' })
   format.number(1000, { style: 'currency', currency: 'KRW' })
   ```
