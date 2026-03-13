import { describe, expect, it } from 'vitest'
import {
  extractImportSpecifiers,
  findDevOnlyRuntimeDependencyIssues,
  normalizePackageName,
} from '@/lib/deployment/checkProductionDependencies'

describe('checkProductionDependencies', () => {
  it('extracts static and dynamic import specifiers', () => {
    const source = `
      import { QueryClient } from '@tanstack/react-query'
      import type { ReactNode } from 'react'
      export { ReactQueryDevtools } from '@tanstack/react-query-devtools'
      const sdk = await import('@sentry/nextjs')
      const yaml = require('yaml')
    `

    expect(extractImportSpecifiers(source)).toEqual([
      '@tanstack/react-query',
      'react',
      '@tanstack/react-query-devtools',
      '@sentry/nextjs',
      'yaml',
    ])
  })

  it('normalizes package names and ignores local aliases', () => {
    expect(normalizePackageName('@tanstack/react-query-devtools')).toBe(
      '@tanstack/react-query-devtools'
    )
    expect(normalizePackageName('@sentry/nextjs/client')).toBe('@sentry/nextjs')
    expect(normalizePackageName('react/jsx-runtime')).toBe('react')
    expect(normalizePackageName('@/lib/utils', ['@/'])).toBeNull()
    expect(normalizePackageName('@domain/entities/Campaign', ['@domain/'])).toBeNull()
    expect(normalizePackageName('./local-file')).toBeNull()
    expect(normalizePackageName('node:fs')).toBeNull()
  })

  it('reports runtime packages that exist only in devDependencies', () => {
    const issues = findDevOnlyRuntimeDependencyIssues({
      files: [
        {
          path: 'src/app/providers.tsx',
          content: `
            import { QueryClient } from '@tanstack/react-query'
            import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
            import { cn } from '@/lib/utils'
          `,
        },
        {
          path: 'next.config.ts',
          content: `import { withSentryConfig } from '@sentry/nextjs'`,
        },
      ],
      dependencies: ['@tanstack/react-query', '@sentry/nextjs'],
      devDependencies: ['@tanstack/react-query-devtools', 'typescript'],
      aliasPrefixes: ['@/'],
    })

    expect(issues).toEqual([
      {
        packageName: '@tanstack/react-query-devtools',
        files: ['src/app/providers.tsx'],
      },
    ])
  })
})
