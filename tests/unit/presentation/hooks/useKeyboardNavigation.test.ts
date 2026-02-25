import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardNavigation } from '@presentation/hooks/useKeyboardNavigation'
import { createRef } from 'react'

describe('useKeyboardNavigation', () => {
  let container: HTMLElement
  let messages: HTMLElement[]
  let input: HTMLElement

  beforeEach(() => {
    // 컨테이너 설정
    container = document.createElement('div')
    document.body.appendChild(container)

    // article role 메시지 3개 생성
    messages = Array.from({ length: 3 }, (_, i) => {
      const el = document.createElement('div')
      el.setAttribute('role', 'article')
      el.setAttribute('tabIndex', '0')
      el.setAttribute('data-index', String(i))
      container.appendChild(el)
      return el
    })

    // 입력 필드
    input = document.createElement('input')
    document.body.appendChild(input)
  })

  afterEach(() => {
    document.body.removeChild(container)
    document.body.removeChild(input)
  })

  it('should_focus_next_message_when_ArrowDown_pressed', () => {
    const containerRef = { current: container }
    const inputRef = { current: input }

    renderHook(() => useKeyboardNavigation(containerRef, inputRef))

    // 첫 번째 메시지에 포커스
    messages[0].focus()

    // ArrowDown 이벤트 발생
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    container.dispatchEvent(event)

    expect(document.activeElement).toBe(messages[1])
  })

  it('should_focus_previous_message_when_ArrowUp_pressed', () => {
    const containerRef = { current: container }
    const inputRef = { current: input }

    renderHook(() => useKeyboardNavigation(containerRef, inputRef))

    // 두 번째 메시지에 포커스
    messages[1].focus()

    // ArrowUp 이벤트 발생
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
    container.dispatchEvent(event)

    expect(document.activeElement).toBe(messages[0])
  })

  it('should_focus_input_when_Escape_pressed', () => {
    const containerRef = { current: container }
    const inputRef = { current: input }

    renderHook(() => useKeyboardNavigation(containerRef, inputRef))

    // 메시지에 포커스
    messages[0].focus()

    // Escape 이벤트 발생
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    container.dispatchEvent(event)

    expect(document.activeElement).toBe(input)
  })

  it('should_not_move_focus_beyond_last_message_on_ArrowDown', () => {
    const containerRef = { current: container }
    const inputRef = { current: input }

    renderHook(() => useKeyboardNavigation(containerRef, inputRef))

    // 마지막 메시지에 포커스
    messages[2].focus()

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    container.dispatchEvent(event)

    // 마지막 메시지에 그대로 있어야 함
    expect(document.activeElement).toBe(messages[2])
  })

  it('should_not_move_focus_before_first_message_on_ArrowUp', () => {
    const containerRef = { current: container }
    const inputRef = { current: input }

    renderHook(() => useKeyboardNavigation(containerRef, inputRef))

    // 첫 번째 메시지에 포커스
    messages[0].focus()

    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
    container.dispatchEvent(event)

    // 첫 번째 메시지에 그대로 있어야 함
    expect(document.activeElement).toBe(messages[0])
  })

  it('should_cleanup_event_listener_on_unmount', () => {
    const containerRef = { current: container }
    const inputRef = { current: input }
    const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener')

    const { unmount } = renderHook(() => useKeyboardNavigation(containerRef, inputRef))
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})
