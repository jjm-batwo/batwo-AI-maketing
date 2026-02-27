/**
 * 배치 병렬 실행 유틸
 *
 * items를 batchSize 단위로 나누어 fn을 병렬 실행한다.
 * 각 배치 내 항목은 Promise.allSettled로 병렬 처리되며,
 * 배치 간에는 순차 실행한다 (Rate Limit 존중).
 *
 * @param items - 처리할 항목 배열
 * @param fn - 각 항목에 적용할 비동기 함수
 * @param batchSize - 배치당 최대 병렬 실행 수 (기본값 5)
 * @returns 모든 항목의 settled 결과 배열 (입력 순서 보존)
 */
export async function batchSettled<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize: number = 5
): Promise<PromiseSettledResult<R>[]> {
  if (items.length === 0) return []

  const results: PromiseSettledResult<R>[] = []

  // batchSize 단위로 분할하여 순차 처리
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    // 배치 내 항목은 병렬 처리
    const batchResults = await Promise.allSettled(batch.map(fn))
    results.push(...batchResults)
  }

  return results
}
