/**
 * 동시 실행 수를 제한하면서 배열의 각 항목에 비동기 함수를 적용합니다.
 *
 * @param items - 처리할 항목 배열
 * @param limit - 동시 실행 최대 수
 * @param fn - 각 항목에 적용할 비동기 함수
 * @returns 처리된 결과 배열 (입력 순서 유지)
 *
 * @example
 * ```ts
 * const results = await mapWithConcurrency(urls, 3, async (url) => {
 *   const res = await fetch(url)
 *   return res.json()
 * })
 * ```
 */
export async function mapWithConcurrency<T, U>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<U>
): Promise<U[]> {
  const results: U[] = []
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit)
    const chunkResults = await Promise.all(chunk.map(fn))
    results.push(...chunkResults)
  }
  return results
}
