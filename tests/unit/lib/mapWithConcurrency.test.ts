import { describe, it, expect, vi } from 'vitest'
import { mapWithConcurrency } from '@/lib/utils/mapWithConcurrency'

describe('mapWithConcurrency', () => {
    it('should return empty array for empty input', async () => {
        const fn = vi.fn()
        const result = await mapWithConcurrency([], 2, fn)
        expect(result).toEqual([])
        expect(fn).not.toHaveBeenCalled()
    })

    it('should process single item', async () => {
        const result = await mapWithConcurrency([1], 2, async (x) => x * 2)
        expect(result).toEqual([2])
    })

    it('should process items respecting concurrency limit', async () => {
        let maxConcurrent = 0
        let currentConcurrent = 0

        const result = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (x) => {
            currentConcurrent++
            maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
            await new Promise((r) => setTimeout(r, 10))
            currentConcurrent--
            return x * 10
        })

        expect(result).toEqual([10, 20, 30, 40, 50])
        // With chunk-based processing (Promise.all per chunk of 2),
        // max concurrency should be at most the limit
        expect(maxConcurrent).toBeLessThanOrEqual(2)
    })

    it('should preserve order of results', async () => {
        // Items take different amounts of time but should maintain input order
        const result = await mapWithConcurrency([3, 1, 2], 2, async (x) => {
            await new Promise((r) => setTimeout(r, x * 5))
            return `item-${x}`
        })

        expect(result).toEqual(['item-3', 'item-1', 'item-2'])
    })

    it('should handle limit larger than array', async () => {
        const result = await mapWithConcurrency([1, 2], 10, async (x) => x * 2)
        expect(result).toEqual([2, 4])
    })

    it('should handle limit of 1 (sequential processing)', async () => {
        const executionOrder: number[] = []
        const result = await mapWithConcurrency([1, 2, 3], 1, async (x) => {
            executionOrder.push(x)
            return x * 2
        })

        expect(result).toEqual([2, 4, 6])
        expect(executionOrder).toEqual([1, 2, 3])
    })

    it('should propagate errors from async function', async () => {
        await expect(
            mapWithConcurrency([1, 2, 3], 2, async (x) => {
                if (x === 2) throw new Error('Item 2 failed')
                return x
            })
        ).rejects.toThrow('Item 2 failed')
    })

    it('should handle errors in first chunk', async () => {
        await expect(
            mapWithConcurrency([1, 2, 3, 4], 2, async (x) => {
                if (x === 1) throw new Error('First item failed')
                return x
            })
        ).rejects.toThrow('First item failed')
    })

    it('should process exact multiples of limit correctly', async () => {
        // 6 items with limit of 3 = exactly 2 chunks
        const result = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 3, async (x) => x)
        expect(result).toEqual([1, 2, 3, 4, 5, 6])
    })

    it('should handle non-exact multiples of limit correctly', async () => {
        // 7 items with limit of 3 = 3 chunks (3, 3, 1)
        const result = await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (x) => x)
        expect(result).toEqual([1, 2, 3, 4, 5, 6, 7])
    })
})
