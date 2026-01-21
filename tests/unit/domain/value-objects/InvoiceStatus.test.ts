import { describe, it, expect } from 'vitest'
import {
  InvoiceStatus,
  INVOICE_STATUS_TRANSITIONS,
  canTransitionInvoice,
  isPendingInvoice,
  isPaidInvoice,
  isFailedInvoice,
  isRefundedInvoice,
  isPartiallyRefunded,
  canBeRefunded,
  getStatusLabel,
  getStatusDescription,
  getStatusColor,
  getAllInvoiceStatuses,
} from '@domain/value-objects/InvoiceStatus'

describe('InvoiceStatus', () => {
  describe('enum values', () => {
    it('should have PENDING status', () => {
      expect(InvoiceStatus.PENDING).toBe('PENDING')
    })

    it('should have PAID status', () => {
      expect(InvoiceStatus.PAID).toBe('PAID')
    })

    it('should have FAILED status', () => {
      expect(InvoiceStatus.FAILED).toBe('FAILED')
    })

    it('should have REFUNDED status', () => {
      expect(InvoiceStatus.REFUNDED).toBe('REFUNDED')
    })

    it('should have PARTIALLY_REFUNDED status', () => {
      expect(InvoiceStatus.PARTIALLY_REFUNDED).toBe('PARTIALLY_REFUNDED')
    })
  })

  describe('status transitions', () => {
    it('should allow PENDING to transition to PAID or FAILED', () => {
      const allowed = INVOICE_STATUS_TRANSITIONS[InvoiceStatus.PENDING]
      expect(allowed).toContain(InvoiceStatus.PAID)
      expect(allowed).toContain(InvoiceStatus.FAILED)
      expect(allowed).not.toContain(InvoiceStatus.REFUNDED)
    })

    it('should allow PAID to transition to REFUNDED or PARTIALLY_REFUNDED', () => {
      const allowed = INVOICE_STATUS_TRANSITIONS[InvoiceStatus.PAID]
      expect(allowed).toContain(InvoiceStatus.REFUNDED)
      expect(allowed).toContain(InvoiceStatus.PARTIALLY_REFUNDED)
    })

    it('should allow FAILED to transition back to PENDING', () => {
      const allowed = INVOICE_STATUS_TRANSITIONS[InvoiceStatus.FAILED]
      expect(allowed).toContain(InvoiceStatus.PENDING)
    })

    it('should not allow REFUNDED to transition to any status', () => {
      const allowed = INVOICE_STATUS_TRANSITIONS[InvoiceStatus.REFUNDED]
      expect(allowed.length).toBe(0)
    })

    it('should allow PARTIALLY_REFUNDED to transition to REFUNDED', () => {
      const allowed = INVOICE_STATUS_TRANSITIONS[InvoiceStatus.PARTIALLY_REFUNDED]
      expect(allowed).toContain(InvoiceStatus.REFUNDED)
    })
  })

  describe('canTransitionInvoice', () => {
    it('should return true for valid transitions', () => {
      expect(canTransitionInvoice(InvoiceStatus.PENDING, InvoiceStatus.PAID)).toBe(true)
      expect(canTransitionInvoice(InvoiceStatus.PAID, InvoiceStatus.REFUNDED)).toBe(true)
      expect(canTransitionInvoice(InvoiceStatus.PARTIALLY_REFUNDED, InvoiceStatus.REFUNDED)).toBe(
        true
      )
    })

    it('should return false for invalid transitions', () => {
      expect(canTransitionInvoice(InvoiceStatus.REFUNDED, InvoiceStatus.PAID)).toBe(false)
      expect(canTransitionInvoice(InvoiceStatus.PENDING, InvoiceStatus.REFUNDED)).toBe(false)
    })
  })

  describe('helper functions', () => {
    describe('isPendingInvoice', () => {
      it('should return true for PENDING', () => {
        expect(isPendingInvoice(InvoiceStatus.PENDING)).toBe(true)
      })

      it('should return false for other statuses', () => {
        expect(isPendingInvoice(InvoiceStatus.PAID)).toBe(false)
        expect(isPendingInvoice(InvoiceStatus.FAILED)).toBe(false)
      })
    })

    describe('isPaidInvoice', () => {
      it('should return true for PAID', () => {
        expect(isPaidInvoice(InvoiceStatus.PAID)).toBe(true)
      })

      it('should return false for other statuses', () => {
        expect(isPaidInvoice(InvoiceStatus.PENDING)).toBe(false)
        expect(isPaidInvoice(InvoiceStatus.REFUNDED)).toBe(false)
      })
    })

    describe('isFailedInvoice', () => {
      it('should return true for FAILED', () => {
        expect(isFailedInvoice(InvoiceStatus.FAILED)).toBe(true)
      })

      it('should return false for other statuses', () => {
        expect(isFailedInvoice(InvoiceStatus.PAID)).toBe(false)
      })
    })

    describe('isRefundedInvoice', () => {
      it('should return true for REFUNDED', () => {
        expect(isRefundedInvoice(InvoiceStatus.REFUNDED)).toBe(true)
      })

      it('should return false for other statuses', () => {
        expect(isRefundedInvoice(InvoiceStatus.PAID)).toBe(false)
        expect(isRefundedInvoice(InvoiceStatus.PARTIALLY_REFUNDED)).toBe(false)
      })
    })

    describe('isPartiallyRefunded', () => {
      it('should return true for PARTIALLY_REFUNDED', () => {
        expect(isPartiallyRefunded(InvoiceStatus.PARTIALLY_REFUNDED)).toBe(true)
      })

      it('should return false for other statuses', () => {
        expect(isPartiallyRefunded(InvoiceStatus.REFUNDED)).toBe(false)
      })
    })

    describe('canBeRefunded', () => {
      it('should return true for PAID', () => {
        expect(canBeRefunded(InvoiceStatus.PAID)).toBe(true)
      })

      it('should return true for PARTIALLY_REFUNDED', () => {
        expect(canBeRefunded(InvoiceStatus.PARTIALLY_REFUNDED)).toBe(true)
      })

      it('should return false for other statuses', () => {
        expect(canBeRefunded(InvoiceStatus.PENDING)).toBe(false)
        expect(canBeRefunded(InvoiceStatus.FAILED)).toBe(false)
        expect(canBeRefunded(InvoiceStatus.REFUNDED)).toBe(false)
      })
    })
  })

  describe('labels and descriptions', () => {
    describe('getStatusLabel', () => {
      it('should return correct labels', () => {
        expect(getStatusLabel(InvoiceStatus.PENDING)).toBe('결제 대기')
        expect(getStatusLabel(InvoiceStatus.PAID)).toBe('결제 완료')
        expect(getStatusLabel(InvoiceStatus.FAILED)).toBe('결제 실패')
        expect(getStatusLabel(InvoiceStatus.REFUNDED)).toBe('환불 완료')
        expect(getStatusLabel(InvoiceStatus.PARTIALLY_REFUNDED)).toBe('부분 환불')
      })
    })

    describe('getStatusDescription', () => {
      it('should return correct descriptions', () => {
        expect(getStatusDescription(InvoiceStatus.PENDING)).toBe('결제 처리 대기 중')
        expect(getStatusDescription(InvoiceStatus.PAID)).toBe('결제가 정상 완료됨')
        expect(getStatusDescription(InvoiceStatus.FAILED)).toBe('결제 처리 실패')
        expect(getStatusDescription(InvoiceStatus.REFUNDED)).toBe('전액 환불 완료')
        expect(getStatusDescription(InvoiceStatus.PARTIALLY_REFUNDED)).toBe('일부 금액 환불됨')
      })
    })

    describe('getStatusColor', () => {
      it('should return correct colors', () => {
        expect(getStatusColor(InvoiceStatus.PENDING)).toBe('yellow')
        expect(getStatusColor(InvoiceStatus.PAID)).toBe('green')
        expect(getStatusColor(InvoiceStatus.FAILED)).toBe('red')
        expect(getStatusColor(InvoiceStatus.REFUNDED)).toBe('gray')
        expect(getStatusColor(InvoiceStatus.PARTIALLY_REFUNDED)).toBe('orange')
      })
    })
  })

  describe('getAllInvoiceStatuses', () => {
    it('should return all statuses', () => {
      const statuses = getAllInvoiceStatuses()
      expect(statuses.length).toBe(6)
      expect(statuses).toContain(InvoiceStatus.PENDING)
      expect(statuses).toContain(InvoiceStatus.PAID)
      expect(statuses).toContain(InvoiceStatus.FAILED)
      expect(statuses).toContain(InvoiceStatus.REFUND_REQUESTED)
      expect(statuses).toContain(InvoiceStatus.REFUNDED)
      expect(statuses).toContain(InvoiceStatus.PARTIALLY_REFUNDED)
    })
  })
})
