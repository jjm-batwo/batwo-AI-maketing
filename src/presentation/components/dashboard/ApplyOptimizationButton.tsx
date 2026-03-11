'use client'

import { memo, useState } from 'react'
import { OptimizationConfirmDialog } from './OptimizationConfirmDialog'
import type { ApplyAction } from '@/domain/value-objects/ApplyAction'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  action: ApplyAction
  onApplied?: () => void
}

export const ApplyOptimizationButton = memo(function ApplyOptimizationButton({ action, onApplied }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/ai/optimization/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      })
      if (!res.ok) {
        throw new Error('최적화 요청 실패')
      }
      
      const data = await res.json()
      
      // Execute the pending action
      const confirmRes = await fetch(`/api/agent/actions/${data.pendingActionId}/confirm`, {
        method: 'POST',
      })
      
      if (!confirmRes.ok) {
         throw new Error('최적화 진행 중 오류 발생')
      }

      toast.success('최적화가 성공적으로 적용되었습니다.')
      onApplied?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
      >
        {loading ? '적용 중...' : '적용하기'}
      </Button>
      {showConfirm && (
        <OptimizationConfirmDialog
          action={action}
          onConfirm={handleApply}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
})
