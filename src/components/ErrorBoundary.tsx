'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback

      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            reset={() => this.setState({ hasError: false, error: undefined })}
          />
        )
      }

      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4">문제가 발생했습니다</h2>
            <p className="text-muted-foreground mb-6">
              일시적인 오류가 발생했습니다. 페이지를 새로고침해주세요.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => this.setState({ hasError: false, error: undefined })}
              >
                다시 시도
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                새로고침
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}