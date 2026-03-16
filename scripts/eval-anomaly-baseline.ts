/**
 * 이상치 탐지 임계값 baseline 측정 + 최적화
 * Usage: npx tsx scripts/eval-anomaly-baseline.ts [duration_sec]
 *
 * autoresearch 패턴:
 * - prepare.py = 합성 KPI 시계열 (정상 + 이상치 라벨링)
 * - evaluate_bpb = F1 score (precision × recall 조화 평균)
 * - train.py = 임계값 8개 (zScore, IQR, trend, spike, drop 등)
 *
 * 비용: $0 (순수 계산)
 */

import {
  calculateBaseline,
  type AnomalyDetectionConfig,
} from '../src/application/services/AnomalyDetectionService'

// === 합성 KPI 시계열 생성 (= prepare.py) ===

interface TimeSeriesCase {
  id: string
  values: number[]        // 30일치 데이터
  latestValue: number     // 마지막 값 (감지 대상)
  isAnomaly: boolean      // 정답 라벨
  description: string
}

function generateNormalSeries(id: string, mean: number, stdDev: number): TimeSeriesCase {
  const values: number[] = []
  for (let i = 0; i < 30; i++) {
    // Box-Muller 변환으로 정규분포 생성
    const u1 = Math.random()
    const u2 = Math.random()
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    values.push(Math.max(0, mean + normal * stdDev))
  }
  return {
    id,
    values: values.slice(0, 29),
    latestValue: values[29],
    isAnomaly: false,
    description: `정상 시계열 (mean=${mean}, std=${stdDev})`,
  }
}

function generateAnomalySeries(
  id: string,
  mean: number,
  stdDev: number,
  anomalyType: 'spike' | 'drop' | 'gradual_rise' | 'gradual_drop',
): TimeSeriesCase {
  const values: number[] = []
  for (let i = 0; i < 29; i++) {
    const u1 = Math.random()
    const u2 = Math.random()
    const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    values.push(Math.max(0, mean + normal * stdDev))
  }

  let latestValue: number
  let description: string

  switch (anomalyType) {
    case 'spike':
      latestValue = mean + stdDev * (3.5 + Math.random() * 2) // 3.5~5.5σ 급등
      description = `급등 이상치 (${((latestValue / mean - 1) * 100).toFixed(0)}% 증가)`
      break
    case 'drop':
      latestValue = Math.max(0, mean - stdDev * (3 + Math.random() * 2)) // 3~5σ 급락
      description = `급락 이상치 (${((1 - latestValue / mean) * 100).toFixed(0)}% 감소)`
      break
    case 'gradual_rise':
      // 마지막 5일이 점진적으로 상승
      for (let i = 24; i < 29; i++) {
        values[i] = mean + stdDev * (0.5 * (i - 23))
      }
      latestValue = mean + stdDev * 3.5
      description = `점진적 상승 이상치`
      break
    case 'gradual_drop':
      for (let i = 24; i < 29; i++) {
        values[i] = mean - stdDev * (0.4 * (i - 23))
      }
      latestValue = Math.max(0, mean - stdDev * 3)
      description = `점진적 하락 이상치`
      break
  }

  return { id, values, latestValue, isAnomaly: true, description }
}

// 고정 시드를 위한 eval set (매번 같은 결과)
function createEvalSet(): TimeSeriesCase[] {
  // 시드 고정을 위해 Math.random 대신 deterministic하게
  const savedRandom = Math.random
  let seed = 42
  Math.random = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return seed / 2147483647
  }

  const cases: TimeSeriesCase[] = []

  // 정상 시계열 60개 (다양한 mean/stdDev)
  const normalParams = [
    { mean: 1000, std: 100 },   // 노출수급
    { mean: 50, std: 8 },       // 클릭수급
    { mean: 5, std: 1.5 },      // 전환수급
    { mean: 500000, std: 50000 }, // 지출급
    { mean: 2.5, std: 0.3 },    // ROAS급
    { mean: 0.02, std: 0.003 }, // CTR급
  ]
  for (let i = 0; i < 60; i++) {
    const p = normalParams[i % normalParams.length]
    cases.push(generateNormalSeries(`normal-${i}`, p.mean, p.std))
  }

  // 이상치 시계열 40개
  const anomalyTypes: Array<'spike' | 'drop' | 'gradual_rise' | 'gradual_drop'> =
    ['spike', 'drop', 'gradual_rise', 'gradual_drop']
  for (let i = 0; i < 40; i++) {
    const p = normalParams[i % normalParams.length]
    const type = anomalyTypes[i % 4]
    cases.push(generateAnomalySeries(`anomaly-${i}`, p.mean, p.std, type))
  }

  Math.random = savedRandom
  return cases
}

