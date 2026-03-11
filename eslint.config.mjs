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
  ]),
])

export default eslintConfig

