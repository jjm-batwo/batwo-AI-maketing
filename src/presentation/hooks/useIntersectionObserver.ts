'use client'

import { useState, useEffect, useRef, RefObject } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
}

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
): {
  ref: RefObject<T | null>
  isIntersecting: boolean
} {
  const { threshold = 0.1, root = null, rootMargin = '0px', freezeOnceVisible = true } = options
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting

        if (freezeOnceVisible && isIntersecting) {
          return
        }

        setIsIntersecting(isElementIntersecting)
      },
      { threshold, root, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, root, rootMargin, freezeOnceVisible, isIntersecting])

  return { ref, isIntersecting }
}