// === 평가 함수 (= evaluate_bpb) ===

interface DetectionResult {
  detected: boolean
  method: string
}

function detectWithConfig(
  historicalValues: number[],
  latestValue: number,
  config: AnomalyDetectionConfig,
): DetectionResult {
  const baseline = calculateBaseline(historicalValues)

  // Z-Score 감지
  if (baseline.sampleSize >= config.minDataPointsForZScore && baseline.stdDev > 0) {
    const zScore = Math.abs((latestValue - baseline.mean) / baseline.stdDev)
    if (zScore > config.zScoreThreshold) {
      return { detected: true, method: 'zscore' }
    }
  }

  // IQR 감지
  if (baseline.sampleSize >= config.minDataPoints) {
    const iqr = baseline.q3 - baseline.q1
    const lower = baseline.q1 - config.iqrMultiplier * iqr
    const upper = baseline.q3 + config.iqrMultiplier * iqr
    if (latestValue < lower || latestValue > upper) {
      return { detected: true, method: 'iqr' }
    }
  }

  // 이동 평균 감지
  if (historicalValues.length >= config.movingAverageWindow) {
    const window = historicalValues.slice(-config.movingAverageWindow)
    const ma = window.reduce((a, b) => a + b, 0) / window.length
    if (ma > 0) {
      const deviation = ((latestValue - ma) / ma) * 100
      if (Math.abs(deviation) > config.trendDeviationThreshold) {
        return { detected: true, method: 'moving_average' }
      }
    }
  }

  // 백분율 변화 감지 (폴백)
  const prev = historicalValues[historicalValues.length - 1]
  if (prev > 0) {
    const pctChange = ((latestValue - prev) / prev) * 100
    if (pctChange > config.spikeThreshold || pctChange < config.dropThreshold) {
      return { detected: true, method: 'threshold' }
    }
  }

  return { detected: false, method: 'none' }
}

interface EvalResult {
  accuracy: number
  precision: number    // 감지한 것 중 진짜 이상치 비율
  recall: number       // 진짜 이상치 중 감지한 비율
  f1: number           // precision과 recall의 조화 평균
  truePositive: number
  falsePositive: number
  trueNegative: number
  falseNegative: number
}

function evaluate(evalSet: TimeSeriesCase[], config: AnomalyDetectionConfig): EvalResult {
  let tp = 0, fp = 0, tn = 0, fn = 0

  for (const c of evalSet) {
    const result = detectWithConfig(c.values, c.latestValue, config)
    if (c.isAnomaly && result.detected) tp++
    else if (!c.isAnomaly && result.detected) fp++
    else if (!c.isAnomaly && !result.detected) tn++
    else fn++
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0

  return {
    accuracy: (tp + tn) / (tp + fp + tn + fn),
    precision,
    recall,
    f1,
    truePositive: tp,
    falsePositive: fp,
    trueNegative: tn,
    falseNegative: fn,
  }
}

// === 실험 루프 (= autoresearch LOOP) ===

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  zScoreThreshold: 2.5,
  iqrMultiplier: 1.5,
  movingAverageWindow: 7,
  trendDeviationThreshold: 30,
  spikeThreshold: 50,
  dropThreshold: -30,
  minDataPoints: 7,
  minDataPointsForZScore: 14,
  useKoreanCalendar: true,
}

type ConfigKey = keyof Omit<AnomalyDetectionConfig, 'useKoreanCalendar'>

const MUTATION_RANGES: Record<ConfigKey, { min: number; max: number; step: number }> = {
  zScoreThreshold: { min: 1.5, max: 4.0, step: 0.1 },
  iqrMultiplier: { min: 1.0, max: 3.0, step: 0.1 },
  movingAverageWindow: { min: 3, max: 14, step: 1 },
  trendDeviationThreshold: { min: 15, max: 60, step: 5 },
  spikeThreshold: { min: 20, max: 100, step: 5 },
  dropThreshold: { min: -60, max: -15, step: 5 },
  minDataPoints: { min: 3, max: 14, step: 1 },
  minDataPointsForZScore: { min: 7, max: 28, step: 1 },
}

