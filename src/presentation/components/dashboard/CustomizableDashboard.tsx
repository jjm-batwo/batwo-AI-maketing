'use client'

import { memo, useCallback, useRef } from 'react'
import {
  GridLayout,
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type LayoutItem,
} from 'react-grid-layout'
import { WidgetRenderer } from './WidgetRenderer'
import { WIDGET_MIN_SIZES, type DashboardWidget } from '@domain/value-objects/DashboardWidget'
import { Button } from '@/components/ui/button'
import { Pencil, Check, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import 'react-grid-layout/css/styles.css'

interface CustomizableDashboardProps {
  widgets: DashboardWidget[]
  isEditing: boolean
  onToggleEdit: () => void
  onLayoutChange: (widgets: DashboardWidget[]) => void
  onRemoveWidget: (widgetId: string) => void
  onAddWidget: () => void
}

export const CustomizableDashboard = memo(function CustomizableDashboard({
  widgets,
  isEditing,
  onToggleEdit,
  onLayoutChange,
  onRemoveWidget,
  onAddWidget,
}: CustomizableDashboardProps) {
  const isLayoutChanging = useRef(false)
  const { containerRef, width } = useContainerWidth()

  const gridLayout: LayoutItem[] = widgets.map((w) => {
    const minSize = WIDGET_MIN_SIZES[w.type] ?? { w: 2, h: 2 }
    return {
      i: w.id,
      x: w.position.x,
      y: w.position.y,
      w: w.position.w,
      h: w.position.h,
      minW: minSize.w,
      minH: minSize.h,
      static: !isEditing,
    }
  })

  const handleLayoutChange = useCallback(
    (newLayout: Layout) => {
      if (!isEditing || isLayoutChanging.current) return
      isLayoutChanging.current = true

      const updatedWidgets = widgets.map((widget) => {
        const item = newLayout.find((l) => l.i === widget.id)
        if (!item) return widget
        return {
          ...widget,
          position: {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          },
        }
      })

      onLayoutChange(updatedWidgets)

      requestAnimationFrame(() => {
        isLayoutChanging.current = false
      })
    },
    [isEditing, widgets, onLayoutChange]
  )

  return (
    <div className="relative" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 mb-4">
        {isEditing && (
          <Button variant="outline" size="sm" onClick={onAddWidget} className="gap-2">
            <Plus className="h-4 w-4" />
            위젯 추가
          </Button>
        )}

        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleEdit}
          className="gap-2"
        >
          {isEditing ? (
            <>
              <Check className="h-4 w-4" />
              편집 완료
            </>
          ) : (
            <>
              <Pencil className="h-4 w-4" />
              대시보드 편집
            </>
          )}
        </Button>
      </div>

      {/* Editing Mode Indicator */}
      {isEditing && (
        <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-2 text-sm text-blue-700 dark:text-blue-300">
          📐 위젯을 드래그하여 위치를 변경하거나, 모서리를 드래그하여 크기를 조절하세요
        </div>
      )}

      {/* Grid Layout */}
      {width > 0 && (
        <GridLayout
          className="layout"
          layout={gridLayout}
          width={width}
          gridConfig={{
            cols: 12,
            rowHeight: 80,
            margin: [16, 16] as const,
            containerPadding: null,
            maxRows: Infinity,
          }}
          dragConfig={{
            enabled: isEditing,
            bounded: false,
            threshold: 3,
          }}
          resizeConfig={{
            enabled: isEditing,
          }}
          compactor={verticalCompactor}
          onLayoutChange={handleLayoutChange}
        >
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className={cn(
                'relative rounded-xl border bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden transition-all',
                isEditing && 'ring-1 ring-blue-200 dark:ring-blue-800 cursor-move',
                !isEditing && 'hover:shadow-md'
              )}
            >
              <WidgetRenderer widget={widget} />

              {/* Remove button (edit mode only) */}
              {isEditing && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveWidget(widget.id)
                  }}
                  className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900 transition-colors"
                  aria-label={`${widget.type} 위젯 삭제`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </GridLayout>
      )}

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg mb-2">위젯이 없습니다</p>
          <p className="text-sm mb-4">대시보드에 위젯을 추가하여 시작하세요</p>
          <Button variant="outline" onClick={onAddWidget} className="gap-2">
            <Plus className="h-4 w-4" />
            위젯 추가
          </Button>
        </div>
      )}
    </div>
  )
})
