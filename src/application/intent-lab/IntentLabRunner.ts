// src/application/intent-lab/IntentLabRunner.ts
import { IntentClassifier } from '@domain/services/IntentClassifier'
import { DEFAULT_INTENT_CLASSIFIER_CONFIG, type IntentClassifierConfig } from '@domain/services/IntentClassifierConfig'
import { TRAIN_EVAL_SET, VALIDATION_EVAL_SET, FULL_EVAL_SET, REAL_EVAL_SET, COMBINED_EVAL_SET, evaluate, type EvalResult, type EvalCase } from './IntentLabEvalSet'
import { IntentLabMutator } from './IntentLabMutator'

export type TrainSetMode = 'synthetic' | 'combined'

export interface IntentLabConfig {
  maxDurationMs: number
  iterationDelayMs: number
  trainSetMode?: TrainSetMode
}

export interface IntentLabResult {
  trainAccuracy: number
  description: string
  status: 'keep' | 'discard'
}

export interface GapReport {
  syntheticAccuracy: number
  realAccuracy: number
  combinedAccuracy: number
  gap: number // synthetic - real
  realByDifficulty: EvalResult['byDifficulty']
  realFailures: EvalResult['failures']
}

export interface IntentLabReport {
  bestConfig: IntentClassifierConfig
  bestAccuracy: number
  baselineAccuracy: number
  validationAccuracy: number
  gapReport: GapReport
  results: IntentLabResult[]
  totalDurationMs: number
  totalIterations: number
  improvementFromBaseline: number
  byDifficulty: EvalResult['byDifficulty']
  failures: EvalResult['failures']
}

const BASELINE_FLOOR_RATIO = 0.95

export class IntentLabRunner {
  private mutator = new IntentLabMutator()

  async run(config: IntentLabConfig): Promise<IntentLabReport> {
    const results: IntentLabResult[] = []
    const trainSet = this.resolveTrainSet(config.trainSetMode ?? 'synthetic')
    this.mutator.setTrainSet(trainSet)

    // 1. Baseline
    const baselineClassifier = IntentClassifier.create()
    const baselineEval = evaluate(baselineClassifier, trainSet)
    let bestConfig = DEFAULT_INTENT_CLASSIFIER_CONFIG
    let bestAccuracy = baselineEval.accuracy
    const baselineAccuracy = baselineEval.accuracy

    console.log(`[IntentLab] baseline: ${(baselineAccuracy * 100).toFixed(1)}% (trainSet: ${config.trainSetMode ?? 'synthetic'}, ${trainSet.length} cases)`)

    // 2. LOOP (time-based, like autoresearch's LOOP FOREVER)
    const startTime = Date.now()
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

    while (true) {
      if (Date.now() - startTime >= config.maxDurationMs) break

      const mutation = this.mutator.mutate(bestConfig)
      const classifier = IntentClassifier.create(mutation.config)
      const evalResult = evaluate(classifier, trainSet)

      // Floor check
      if (evalResult.accuracy < baselineAccuracy * BASELINE_FLOOR_RATIO) {
        results.push({ trainAccuracy: evalResult.accuracy, description: mutation.description, status: 'discard' })
        if (config.iterationDelayMs > 0) await delay(config.iterationDelayMs)
        continue
      }

      // Keep/discard decision
      // Keep if: better accuracy, or same accuracy but simpler config
      const isSimpler = this.countKeywords(mutation.config) < this.countKeywords(bestConfig)
      const shouldKeep = evalResult.accuracy > bestAccuracy || (evalResult.accuracy === bestAccuracy && isSimpler)

      if (shouldKeep) {
        bestConfig = mutation.config
        bestAccuracy = evalResult.accuracy
        console.log(`[IntentLab] #${results.length + 1} KEEP ${mutation.description} → ${(evalResult.accuracy * 100).toFixed(1)}%`)
      }

      results.push({
        trainAccuracy: evalResult.accuracy,
        description: mutation.description,
        status: shouldKeep ? 'keep' : 'discard',
      })

      if (config.iterationDelayMs > 0) await delay(config.iterationDelayMs)
    }

    // 3. Final validation
    const finalClassifier = IntentClassifier.create(bestConfig)
    const validationEval = evaluate(finalClassifier, VALIDATION_EVAL_SET)
    const fullEval = evaluate(finalClassifier, FULL_EVAL_SET)

    // 4. Gap report: synthetic vs real vs combined
    const realEval = evaluate(finalClassifier, REAL_EVAL_SET)
    const combinedEval = evaluate(finalClassifier, COMBINED_EVAL_SET)
    const gapReport: GapReport = {
      syntheticAccuracy: fullEval.accuracy,
      realAccuracy: realEval.accuracy,
      combinedAccuracy: combinedEval.accuracy,
      gap: fullEval.accuracy - realEval.accuracy,
      realByDifficulty: realEval.byDifficulty,
      realFailures: realEval.failures,
    }

    return {
      bestConfig,
      bestAccuracy,
      baselineAccuracy,
      validationAccuracy: validationEval.accuracy,
      gapReport,
      results,
      totalDurationMs: Date.now() - startTime,
      totalIterations: results.length,
      improvementFromBaseline: baselineAccuracy > 0 ? ((bestAccuracy - baselineAccuracy) / baselineAccuracy) * 100 : 0,
      byDifficulty: fullEval.byDifficulty,
      failures: fullEval.failures,
    }
  }

  private resolveTrainSet(mode: TrainSetMode): readonly EvalCase[] {
    switch (mode) {
      case 'combined': return COMBINED_EVAL_SET
      case 'synthetic': return TRAIN_EVAL_SET
    }
  }

  private countKeywords(config: IntentClassifierConfig): number {
    return Object.values(config.keywordMap).reduce((sum, kw) => sum + kw.length, 0) +
      Object.values(config.contextMap).reduce((sum, p) => sum + p.length, 0)
  }
}
