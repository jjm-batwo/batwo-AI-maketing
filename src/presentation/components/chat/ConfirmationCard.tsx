'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Shield, AlertTriangle, Check, X, Edit3 } from 'lucide-react'

interface ConfirmationDetail {
  label: string
  value: string
  changed?: boolean
}

interface ConfirmationCardProps {
  actionId: string
  toolName: string
  summary: string
  details: ConfirmationDetail[]
  warnings: string[]
  expiresAt: string
  onConfirm: (actionId: string) => void
  onCancel: (actionId: string) => void
}

export function ConfirmationCard({
  actionId,
  toolName,
  summary,
  details,
  warnings,
  expiresAt,
  onConfirm,
  onCancel,
}: ConfirmationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const isExpired = new Date(expiresAt) < new Date()

  const handleConfirm = async () => {
    setIsProcessing(true)
    await onConfirm(actionId)
  }

  const handleCancel = async () => {
    setIsProcessing(true)
    await onCancel(actionId)
  }

  // 도구 이름을 한글로 매핑
  const toolLabels: Record<string, string> = {
    createCampaign: '캠페인 생성',
    updateCampaignBudget: '예산 변경',
    pauseCampaign: '캠페인 일시정지',
    resumeCampaign: '캠페인 재개',
    deleteCampaign: '캠페인 삭제',
    generateAdCopy: '광고 카피 생성',
  }

  return (
    <div className="mx-4 my-2 rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border-b border-primary/10">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-primary">
          {toolLabels[toolName] || toolName} 확인
        </span>
      </div>

      {/* Summary */}
      <div className="px-4 py-3">
        <p className="text-sm text-foreground">{summary}</p>
      </div>

      {/* Details Table */}
      {details.length > 0 && (
        <div className="px-4 pb-3">
          <div className="rounded-lg border border-border overflow-hidden">
            {details.map((detail, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-center justify-between px-3 py-2 text-xs',
                  index !== details.length - 1 && 'border-b border-border',
                  detail.changed && 'bg-yellow-50 dark:bg-yellow-900/10'
                )}
              >
                <span className="text-muted-foreground">{detail.label}</span>
                <span className={cn('font-medium', detail.changed && 'text-primary')}>
                  {detail.value}
                  {detail.changed && (
                    <Edit3 className="inline h-3 w-3 ml-1 text-primary" />
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="px-4 pb-3 space-y-1">
          {warnings.map((warning, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
              <span className="text-xs text-yellow-700 dark:text-yellow-300">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3 border-t border-primary/10">
        <button
          onClick={handleConfirm}
          disabled={isProcessing || isExpired}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
        >
          <Check className="h-4 w-4" />
          확인
        </button>
        <button
          onClick={handleCancel}
          disabled={isProcessing}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium',
            'border border-border text-muted-foreground hover:bg-muted',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
        >
          <X className="h-4 w-4" />
          취소
        </button>
      </div>

      {/* Expired indicator */}
      {isExpired && (
        <div className="px-4 py-2 bg-destructive/10 text-center">
          <span className="text-xs text-destructive">이 작업은 만료되었습니다</span>
        </div>
      )}
    </div>
  )
}
