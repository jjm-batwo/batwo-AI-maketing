import { DomainError } from './DomainError'

/**
 * AdminError
 *
 * Base class for admin operation domain errors.
 */
export abstract class AdminError extends DomainError {}

/**
 * Thrown when user not found.
 */
export class UserNotFoundError extends AdminError {
  readonly code = 'USER_NOT_FOUND'

  constructor(userId: string, context?: string) {
    super(context ? `${context} user not found: ${userId}` : `User not found: ${userId}`)
  }
}

/**
 * Thrown when admin operation is unauthorized.
 */
export class UnauthorizedAdminOperationError extends AdminError {
  readonly code = 'UNAUTHORIZED_ADMIN_OPERATION'

  constructor(message: string) {
    super(`Unauthorized: ${message}`)
  }

  static onlyAdminsCanUpdateRoles(): UnauthorizedAdminOperationError {
    return new UnauthorizedAdminOperationError('Only admins can update user roles')
  }

  static cannotManageRole(role: string): UnauthorizedAdminOperationError {
    return new UnauthorizedAdminOperationError(`Cannot manage users with role ${role}`)
  }

  static cannotAssignRole(role: string): UnauthorizedAdminOperationError {
    return new UnauthorizedAdminOperationError(`Cannot assign role ${role}`)
  }

  static onlyAdminsCanProcessRefunds(): UnauthorizedAdminOperationError {
    return new UnauthorizedAdminOperationError('Only admins can process refunds')
  }
}

/**
 * Thrown when attempting to demote the last super admin.
 */
export class LastSuperAdminError extends AdminError {
  readonly code = 'LAST_SUPER_ADMIN'

  constructor() {
    super('Cannot demote the last SUPER_ADMIN')
  }
}

/**
 * Thrown when invoice not found for refund.
 */
export class InvoiceNotFoundError extends AdminError {
  readonly code = 'INVOICE_NOT_FOUND'

  constructor(invoiceId: string) {
    super(`Invoice not found: ${invoiceId}`)
  }
}

/**
 * Thrown when refund amount is invalid.
 */
export class InvalidRefundAmountError extends AdminError {
  readonly code = 'INVALID_REFUND_AMOUNT'

  constructor(amount: number) {
    super(`Invalid refund amount: ${amount}. Amount must be positive.`)
  }
}
