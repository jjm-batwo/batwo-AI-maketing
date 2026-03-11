import { describe, it, expect, beforeEach, vi } from 'vitest'
import { IssueBillingKeyUseCase } from '@application/use-cases/payment/IssueBillingKeyUseCase'
import { PaymentError } from '@domain/errors/PaymentError'
import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'
import type { IPaymentGateway } from '@application/ports/IPaymentGateway'

vi.mock('@application/utils/BillingKeyEncryption', () => ({
  encryptBillingKey: vi.fn((key: string) => `encrypted_${key}`),
  decryptBillingKey: vi.fn((key: string) => key.replace('encrypted_', '')),
}))

describe('IssueBillingKeyUseCase', () => {
  let useCase: IssueBillingKeyUseCase
  let billingKeyRepo: IBillingKeyRepository
  let paymentGateway: IPaymentGateway

  beforeEach(() => {
    billingKeyRepo = {
      findByUserId: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockImplementation((entity) =>
        Promise.resolve({
          ...entity,
          id: 'bk-new',
          isActive: true,
          method: '카드',
          cardCompany: '삼성카드',
          cardNumber: '4321-****-****-1234',
          authenticatedAt: new Date(),
        })
      ),
      deactivate: vi.fn().mockResolvedValue(undefined),
      findActiveByUserId: vi.fn().mockResolvedValue(null),
    } as unknown as IBillingKeyRepository

    paymentGateway = {
      issueBillingKey: vi.fn().mockResolvedValue({
        billingKey: 'billing-key-new',
        cardCompany: '삼성카드',
        cardNumber: '4321-****-****-1234',
        method: '카드',
        authenticatedAt: '2026-03-11T10:00:00Z',
      }),
    } as unknown as IPaymentGateway

    useCase = new IssueBillingKeyUseCase(billingKeyRepo, paymentGateway)
  })

  it('빌링키를 성공적으로 발급해야 함', async () => {
    const result = await useCase.execute('auth-key', 'cust-key', 'user-1')

    expect(result.id).toBe('bk-new')
    expect(result.isActive).toBe(true)
    expect(result.method).toBe('카드')
    expect(paymentGateway.issueBillingKey).toHaveBeenCalledWith('auth-key', 'cust-key')
    expect(billingKeyRepo.save).toHaveBeenCalledOnce()
  })

  it('기존 활성 빌링키가 있으면 비활성화해야 함', async () => {
    vi.mocked(billingKeyRepo.findByUserId).mockResolvedValue([
      { id: 'bk-old-1', isActive: true },
      { id: 'bk-old-2', isActive: false },
    ])

    await useCase.execute('auth-key', 'cust-key', 'user-1')

    expect(billingKeyRepo.deactivate).toHaveBeenCalledWith('bk-old-1')
    expect(billingKeyRepo.deactivate).toHaveBeenCalledTimes(1) // 비활성은 건너뜀
  })

  it('PG사 빌링키 발급 실패 시 PaymentError를 던져야 함', async () => {
    vi.mocked(paymentGateway.issueBillingKey).mockRejectedValue(new Error('카드 인증 실패'))

    await expect(
      useCase.execute('bad-auth', 'cust-key', 'user-1')
    ).rejects.toThrow(PaymentError)
  })

  it('빌링키를 암호화하여 저장해야 함', async () => {
    await useCase.execute('auth-key', 'cust-key', 'user-1')

    const savedCall = vi.mocked(billingKeyRepo.save).mock.calls[0][0]
    expect(savedCall.encryptedBillingKey).toBe('encrypted_billing-key-new')
  })
})
