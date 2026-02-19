'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * 숫자 카운트업 애니메이션 훅
 * 스크롤 진입 시 또는 즉시 시작 가능
 * easeOutQuart 이징 적용
 */
export function useCountUp(target: number, duration: number = 2000, startOnMount: boolean = false) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(startOnMount)
  const frameRef = useRef<number>(0)

  const start = () => setStarted(true)

  useEffect(() => {
    if (!started) return

    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutQuart 이징
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(eased * target))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [started, target, duration])

  return { count, start }
}
