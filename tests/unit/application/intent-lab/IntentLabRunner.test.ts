// tests/unit/application/intent-lab/IntentLabRunner.test.ts
import { describe, it, expect } from 'vitest'
import { IntentLabRunner } from '@application/intent-lab/IntentLabRunner'

describe('IntentLabRunner', () => {
  it('should run baseline and return report', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 200, iterationDelayMs: 0 })

    expect(report.baselineAccuracy).toBeGreaterThan(0)
    expect(report.bestAccuracy).toBeGreaterThanOrEqual(report.baselineAccuracy)
    expect(report.results.length).toBeGreaterThanOrEqual(0)
    expect(report.totalIterations).toBeGreaterThanOrEqual(0)
  })

  it('should improve or maintain accuracy', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 500, iterationDelayMs: 0 })

    expect(report.bestAccuracy).toBeGreaterThanOrEqual(report.baselineAccuracy)
  })

  it('should stop when time runs out', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 100, iterationDelayMs: 0 })

    expect(report.totalDurationMs).toBeLessThan(1000)
  })

  it('should report validation accuracy', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 100, iterationDelayMs: 0 })

    expect(report.validationAccuracy).toBeGreaterThanOrEqual(0)
    expect(report.validationAccuracy).toBeLessThanOrEqual(1)
  })

  it('should report per-difficulty breakdown', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 100, iterationDelayMs: 0 })

    expect(report.byDifficulty.easy).toBeDefined()
    expect(report.byDifficulty.medium).toBeDefined()
    expect(report.byDifficulty.hard).toBeDefined()
  })

  it('should run many iterations quickly (no LLM calls)', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 1000, iterationDelayMs: 0 })

    // Should run many iterations in 1 second (no API calls)
    expect(report.totalIterations).toBeGreaterThan(10)
  })

  it('should include gap report with synthetic vs real accuracy', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 100, iterationDelayMs: 0 })

    expect(report.gapReport).toBeDefined()
    expect(report.gapReport.syntheticAccuracy).toBeGreaterThanOrEqual(0)
    expect(report.gapReport.realAccuracy).toBeGreaterThanOrEqual(0)
    expect(report.gapReport.combinedAccuracy).toBeGreaterThanOrEqual(0)
    expect(typeof report.gapReport.gap).toBe('number')
    expect(report.gapReport.realByDifficulty).toBeDefined()
  })

  it('should accept combined train set mode', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 100, iterationDelayMs: 0, trainSetMode: 'combined' })

    expect(report.baselineAccuracy).toBeGreaterThan(0)
    expect(report.gapReport).toBeDefined()
  })
})
