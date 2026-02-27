'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Check, X } from 'lucide-react'

interface RefundRequest {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  status: string
  refundAmount?: number
  refundReason?: string
  createdAt: string
  paidAt?: string
}

function formatCurrency(amount: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency }).format(amount)
}

export function RefundActions({ request }: { request: RefundRequest }) {
  const router = useRouter()
  const [approveDialog, setApproveDialog] = useState(false)
  const [rejectDialog, setRejectDialog] = useState(false)
  const [refundAmount, setRefundAmount] = useState(request.amount.toString())
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleApprove = async () => {
    setProcessing(true)
    try {
      const amount = parseInt(refundAmount, 10)
      if (isNaN(amount) || amount <= 0 || amount > request.amount) {
        alert('유효한 환불 금액을 입력해주세요.')
        setProcessing(false)
        return
      }

      const res = await fetch(`/api/admin/refunds/${request.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundAmount: amount }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to approve refund')
      }

      setApproveDialog(false)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : '환불 승인에 실패했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/refunds/${request.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to reject refund')
      }

      setRejectDialog(false)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : '환불 거절에 실패했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="default" onClick={() => setApproveDialog(true)}>
          <Check className="mr-1 h-4 w-4" />
          승인
        </Button>
        <Button size="sm" variant="outline" onClick={() => setRejectDialog(true)}>
          <X className="mr-1 h-4 w-4" />
          거절
        </Button>
      </div>

      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환불 승인</DialogTitle>
            <DialogDescription>환불 금액을 확인하고 승인해주세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">결제 금액</div>
                <div className="font-medium">{formatCurrency(request.amount, request.currency)}</div>
                <div className="text-muted-foreground">환불 사유</div>
                <div>{request.refundReason || '-'}</div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">환불 금액</label>
              <Input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} max={request.amount} />
              <p className="text-xs text-muted-foreground">최대 {formatCurrency(request.amount, request.currency)}까지 환불 가능</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)} disabled={processing}>취소</Button>
            <Button onClick={handleApprove} disabled={processing}>{processing ? '처리 중...' : '환불 승인'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>환불 거절</AlertDialogTitle>
            <AlertDialogDescription>환불 요청을 거절하시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">결제 금액</div>
                <div className="font-medium">{formatCurrency(request.amount, request.currency)}</div>
                <div className="text-muted-foreground">환불 사유</div>
                <div>{request.refundReason || '-'}</div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">거절 사유 (선택)</label>
              <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="거절 사유를 입력해주세요..." rows={3} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={processing}>{processing ? '처리 중...' : '환불 거절'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
