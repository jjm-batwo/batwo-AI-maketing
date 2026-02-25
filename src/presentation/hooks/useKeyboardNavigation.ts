'use client'

import { RefObject, useEffect } from 'react'

/**
 * 채팅 메시지 컨테이너 내 키보드 네비게이션 훅
 * - ArrowDown: 다음 메시지(role="article")로 포커스 이동
 * - ArrowUp: 이전 메시지(role="article")로 포커스 이동
 * - Escape: 입력 필드(inputRef)로 포커스 복귀
 */
export function useKeyboardNavigation(
  containerRef: RefObject<HTMLElement | null>,
  inputRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const articles = Array.from(
        container.querySelectorAll<HTMLElement>('[role="article"]')
      )
      if (articles.length === 0) return

      const currentIndex = articles.indexOf(document.activeElement as HTMLElement)

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        const nextIndex = currentIndex < articles.length - 1 ? currentIndex + 1 : currentIndex
        articles[nextIndex]?.focus()
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0
        articles[prevIndex]?.focus()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        inputRef?.current?.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, inputRef])
}
