import { Page } from '@playwright/test'

const DEVTOOLS_CSS = '.tsqd-parent-container { display: none !important; }'

/**
 * TanStack Query DevTools 오버레이를 숨김
 *
 * E2E 테스트 시 DevTools 로고 아이콘이 화면 하단에 표시되어
 * chat-trigger-button 등 UI 요소 클릭을 가로채는 문제를 방지한다.
 *
 * - addStyleTag: 현재 페이지에 즉시 적용
 * - addInitScript: 이후 모든 네비게이션에서 자동 재실행
 */
export async function hideDevtools(page: Page): Promise<void> {
  // 현재 페이지에 즉시 적용 (page.goto 이후 호출 시)
  await page.addStyleTag({ content: DEVTOOLS_CSS }).catch(() => {
    // 페이지가 아직 로드되지 않은 경우 무시
  })

  // 이후 네비게이션에서 자동 적용 (page.goto 이전 호출 시)
  await page.addInitScript((css) => {
    const inject = () => {
      if (!document.getElementById('e2e-hide-devtools')) {
        const style = document.createElement('style')
        style.id = 'e2e-hide-devtools'
        style.textContent = css
        ;(document.head || document.documentElement).appendChild(style)
      }
    }
    if (document.head) inject()
    else document.addEventListener('DOMContentLoaded', inject)
  }, DEVTOOLS_CSS)
}
