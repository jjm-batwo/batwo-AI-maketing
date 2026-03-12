import { memo } from 'react'
import type { ApplyAction } from '@/domain/value-objects/ApplyAction'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ArrowRight, AlertTriangle } from 'lucide-react'

interface Props {
  action: ApplyAction
  onConfirm: () => void
  onCancel: () => void
}

export const OptimizationConfirmDialog = memo(function OptimizationConfirmDialog({
  action,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>최적화 액션 적용</AlertDialogTitle>
          <AlertDialogDescription>
            다음 변경사항이 실제 Meta 광고 관리자에 즉시 반영됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">현재</p>
              <p className="font-semibold">{String(action.currentValue)}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground mx-4" />
            <div className="text-center flex-1">
              <p className="text-sm text-primary mb-1">변경 안내</p>
              <p className="font-semibold text-primary">{String(action.suggestedValue)}</p>
            </div>
          </div>

          <div className="text-sm">
            <span className="font-semibold">예상 효과:</span> {action.expectedImpact}
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="font-semibold">신뢰도:</span> {Math.round(action.confidence * 100)}%
          </div>

          {action.confidence < 0.7 && (
            <div className="flex items-start gap-2 text-warning p-3 bg-warning/10 rounded-md">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm">
                이 추천의 신뢰도가 다소 낮습니다 ({Math.round(action.confidence * 100)}%). 적용 전
                관리자의 판단이 필요합니다.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>실행하기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})
