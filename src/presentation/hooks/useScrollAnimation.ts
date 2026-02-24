'use client'

import { useState, useEffect, useCallback, RefObject } from 'react'

interface ScrollAnimationOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

/**
 * Enhanced scroll-triggered animation hook
 * Supports stagger animations and trigger once option
 */
export function useScrollAnimation(
  ref: RefObject<Element | null>,
  options: ScrollAnimationOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            setHasTriggered(true)
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref, threshold, rootMargin, triggerOnce])

  return { isVisible, hasTriggered }
}

/**
 * Stagger animation for multiple elements
 * Returns visible state and stagger delay for each item
 */
export function useStaggerAnimation(itemCount: number, baseDelay: number = 0.1) {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(itemCount).fill(false))

  const triggerItem = useCallback((index: number) => {
    setVisibleItems((prev) => {
      const newState = [...prev]
      newState[index] = true
      return newState
    })
  }, [])

  const resetItems = useCallback(() => {
    setVisibleItems(new Array(itemCount).fill(false))
  }, [itemCount])

  const getStaggerDelay = useCallback(
    (index: number) => ({
      animationDelay: `${index * baseDelay}s`,
    }),
    [baseDelay]
  )

  return {
    visibleItems,
    triggerItem,
    resetItems,
    getStaggerDelay,
  }
}

/**
 * Hook for parallax scroll effect
 */
export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    let rafId: number
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      if (rafId) return

      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY
        // Only update if scroll changed significantly
        if (Math.abs(scrollY - lastScrollY) > 1) {
          setOffset(scrollY * speed)
          lastScrollY = scrollY
        }
        rafId = 0
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [speed])

  return offset
}

/**
 * Hook to detect mobile viewport
 */
export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

/**
 * Hook for smooth scroll to element
 */
export function useSmoothScroll() {
  const scrollToElement = useCallback((elementId: string, offset: number = 80) => {
    const element = document.getElementById(elementId)
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  return scrollToElement
}
