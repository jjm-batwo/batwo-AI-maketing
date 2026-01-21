import { describe, it, expect, beforeEach } from 'vitest'
import { Invoice, type CreateInvoiceProps } from '@domain/entities/Invoice'
import { InvoiceStatus } from '@domain/value-objects/InvoiceStatus'
import { Money } from '@domain/value-objects/Money'
import { InvalidInvoiceError } from '@domain/errors/InvalidInvoiceError'

describe('Invoice', () => {
  let validProps: CreateInvoiceProps

  beforeEach(() => {
    validProps = {
      subscriptionId: 'sub-123',
      amount: Money.create(49000, 'KRW'),
      paymentMethod: 'card',
    }
  })

  describe('create', () => {
    it('should create invoice with valid props', () => {
      const invoice = Invoice.create(validProps)

      expect(invoice.subscriptionId).toBe(validProps.subscriptionId)
      expect(invoice.amount.amount).toBe(49000)
      expect(invoice.status).toBe(InvoiceStatus.PENDING)
      expect(invoice.id).toBeDefined()
      expect(invoice.createdAt).toBeDefined()
    })

    it('should throw error for zero amount', () => {
      const invalidProps = {
        ...validProps,
        amount: Money.create(0, 'KRW'),
      }

      expect(() => Invoice.create(invalidProps)).toThrow(InvalidInvoiceError)
    })
  })

  describe('restore', () => {
    it('should restore invoice from existing props', () => {
      const now = new Date()
      const existingProps = {
        id: 'inv-123',
        subscriptionId: 'sub-123',
        amount: Money.create(49000, 'KRW'),
        status: InvoiceStatus.PAID,
        paymentMethod: 'card',
        paidAt: now,
        createdAt: now,
        updatedAt: now,
      }

      const invoice = Invoice.restore(existingProps)

      expect(invoice.id).toBe(existingProps.id)
      expect(invoice.status).toBe(InvoiceStatus.PAID)
      expect(invoice.paidAt).toEqual(now)
    })
  })

  describe('markPaid', () => {
    it('should mark pending invoice as paid', () => {
      const invoice = Invoice.create(validProps)
      const paid = invoice.markPaid('receipt-123')

      expect(paid.status).toBe(InvoiceStatus.PAID)
      expect(paid.paidAt).toBeDefined()
      expect(paid.receiptUrl).toBe('receipt-123')
    })

    it('should throw error when marking non-pending invoice as paid', () => {
      const invoice = Invoice.create(validProps)
      const paid = invoice.markPaid('receipt-123')

      expect(() => paid.markPaid('receipt-456')).toThrow(InvalidInvoiceError)
    })
  })

  describe('markFailed', () => {
    it('should mark pending invoice as failed', () => {
      const invoice = Invoice.create(validProps)
      const failed = invoice.markFailed()

      expect(failed.status).toBe(InvoiceStatus.FAILED)
    })

    it('should throw error when marking non-pending invoice as failed', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')

      expect(() => invoice.markFailed()).toThrow(InvalidInvoiceError)
    })
  })

  describe('retry', () => {
    it('should retry a failed invoice', () => {
      const invoice = Invoice.create(validProps).markFailed()
      const retried = invoice.retry()

      expect(retried.status).toBe(InvoiceStatus.PENDING)
    })

    it('should throw error when retrying non-failed invoice', () => {
      const invoice = Invoice.create(validProps)

      expect(() => invoice.retry()).toThrow(InvalidInvoiceError)
    })
  })

  describe('refund', () => {
    it('should fully refund a paid invoice', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')
      const refunded = invoice.refund(invoice.amount, '고객 요청')

      expect(refunded.status).toBe(InvoiceStatus.REFUNDED)
      expect(refunded.refundedAt).toBeDefined()
      expect(refunded.refundAmount?.amount).toBe(49000)
      expect(refunded.refundReason).toBe('고객 요청')
    })

    it('should partially refund a paid invoice', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')
      const partialRefund = Money.create(20000, 'KRW')
      const refunded = invoice.refund(partialRefund, '부분 환불')

      expect(refunded.status).toBe(InvoiceStatus.PARTIALLY_REFUNDED)
      expect(refunded.refundAmount?.amount).toBe(20000)
    })

    it('should fully refund a partially refunded invoice', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')
      const partial = invoice.refund(Money.create(20000, 'KRW'), '부분 환불')
      const remaining = Money.create(29000, 'KRW')
      const fullyRefunded = partial.refund(remaining, '추가 환불')

      expect(fullyRefunded.status).toBe(InvoiceStatus.REFUNDED)
      expect(fullyRefunded.refundAmount?.amount).toBe(49000)
    })

    it('should throw error when refunding unpaid invoice', () => {
      const invoice = Invoice.create(validProps)

      expect(() => invoice.refund(validProps.amount, '환불')).toThrow(InvalidInvoiceError)
    })

    it('should throw error when refund exceeds original amount', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')
      const excessive = Money.create(100000, 'KRW')

      expect(() => invoice.refund(excessive, '환불')).toThrow(InvalidInvoiceError)
    })

    it('should throw error when refund amount is zero', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')
      const zero = Money.create(0, 'KRW')

      expect(() => invoice.refund(zero, '환불')).toThrow(InvalidInvoiceError)
    })

    it('should throw error when refund reason is empty', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')

      expect(() => invoice.refund(invoice.amount, '')).toThrow(InvalidInvoiceError)
    })

    it('should throw error when refunding already fully refunded invoice', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')
      const refunded = invoice.refund(invoice.amount, '환불')

      expect(() => refunded.refund(Money.create(1000, 'KRW'), '추가 환불')).toThrow(
        InvalidInvoiceError
      )
    })

    it('should throw error when partial refund exceeds remaining amount', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')
      const partial = invoice.refund(Money.create(40000, 'KRW'), '부분 환불')
      const excessive = Money.create(20000, 'KRW')

      expect(() => partial.refund(excessive, '추가 환불')).toThrow(InvalidInvoiceError)
    })
  })

  describe('state checks', () => {
    it('should correctly identify pending invoice', () => {
      const invoice = Invoice.create(validProps)

      expect(invoice.isPending()).toBe(true)
      expect(invoice.isPaid()).toBe(false)
      expect(invoice.isFailed()).toBe(false)
      expect(invoice.isRefunded()).toBe(false)
    })

    it('should correctly identify paid invoice', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')

      expect(invoice.isPending()).toBe(false)
      expect(invoice.isPaid()).toBe(true)
    })

    it('should correctly identify failed invoice', () => {
      const invoice = Invoice.create(validProps).markFailed()

      expect(invoice.isFailed()).toBe(true)
    })

    it('should correctly identify refunded invoice', () => {
      const invoice = Invoice.create(validProps)
        .markPaid('receipt-123')
        .refund(validProps.amount, '환불')

      expect(invoice.isRefunded()).toBe(true)
    })

    it('should correctly identify partially refunded invoice', () => {
      const invoice = Invoice.create(validProps)
        .markPaid('receipt-123')
        .refund(Money.create(20000, 'KRW'), '부분 환불')

      expect(invoice.isPartiallyRefunded()).toBe(true)
      expect(invoice.isRefunded()).toBe(false)
    })

    it('should correctly check if invoice can be refunded', () => {
      const pending = Invoice.create(validProps)
      const paid = Invoice.create(validProps).markPaid('receipt-123')
      const refunded = paid.refund(validProps.amount, '환불')
      const partial = Invoice.create(validProps)
        .markPaid('receipt-123')
        .refund(Money.create(20000, 'KRW'), '부분')

      expect(pending.canBeRefunded()).toBe(false)
      expect(paid.canBeRefunded()).toBe(true)
      expect(refunded.canBeRefunded()).toBe(false)
      expect(partial.canBeRefunded()).toBe(true)
    })
  })

  describe('remainingRefundableAmount', () => {
    it('should return full amount for paid invoice', () => {
      const invoice = Invoice.create(validProps).markPaid('receipt-123')

      expect(invoice.remainingRefundableAmount().amount).toBe(49000)
    })

    it('should return remaining amount for partially refunded invoice', () => {
      const invoice = Invoice.create(validProps)
        .markPaid('receipt-123')
        .refund(Money.create(20000, 'KRW'), '부분')

      expect(invoice.remainingRefundableAmount().amount).toBe(29000)
    })

    it('should return zero for fully refunded invoice', () => {
      const invoice = Invoice.create(validProps)
        .markPaid('receipt-123')
        .refund(validProps.amount, '환불')

      expect(invoice.remainingRefundableAmount().amount).toBe(0)
    })

    it('should return zero for unpaid invoice', () => {
      const invoice = Invoice.create(validProps)

      expect(invoice.remainingRefundableAmount().amount).toBe(0)
    })
  })

  describe('toJSON', () => {
    it('should serialize invoice to JSON', () => {
      const invoice = Invoice.create(validProps)
      const json = invoice.toJSON()

      expect(json.id).toBe(invoice.id)
      expect(json.subscriptionId).toBe(invoice.subscriptionId)
      expect(json.amount).toEqual(invoice.amount.toJSON())
      expect(json.status).toBe(invoice.status)
    })

    it('should include refund details when refunded', () => {
      const invoice = Invoice.create(validProps)
        .markPaid('receipt-123')
        .refund(Money.create(20000, 'KRW'), '부분 환불')

      const json = invoice.toJSON()

      expect(json.refundAmount).toBeDefined()
      expect(json.refundReason).toBe('부분 환불')
      expect(json.refundedAt).toBeDefined()
    })
  })
})