function mutateConfig(base: AnomalyDetectionConfig): { config: AnomalyDetectionConfig; description: string } {
  const keys = Object.keys(MUTATION_RANGES) as ConfigKey[]
  const key = keys[Math.floor(Math.random() * keys.length)]
  const range = MUTATION_RANGES[key]

  const config = { ...base }
  const delta = (Math.random() > 0.5 ? 1 : -1) * range.step * (1 + Math.floor(Math.random() * 2))
  const raw = (base[key] as number) + delta
  const clamped = Math.max(range.min, Math.min(range.max, Math.round(raw * 10) / 10))

  if (clamped === base[key]) {
    return mutateConfig(base) // retry
  }

  ;(config[key] as number) = clamped
  return { config, description: `${key}: ${base[key]} → ${clamped}` }
}

async function main() {
  const DURATION_MS = (Number(process.argv[2]) || 30) * 1000

  console.log('=== Anomaly Detection Threshold Lab ===')
  console.log(`실행 시간: ${DURATION_MS / 1000}초`)
  console.log(`비용: $0`)
  console.log('')

  const evalSet = createEvalSet()
  console.log(`Eval set: ${evalSet.length}개 (정상 ${evalSet.filter((c) => !c.isAnomaly).length} + 이상치 ${evalSet.filter((c) => c.isAnomaly).length})`)

  // 1. Baseline
  const baselineResult = evaluate(evalSet, DEFAULT_CONFIG)
  console.log('')
  console.log(`[Baseline] F1=${(baselineResult.f1 * 100).toFixed(1)}% precision=${(baselineResult.precision * 100).toFixed(1)}% recall=${(baselineResult.recall * 100).toFixed(1)}%`)
  console.log(`  TP=${baselineResult.truePositive} FP=${baselineResult.falsePositive} TN=${baselineResult.trueNegative} FN=${baselineResult.falseNegative}`)

  let bestConfig = DEFAULT_CONFIG
  let bestF1 = baselineResult.f1
  let iterations = 0
  let keeps = 0

  // 2. LOOP
  const startTime = Date.now()
  while (Date.now() - startTime < DURATION_MS) {
    const mutation = mutateConfig(bestConfig)
    const result = evaluate(evalSet, mutation.config)
    iterations++

    if (result.f1 > bestF1 || (result.f1 === bestF1 && result.falsePositive < evaluate(evalSet, bestConfig).falsePositive)) {
      bestConfig = mutation.config
      bestF1 = result.f1
      keeps++
      console.log(`[#${iterations}] KEEP ${mutation.description} → F1=${(result.f1 * 100).toFixed(1)}% (p=${(result.precision * 100).toFixed(1)}% r=${(result.recall * 100).toFixed(1)}%)`)
    }
  }

  // 3. 결과
  const finalResult = evaluate(evalSet, bestConfig)
  console.log('')
  console.log('=== 결과 ===')
  console.log(`총 반복: ${iterations.toLocaleString()}회 (${keeps} keeps)`)
  console.log(``)
  console.log(`baseline F1: ${(baselineResult.f1 * 100).toFixed(1)}%`)
  console.log(`최적    F1: ${(finalResult.f1 * 100).toFixed(1)}%`)
  console.log(`개선율:     ${(((finalResult.f1 - baselineResult.f1) / baselineResult.f1) * 100).toFixed(1)}%`)
  console.log('')
  console.log(`precision: ${(finalResult.precision * 100).toFixed(1)}% (오탐률 ${(100 - finalResult.precision * 100).toFixed(1)}%)`)
  console.log(`recall:    ${(finalResult.recall * 100).toFixed(1)}% (놓친 이상치 ${finalResult.falseNegative}개)`)
  console.log('')
  console.log('=== 최적 임계값 (변경된 것만) ===')
  for (const key of Object.keys(MUTATION_RANGES) as ConfigKey[]) {
    if (bestConfig[key] !== DEFAULT_CONFIG[key]) {
      console.log(`  ${key}: ${DEFAULT_CONFIG[key]} → ${bestConfig[key]}`)
    }
  }
  if (JSON.stringify(bestConfig) === JSON.stringify(DEFAULT_CONFIG)) {
    console.log('  (변경 없음 — baseline이 이미 최적)')
  }

  console.log('')
  console.log('=== Confusion Matrix ===')
  console.log(`  TP=${finalResult.truePositive} FP=${finalResult.falsePositive}`)
  console.log(`  FN=${finalResult.falseNegative} TN=${finalResult.trueNegative}`)
}

main()
