import { Page } from '@playwright/test'

/**
 * 일반적으로 사용되는 뷰포트 크기
 */
export const VIEWPORTS = {
  mobile: {
    width: 375,
    height: 667,
    name: 'iPhone SE',
  },
  mobileWide: {
    width: 414,
    height: 896,
    name: 'iPhone 11 Pro Max',
  },
  tablet: {
    width: 768,
    height: 1024,
    name: 'iPad',
  },
  tabletWide: {
    width: 1024,
    height: 768,
    name: 'iPad Pro',
  },
  desktop: {
    width: 1280,
    height: 720,
    name: 'Desktop HD',
  },
  desktopWide: {
    width: 1920,
    height: 1080,
    name: 'Desktop Full HD',
  },
} as const

export type ViewportName = keyof typeof VIEWPORTS

/**
 * 뷰포트 헬퍼
 */
export async function setViewport(page: Page, viewport: ViewportName) {
  const { width, height } = VIEWPORTS[viewport]
  await page.setViewportSize({ width, height })
}

/**
 * 모바일 여부 확인
 */
export function isMobileViewport(viewport: ViewportName): boolean {
  return viewport === 'mobile' || viewport === 'mobileWide'
}

/**
 * 태블릿 여부 확인
 */
export function isTabletViewport(viewport: ViewportName): boolean {
  return viewport === 'tablet' || viewport === 'tabletWide'
}

/**
 * 데스크톱 여부 확인
 */
export function isDesktopViewport(viewport: ViewportName): boolean {
  return viewport === 'desktop' || viewport === 'desktopWide'
}
