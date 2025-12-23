# Landing Page Test Suite - Summary

## Overview
Comprehensive test suite for the Batow landing page components using Vitest and React Testing Library.

## Test Environment Setup

### Dependencies Installed
- `vitest` - Fast unit test framework
- `@vitejs/plugin-react` - React plugin for Vitest
- `jsdom` - DOM implementation for Node.js
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - Custom jest matchers
- `@testing-library/user-event` - User interaction simulation

### Configuration Files
- `/Users/jm/batow-service/apps/web/vitest.config.ts` - Vitest configuration
- `/Users/jm/batow-service/apps/web/src/test/setup.ts` - Test setup and global configuration

### Test Scripts Added
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

## Test File Location
`/Users/jm/batow-service/apps/web/src/app/(landing)/__tests__/landing-page.test.tsx`

## Test Coverage Summary

### ✅ All 31 Tests Passing

#### Hero Section (4 tests)
- ✅ Renders headline text correctly
- ✅ Renders subtitle text correctly
- ✅ Renders primary CTA button with correct href
- ✅ Renders secondary CTA button with correct href

#### Features Section (4 tests)
- ✅ Renders section header
- ✅ Renders all 4 feature cards with titles
- ✅ Renders feature descriptions (AI 캠페인 세팅, AI 광고 소재 생성, 실시간 성과 분석, 자동 보고서)
- ✅ Has correct section id (#features) for navigation

#### Pricing Section (7 tests)
- ✅ Renders section header
- ✅ Renders "무료 베타" badge
- ✅ Renders pricing information (₩0/월)
- ✅ Renders all feature items (캠페인 주 5개 생성, AI 카피 생성 일 20회, etc.)
- ✅ Renders CTA button with correct href
- ✅ Displays no credit card required message
- ✅ Has correct section id (#pricing) for navigation

#### FAQ Section (6 tests)
- ✅ Renders section header
- ✅ Renders all 5 FAQ questions
- ✅ Accordion items are initially closed
- ✅ Can toggle accordion items (open)
- ✅ Can open and close accordion items
- ✅ Has correct section id (#faq) for navigation

#### Header Navigation (3 tests)
- ✅ Renders logo with correct link
- ✅ Renders navigation links (기능, 요금제, FAQ)
- ✅ Renders CTA button

#### Accessibility (5 tests)
- ✅ Hero section has proper h1 heading
- ✅ Features section has proper h2 heading
- ✅ Pricing section has proper h2 heading
- ✅ FAQ section has proper h2 heading
- ✅ All CTA buttons are keyboard accessible

#### Responsive Design (2 tests)
- ✅ Hero section has responsive text classes
- ✅ Features grid has responsive columns

## Key Test Patterns Used

### Component Rendering
```tsx
render(<Component />);
expect(screen.getByText('expected text')).toBeInTheDocument();
```

### User Interactions
```tsx
const user = userEvent.setup();
await user.click(element);
expect(result).toBeInTheDocument();
```

### Accessibility Checks
```tsx
const heading = screen.getByRole('heading', { level: 1 });
expect(heading).toBeInTheDocument();
```

### Navigation Links
```tsx
const link = screen.getByRole('link', { name: 'text' });
expect(link).toHaveAttribute('href', '/path');
```

## Running Tests

### Run all tests
```bash
cd apps/web
pnpm test
```

### Run tests in watch mode
```bash
pnpm test
```

### Run tests with UI
```bash
pnpm test:ui
```

### Run tests with coverage
```bash
pnpm test:coverage
```

## Test Structure

```
apps/web/
├── src/
│   ├── app/
│   │   └── (landing)/
│   │       ├── __tests__/
│   │       │   └── landing-page.test.tsx  # Main test file
│   │       ├── components/
│   │       │   ├── hero.tsx
│   │       │   ├── features.tsx
│   │       │   ├── pricing.tsx
│   │       │   ├── faq.tsx
│   │       │   └── header.tsx
│   │       └── page.tsx
│   └── test/
│       └── setup.ts  # Global test setup
└── vitest.config.ts  # Vitest configuration
```

## Coverage Areas

### Functional Testing
- Component rendering
- Text content verification
- Button and link functionality
- Navigation anchor links

### Interactive Testing
- Accordion open/close behavior
- User click interactions
- Multi-step user flows

### Accessibility Testing
- Semantic HTML structure
- Heading hierarchy
- Keyboard navigation
- ARIA attributes (via shadcn/ui components)

### Responsive Design Testing
- Responsive class verification
- Grid layout configuration
- Mobile-first approach validation

## Notes

- All tests use React Testing Library best practices
- Tests focus on user behavior rather than implementation details
- Accessibility is a first-class concern in all tests
- Components are tested in isolation for better maintainability
- Tests are organized by component with clear descriptions

## Future Enhancements

Consider adding:
- Visual regression tests with Playwright
- Integration tests for full page flows
- Performance testing with Lighthouse
- E2E tests for critical user journeys
- Screenshot testing for visual consistency
