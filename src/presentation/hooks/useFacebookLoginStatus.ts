'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FacebookAuthResponse } from '@/types/facebook'

export type FacebookLoginStatus = 'connected' | 'not_authorized' | 'unknown' | 'loading'

export function useFacebookLoginStatus() {
  const [status, setStatus] = useState<FacebookLoginStatus>('loading')
  const [authResponse, setAuthResponse] = useState<FacebookAuthResponse | null>(null)
  const [isSDKLoaded, setIsSDKLoaded] = useState(false)

  // Check if FB SDK is loaded
  useEffect(() => {
    const checkSDK = () => {
      if (window.FB) {
        setIsSDKLoaded(true)
        return true
      }
      return false
    }

    if (checkSDK()) return

    // In test environment, skip SDK loading to avoid timeouts
    if (process.env.NODE_ENV === 'test' || (typeof navigator !== 'undefined' && navigator.webdriver)) {
      setStatus('unknown')
      return
    }

    // Poll for SDK load (it loads async)
    const interval = setInterval(() => {
      if (checkSDK()) {
        clearInterval(interval)
      }
    }, 100)

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (!window.FB) {
        setStatus('unknown')
      }
    }, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  // Check login status once SDK is loaded
  useEffect(() => {
    if (!isSDKLoaded || !window.FB) return

    window.FB.getLoginStatus((response) => {
      setStatus(response.status)
      if (response.authResponse) {
        setAuthResponse(response.authResponse)
      }
    })
  }, [isSDKLoaded])

  // Manual refresh function
  const refreshStatus = useCallback(() => {
    if (!window.FB) {
      setStatus('unknown')
      return
    }

    setStatus('loading')
    window.FB.getLoginStatus((response) => {
      setStatus(response.status)
      if (response.authResponse) {
        setAuthResponse(response.authResponse)
      } else {
        setAuthResponse(null)
      }
    })
  }, [])

  return {
    status,
    authResponse,
    isSDKLoaded,
    refreshStatus,
    isConnected: status === 'connected',
    isLoading: status === 'loading',
  }
}
