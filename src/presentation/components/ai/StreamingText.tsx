'use client'

import { memo } from 'react'

interface StreamingTextProps {
  text: string
  isLoading?: boolean
  className?: string
  cursorClassName?: string
}

/**
 * StreamingText Component
 *
 * Displays text with an animated cursor while loading.
 * Used for AI-generated content that appears character by character.
 *
 * @param text - The text content to display
 * @param isLoading - Shows blinking cursor when true
 * @param className - Additional CSS classes for the text container
 * @param cursorClassName - Additional CSS classes for the cursor
 */
export const StreamingText = memo(function StreamingText({
  text,
  isLoading = false,
  className = '',
  cursorClassName = ''
}: StreamingTextProps) {
  return (
    <span className={`inline-block ${className}`}>
      {text}
      {isLoading && (
        <span
          className={`inline-block w-0.5 h-5 ml-1 bg-primary animate-pulse ${cursorClassName}`}
          aria-hidden="true"
          style={{
            animation: 'blink 1s ease-in-out infinite'
          }}
        />
      )}
      <style jsx>{`
        @keyframes blink {
          0%, 49% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0;
          }
        }
      `}</style>
    </span>
  )
})
