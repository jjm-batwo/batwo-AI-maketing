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
  const frozen = useRef(false)

  useEffect(() => {
    if (frozen.current) return

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          if (freezeOnceVisible) {
            frozen.current = true
            observer.disconnect()
          }
        } else if (!freezeOnceVisible) {
          setIsIntersecting(false)
        }
      },
      { threshold, root, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, root, rootMargin, freezeOnceVisible])

  return { ref, isIntersecting }
}
