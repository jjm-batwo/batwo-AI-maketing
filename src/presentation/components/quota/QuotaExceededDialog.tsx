'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, Sparkles } from 'lucide-react'

type QuotaType = 'CAMPAIGN_CREATE' | 'AI_COPY_GEN' | 'AI_ANALYSIS'

interface QuotaExceededDialogProps {
  open: boolean
  onClose: () => void
  onUpgrade: () => void
  type: QuotaType
}

const quotaMessages: Record<QuotaType, string> = {
  CAMPAIGN_CREATE: '이번 주 캠페인 생성 횟수(5회)를 모두 사용했어요',
  AI_COPY_GEN: '오늘 AI 카피 생성 횟수(20회)를 모두 사용했어요',
  AI_ANALYSIS: '이번 주 AI 분석 횟수(5회)를 모두 사용했어요',
}

const quotaResetMessages: Record<QuotaType, string> = {
  CAMPAIGN_CREATE: '다음 주 월요일에 초기화됩니다',
  AI_COPY_GEN: '내일 자정에 초기화됩니다',
  AI_ANALYSIS: '다음 주 월요일에 초기화됩니다',
}

export function QuotaExceededDialog({
  open,
  onClose,
  onUpgrade,
  type,
}: QuotaExceededDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <DialogTitle className="text-center">사용량 한도 도달</DialogTitle>
          <DialogDescription className="text-center">
            {quotaMessages[type]}
            <br />
            <span className="text-muted-foreground">
              {quotaResetMessages[type]}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-gray-900">더 많은 기능을 원하시면</p>
              <p className="text-sm text-muted-foreground">
                유료 플랜으로 업그레이드하면 무제한으로 사용할 수 있어요
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onUpgrade} className="w-full">
            유료 플랜 알아보기
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
