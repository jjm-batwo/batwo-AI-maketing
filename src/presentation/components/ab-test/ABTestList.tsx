'use client'

import { useState } from 'react'
import { Plus, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useABTests, useUpdateABTestAction, useDeleteABTest } from '@/presentation/hooks/useABTests'
import { ABTestCard } from './ABTestCard'
import { CreateABTestDialog } from './CreateABTestDialog'

interface ABTestListProps {
  campaignId: string
}

export function ABTestList({ campaignId }: ABTestListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { data, isLoading } = useABTests(campaignId)
  const updateAction = useUpdateABTestAction()
  const deleteTest = useDeleteABTest()

  const handleStart = (id: string) => {
    updateAction.mutate({ id, action: 'start' })
  }

  const handlePause = (id: string) => {
    updateAction.mutate({ id, action: 'pause' })
  }

  const handleComplete = (id: string) => {
    updateAction.mutate({ id, action: 'complete' })
  }

  const handleDelete = (id: string) => {
    if (confirm('정말 이 A/B 테스트를 삭제하시겠습니까?')) {
      deleteTest.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    )
  }

  const abTests = data?.abTests ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-purple-600" />
          A/B 테스트
        </h3>
        <Button onClick={() => setShowCreateDialog(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          새 테스트
        </Button>
      </div>

      {abTests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-gray-50">
          <FlaskConical className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 font-medium text-gray-900">A/B 테스트가 없습니다</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            광고 소재나 타겟팅을 테스트하여
            <br />
            최적의 성과를 찾아보세요.
          </p>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="mt-4"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            첫 테스트 만들기
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {abTests.map((test) => (
            <ABTestCard
              key={test.id}
              abTest={test}
              onStart={handleStart}
              onPause={handlePause}
              onComplete={handleComplete}
              onDelete={handleDelete}
              isLoading={updateAction.isPending || deleteTest.isPending}
            />
          ))}
        </div>
      )}

      <CreateABTestDialog
        campaignId={campaignId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
