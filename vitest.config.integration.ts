import 'dotenv/config'
import { defineConfig } from 'vitest/config'
import path from 'path'

// For integration tests, use the test database
if (process.env['DATABASE_URL_TEST']) {
  process.env['DATABASE_URL'] = process.env['DATABASE_URL_TEST']
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/integration/setup.ts'],
    include: ['tests/integration/**/*.test.{ts,tsx}'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Vitest 4.x: Run tests sequentially to avoid DB conflicts
    sequence: {
      concurrent: false,
    },
    // Run test files sequentially
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/infrastructure/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@domain': path.resolve(__dirname, './src/domain'),
      '@application': path.resolve(__dirname, './src/application'),
      '@infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@presentation': path.resolve(__dirname, './src/presentation'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@tests': path.resolve(__dirname, './tests'),
    },
  },
})
