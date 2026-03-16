// src/application/intent-lab/IntentLabRunner.ts
import { IntentClassifier } from '@domain/services/IntentClassifier'
import { DEFAULT_INTENT_CLASSIFIER_CONFIG, type IntentClassifierConfig } from '@domain/services/IntentClassifierConfig'
import { TRAIN_EVAL_SET, VALIDATION_EVAL_SET, FULL_EVAL_SET, evaluate, type EvalResult } from './IntentLabEvalSet'
import { IntentLabMutator } from './IntentLabMutator'

export interface IntentLabConfig {
  maxDurationMs: number
  iterationDelayMs: number
}

export interface IntentLabResult {
  trainAccuracy: number
  description: string
  status: 'keep' | 'discard'
}

export interface IntentLabReport {
  bestConfig: IntentClassifierConfig
  bestAccuracy: number
  baselineAccuracy: number
  validationAccuracy: number
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

    // 1. Baseline
    const baselineClassifier = IntentClassifier.create()
    const baselineEval = evaluate(baselineClassifier, TRAIN_EVAL_SET)
    let bestConfig = DEFAULT_INTENT_CLASSIFIER_CONFIG
    let bestAccuracy = baselineEval.accuracy
    const baselineAccuracy = baselineEval.accuracy

    console.log(`[IntentLab] baseline: ${(baselineAccuracy * 100).toFixed(1)}%`)

    // 2. LOOP (time-based, like autoresearch's LOOP FOREVER)
    const startTime = Date.now()
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

    while (true) {
      if (Date.now() - startTime >= config.maxDurationMs) break

      const mutation = this.mutator.mutate(bestConfig)
      const classifier = IntentClassifier.create(mutation.config)
      const evalResult = evaluate(classifier, TRAIN_EVAL_SET)

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

    return {
      bestConfig,
      bestAccuracy,
      baselineAccuracy,
      validationAccuracy: validationEval.accuracy,
      results,
      totalDurationMs: Date.now() - startTime,
      totalIterations: results.length,
      improvementFromBaseline: baselineAccuracy > 0 ? ((bestAccuracy - baselineAccuracy) / baselineAccuracy) * 100 : 0,
      byDifficulty: fullEval.byDifficulty,
      failures: fullEval.failures,
    }
  }

  private countKeywords(config: IntentClassifierConfig): number {
    return Object.values(config.keywordMap).reduce((sum, kw) => sum + kw.length, 0) +
      Object.values(config.contextMap).reduce((sum, p) => sum + p.length, 0)
  }
}
