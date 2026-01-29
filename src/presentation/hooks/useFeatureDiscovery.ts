'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'batwo_discovered_features'

export type AIFeatureType =
  | 'copy_generation'
  | 'analysis'
  | 'chat'
  | 'insights'
  | 'proactive_insights'
  | 'science_score'
  | 'contextual_suggestions'
  | 'ambient_insights'
  | 'error_recovery'
  | 'confidence_indicator'

interface DiscoveredFeatures {
  [key: string]: {
    discoveredAt: string
    viewCount: number
  }
}

export function useFeatureDiscovery() {
  const [discoveredFeatures, setDiscoveredFeatures] = useState<DiscoveredFeatures>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setDiscoveredFeatures(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load discovered features:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Persist to localStorage
  const persistFeatures = (features: DiscoveredFeatures) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(features))
    } catch (error) {
      console.error('Failed to save discovered features:', error)
    }
  }

  const markDiscovered = (feature: AIFeatureType) => {
    setDiscoveredFeatures((prev) => {
      const existing = prev[feature]
      const updated = {
        ...prev,
        [feature]: {
          discoveredAt: existing?.discoveredAt || new Date().toISOString(),
          viewCount: (existing?.viewCount || 0) + 1,
        },
      }
      persistFeatures(updated)
      return updated
    })
  }

  const isDiscovered = (feature: AIFeatureType): boolean => {
    return feature in discoveredFeatures
  }

  const getViewCount = (feature: AIFeatureType): number => {
    return discoveredFeatures[feature]?.viewCount || 0
  }

  const getDiscoveryDate = (feature: AIFeatureType): Date | null => {
    const dateStr = discoveredFeatures[feature]?.discoveredAt
    return dateStr ? new Date(dateStr) : null
  }

  const getUndiscoveredFeatures = (): AIFeatureType[] => {
    const allFeatures: AIFeatureType[] = [
      'copy_generation',
      'analysis',
      'chat',
      'insights',
      'proactive_insights',
      'science_score',
      'contextual_suggestions',
      'ambient_insights',
      'error_recovery',
      'confidence_indicator',
    ]

    return allFeatures.filter((feature) => !isDiscovered(feature))
  }

  const resetAll = () => {
    setDiscoveredFeatures({})
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to reset discovered features:', error)
    }
  }

  const getTotalDiscoveredCount = (): number => {
    return Object.keys(discoveredFeatures).length
  }

  const getDiscoveryProgress = (): number => {
    const total = 10 // Total number of features
    const discovered = getTotalDiscoveredCount()
    return Math.round((discovered / total) * 100)
  }

  return {
    isLoaded,
    discoveredFeatures,
    markDiscovered,
    isDiscovered,
    getViewCount,
    getDiscoveryDate,
    getUndiscoveredFeatures,
    resetAll,
    getTotalDiscoveredCount,
    getDiscoveryProgress,
  }
}
