'use client'

import { memo, useState, useCallback } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Layout, ChevronDown, Star, Plus, Trash2, PenLine, Copy, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LAYOUT_PRESETS,
  type DashboardWidget,
  type LayoutPreset,
} from '@domain/value-objects/DashboardWidget'

interface LayoutDTO {
  id: string
  name: string
  widgets: DashboardWidget[]
  isDefault: boolean
}

interface LayoutSelectorProps {
  layouts: LayoutDTO[]
  activeLayoutId: string | null
  onSelectLayout: (layoutId: string) => void
  onCreateLayout: (name: string, widgets?: DashboardWidget[]) => void
  onDeleteLayout: (layoutId: string) => void
  onRenameLayout: (layoutId: string, name: string) => void
  onSetDefault: (layoutId: string) => void
  onApplyPreset: (preset: LayoutPreset) => void
  isLoading?: boolean
}

export const LayoutSelector = memo(function LayoutSelector({
  layouts,
  activeLayoutId,
  onSelectLayout,
  onCreateLayout,
  onDeleteLayout,
  onRenameLayout,
  onSetDefault,
  onApplyPreset,
  isLoading,
}: LayoutSelectorProps) {
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [dialogLayoutId, setDialogLayoutId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  const activeLayout = layouts.find((l) => l.id === activeLayoutId)

  const handleCreate = useCallback(() => {
    if (newName.trim()) {
      onCreateLayout(newName.trim())
      setNewName('')
      setShowNewDialog(false)
    }
  }, [newName, onCreateLayout])

  const handleRename = useCallback(() => {
    if (dialogLayoutId && newName.trim()) {
      onRenameLayout(dialogLayoutId, newName.trim())
      setNewName('')
      setShowRenameDialog(false)
      setDialogLayoutId(null)
    }
  }, [dialogLayoutId, newName, onRenameLayout])

  const handleDelete = useCallback(() => {
    if (dialogLayoutId) {
      onDeleteLayout(dialogLayoutId)
      setShowDeleteDialog(false)
      setDialogLayoutId(null)
    }
  }, [dialogLayoutId, onDeleteLayout])

  const openRenameDialog = (layout: LayoutDTO) => {
    setDialogLayoutId(layout.id)
    setNewName(layout.name)
    setShowRenameDialog(true)
  }

  const openDeleteDialog = (layoutId: string) => {
    setDialogLayoutId(layoutId)
    setShowDeleteDialog(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Current Layout Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" disabled={isLoading}>
              <Layout className="h-4 w-4" />
              <span className="max-w-[200px] truncate">
                {activeLayout?.name ?? '레이아웃 선택'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>내 레이아웃</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {layouts.map((layout) => (
              <DropdownMenuItem
                key={layout.id}
                onClick={() => onSelectLayout(layout.id)}
                className={cn(
                  'flex items-center gap-2 cursor-pointer',
                  layout.id === activeLayoutId && 'bg-accent'
                )}
              >
                <Layout className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{layout.name}</span>
                {layout.isDefault && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                <div className="flex items-center gap-1 ml-auto shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {layout.widgets.length}
                  </Badge>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Layout management actions */}
            <DropdownMenuItem
              onClick={() => setShowNewDialog(true)}
              className="gap-2 cursor-pointer"
            >
              <Plus className="h-4 w-4" />새 레이아웃
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setShowPresetDialog(true)}
              className="gap-2 cursor-pointer"
            >
              <LayoutGrid className="h-4 w-4" />
              프리셋 적용
            </DropdownMenuItem>

            {activeLayout && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openRenameDialog(activeLayout)}
                  className="gap-2 cursor-pointer"
                >
                  <PenLine className="h-4 w-4" />
                  이름 변경
                </DropdownMenuItem>

                {!activeLayout.isDefault && (
                  <DropdownMenuItem
                    onClick={() => onSetDefault(activeLayout.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <Star className="h-4 w-4" />
                    기본으로 설정
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() =>
                    onCreateLayout(`${activeLayout.name} (복사)`, activeLayout.widgets)
                  }
                  className="gap-2 cursor-pointer"
                >
                  <Copy className="h-4 w-4" />
                  복제
                </DropdownMenuItem>

                {!activeLayout.isDefault && (
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(activeLayout.id)}
                    className="gap-2 cursor-pointer text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New Layout Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 레이아웃 만들기</DialogTitle>
            <DialogDescription>빈 레이아웃을 만든 후 위젯을 추가하세요</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="레이아웃 이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>레이아웃 이름 변경</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="새 이름"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              취소
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>레이아웃 삭제</DialogTitle>
            <DialogDescription>
              이 레이아웃을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preset Dialog */}
      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>레이아웃 프리셋</DialogTitle>
            <DialogDescription>미리 구성된 레이아웃을 적용하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {LAYOUT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onApplyPreset(preset)
                  setShowPresetDialog(false)
                }}
                className="w-full flex items-start gap-3 rounded-xl border border-border p-4 text-left hover:border-primary/40 hover:bg-accent/50 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{preset.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {preset.widgets.length}개 위젯
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPresetDialog(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})
