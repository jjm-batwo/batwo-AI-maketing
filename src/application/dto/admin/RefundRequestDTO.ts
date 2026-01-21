export interface RefundRequestDTO {
  invoiceId: string
  amount: number
  reason: string
  processedBy: string
}

export interface RefundResultDTO {
  success: boolean
  invoiceId: string
  refundedAmount: number
  totalRefundedAmount: number
  isFullyRefunded: boolean
  message: string
}
