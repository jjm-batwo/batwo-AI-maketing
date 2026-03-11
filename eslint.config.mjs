import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import pluginSecurity from 'eslint-plugin-security'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Phase 4: Security plugin for detecting common security anti-patterns
  pluginSecurity.configs.recommended,
  {
    rules: {
      // Allow unused variables that start with underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Security rules fine-tuning
      'security/detect-object-injection': 'off', // Too many false positives in TypeScript
      'security/detect-non-literal-fs-filename': 'warn', // Warn on dynamic file paths
      'security/detect-eval-with-expression': 'error', // Block eval with dynamic input
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',
    },
  },
  // Test & MSW files: relax strict rules (mocking patterns require `any`)
  {
    files: ['tests/**/*.{ts,tsx}', 'tests/msw/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Generated files:
    'src/generated/**',
    'coverage/**',
    // Git worktrees (isolated working directories):
    '.worktrees/**',
    // Playwright reports & traces (auto-generated bundles):
    'playwright-report/**',
    'test-results/**',
    // Performance test scripts (k6/Artillery, non-standard JS):
    'tests/performance/**',
  ]),
])

export default eslintConfig

