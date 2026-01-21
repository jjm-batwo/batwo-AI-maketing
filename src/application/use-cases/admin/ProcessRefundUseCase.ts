import { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository'
import { IUserRepository } from '@domain/repositories/IUserRepository'
import { Money } from '@domain/value-objects/Money'
import { GlobalRole, isAdmin } from '@domain/value-objects/GlobalRole'
import { RefundRequestDTO, RefundResultDTO } from '@application/dto/admin/RefundRequestDTO'

export interface ProcessRefundInput extends RefundRequestDTO {
  adminUserId: string
}

export class ProcessRefundUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: ProcessRefundInput): Promise<RefundResultDTO> {
    // Verify admin permissions
    const adminUser = await this.userRepository.findById(input.adminUserId)
    if (!adminUser) {
      throw new Error('Admin user not found')
    }

    const adminRole = adminUser.globalRole as GlobalRole
    if (!isAdmin(adminRole)) {
      throw new Error('Unauthorized: Only admins can process refunds')
    }

    // Get the invoice
    const invoice = await this.invoiceRepository.findById(input.invoiceId)
    if (!invoice) {
      throw new Error('Invoice not found')
    }

    // Validate refund amount
    if (input.amount <= 0) {
      throw new Error('Refund amount must be positive')
    }

    const refundMoney = Money.create(input.amount, invoice.amount.currency)

    // Process the refund using domain logic
    const refundedInvoice = invoice.refund(refundMoney, input.reason)

    // Save the updated invoice
    await this.invoiceRepository.update(refundedInvoice)

    return {
      success: true,
      invoiceId: refundedInvoice.id,
      refundedAmount: input.amount,
      totalRefundedAmount: refundedInvoice.refundAmount?.amount ?? input.amount,
      isFullyRefunded: refundedInvoice.isRefunded(),
      message: refundedInvoice.isRefunded()
        ? 'Full refund processed successfully'
        : 'Partial refund processed successfully',
    }
  }
}
