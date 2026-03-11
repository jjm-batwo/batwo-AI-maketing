import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GetPaymentHistoryUseCase } from '@application/use-cases/payment/GetPaymentHistoryUseCase'
import type { IPaymentLogRepository } from '@domain/repositories/IPaymentLogRepository'

describe('GetPaymentHistoryUseCase', () => {
  let useCase: GetPaymentHistoryUseCase
  let paymentLogRepo: IPaymentLogRepository

  const mockLogs = [
    {
      id: 'log-1',
      orderId: 'ORDER_user-1_001',
      paymentKey: 'pay-key-1',
      amount: 29000,
      status: 'DONE',
      method: '카드',
      failReason: undefined,
      receiptUrl: 'https://toss.im/receipt/1',
      createdAt: new Date('2026-03-01'),
    },
    {
      id: 'log-2',
      orderId: 'ORDER_user-1_002',
      paymentKey: undefined,
      amount: 29000,
      status: 'FAILED',
      method: '카드',
      failReason: '잔액 부족',
      receiptUrl: undefined,
      createdAt: new Date('2026-02-01'),
    },
  ]

  beforeEach(() => {
    paymentLogRepo = {
      findByUserId: vi.fn().mockResolvedValue(mockLogs),
      save: vi.fn(),
    } as unknown as IPaymentLogRepository

    useCase = new GetPaymentHistoryUseCase(paymentLogRepo)
  })

  it('결제 내역을 DTO 형식으로 반환해야 함', async () => {
    const result = await useCase.execute('user-1')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'log-1',
      orderId: 'ORDER_user-1_001',
      paymentKey: 'pay-key-1',
      amount: 29000,
      status: 'DONE',
      method: '카드',
      failReason: undefined,
      receiptUrl: 'https://toss.im/receipt/1',
      createdAt: new Date('2026-03-01'),
    })
  })

  it('실패한 결제 내역도 포함해야 함', async () => {
    const result = await useCase.execute('user-1')

    const failed = result.find((r) => r.status === 'FAILED')
    expect(failed).toBeDefined()
    expect(failed!.failReason).toBe('잔액 부족')
    expect(failed!.paymentKey).toBeUndefined()
  })

  it('기본 limit이 50이어야 함', async () => {
    await useCase.execute('user-1')

    expect(paymentLogRepo.findByUserId).toHaveBeenCalledWith('user-1', 50)
  })

  it('커스텀 limit을 전달할 수 있어야 함', async () => {
    await useCase.execute('user-1', 10)

    expect(paymentLogRepo.findByUserId).toHaveBeenCalledWith('user-1', 10)
  })

  it('결제 내역이 없으면 빈 배열을 반환해야 함', async () => {
    vi.mocked(paymentLogRepo.findByUserId).mockResolvedValue([])

    const result = await useCase.execute('user-no-history')

    expect(result).toEqual([])
  })
})
