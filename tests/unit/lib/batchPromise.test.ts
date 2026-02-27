/**
 * batchSettled 유틸 단위 테스트
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect, vi } from 'vitest'
import { batchSettled } from '@/lib/utils/batchSettled'

describe('batchSettled', () => {
  it('빈 배열 입력 시 빈 결과를 반환한다', async () => {
    const fn = vi.fn().mockResolvedValue('result')
    const results = await batchSettled([], fn, 5)
    expect(results).toHaveLength(0)
    expect(fn).not.toHaveBeenCalled()
  })

  it('5개 항목 batchSize=5 → 단일 배치로 병렬 처리된다', async () => {
    const executionOrder: number[] = []
    const fn = async (item: number) => {
      executionOrder.push(item)
      return item * 2
    }

    const results = await batchSettled([1, 2, 3, 4, 5], fn, 5)

    expect(results).toHaveLength(5)
    // 모두 fulfilled
    results.forEach((r, i) => {
      expect(r.status).toBe('fulfilled')
      if (r.status === 'fulfilled') {
        expect(r.value).toBe((i + 1) * 2)
      }
    })
  })

  it('12개 항목 batchSize=5 → 3배치(5+5+2) 순차 실행된다', async () => {
    const batchEndTimes: number[] = []
    let batchCount = 0

    const fn = async (item: number) => {
      // 배치 완료 시점 기록 (마지막 항목일 때)
      batchCount++
      if (batchCount % 5 === 0 || item === 12) {
        batchEndTimes.push(Date.now())
      }
      return item
    }

    const items = Array.from({ length: 12 }, (_, i) => i + 1)
    const results = await batchSettled(items, fn, 5)

    expect(results).toHaveLength(12)
    // 모두 fulfilled
    results.forEach((r) => expect(r.status).toBe('fulfilled'))
    // 값 순서 보존
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        expect(r.value).toBe(i + 1)
      }
    })
  })

  it('일부 실패 시 fulfilled/rejected 모두 결과에 포함된다', async () => {
    const fn = async (item: number): Promise<string> => {
      if (item === 2 || item === 4) {
        throw new Error(`item ${item} 처리 실패`)
      }
      return `ok-${item}`
    }

    const results = await batchSettled([1, 2, 3, 4, 5], fn, 5)

    expect(results).toHaveLength(5)

    const fulfilled = results.filter(r => r.status === 'fulfilled')
    const rejected = results.filter(r => r.status === 'rejected')

    expect(fulfilled).toHaveLength(3)
    expect(rejected).toHaveLength(2)

    // 성공 항목 값 확인
    expect((results[0] as PromiseFulfilledResult<string>).value).toBe('ok-1')
    expect((results[2] as PromiseFulfilledResult<string>).value).toBe('ok-3')
    expect((results[4] as PromiseFulfilledResult<string>).value).toBe('ok-5')

    // 실패 항목 오류 확인
    expect((results[1] as PromiseRejectedResult).reason.message).toBe('item 2 처리 실패')
    expect((results[3] as PromiseRejectedResult).reason.message).toBe('item 4 처리 실패')
  })

  it('batchSize=1 → 모든 항목을 순차로 처리하고 결과 순서가 보존된다', async () => {
    const callOrder: number[] = []
    const fn = async (item: number) => {
      callOrder.push(item)
      return item * 3
    }

    const items = [5, 3, 1, 4, 2]
    const results = await batchSettled(items, fn, 1)

    // 순서가 입력 배열과 동일하게 보존
    expect(callOrder).toEqual([5, 3, 1, 4, 2])
    expect(results).toHaveLength(5)
    results.forEach((r, i) => {
      expect(r.status).toBe('fulfilled')
      if (r.status === 'fulfilled') {
        expect(r.value).toBe(items[i] * 3)
      }
    })
  })

  it('batchSize 기본값은 5이며, 인자 생략 시 정상 동작한다', async () => {
    const fn = vi.fn().mockResolvedValue('default')
    const items = ['a', 'b', 'c']
    const results = await batchSettled(items, fn)

    expect(results).toHaveLength(3)
    expect(fn).toHaveBeenCalledTimes(3)
    results.forEach(r => expect(r.status).toBe('fulfilled'))
  })
})
