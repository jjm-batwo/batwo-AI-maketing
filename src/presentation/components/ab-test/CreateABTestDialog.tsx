'use client'

import { useState } from 'react'
import { Plus, Minus, FlaskConical } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateABTest } from '@/presentation/hooks/useABTests'

interface CreateABTestDialogProps {
  campaignId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface VariantInput {
  name: string
  description: string
  trafficPercent: number
  isControl: boolean
}

export function CreateABTestDialog({
  campaignId,
  open,
  onOpenChange,
}: CreateABTestDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [variants, setVariants] = useState<VariantInput[]>([
    { name: '컨트롤', description: '기존 광고 소재', trafficPercent: 50, isControl: true },
    { name: '변형 A', description: '새로운 광고 소재', trafficPercent: 50, isControl: false },
  ])
  const [confidenceLevel, setConfidenceLevel] = useState(95)
  const [minimumSampleSize, setMinimumSampleSize] = useState(1000)

  const createABTest = useCreateABTest()

  const handleAddVariant = () => {
    if (variants.length >= 4) return
    const newPercent = Math.floor(100 / (variants.length + 1))
    const updatedVariants = variants.map((v) => ({
      ...v,
      trafficPercent: newPercent,
    }))
    updatedVariants.push({
      name: `변형 ${String.fromCharCode(65 + variants.length - 1)}`,
      description: '',
      trafficPercent: 100 - newPercent * variants.length,
      isControl: false,
    })
    setVariants(updatedVariants)
  }

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 2) return
    if (variants[index].isControl) return // Can't remove control

    const updatedVariants = variants.filter((_, i) => i !== index)
    const newPercent = Math.floor(100 / updatedVariants.length)
    const normalizedVariants = updatedVariants.map((v, i) => ({
      ...v,
      trafficPercent: i === updatedVariants.length - 1
        ? 100 - newPercent * (updatedVariants.length - 1)
        : newPercent,
    }))
    setVariants(normalizedVariants)
  }

  const handleVariantChange = (index: number, field: keyof VariantInput, value: string | number | boolean) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }

    // Recalculate traffic percentages if needed
    if (field === 'trafficPercent') {
      const total = updated.reduce((sum, v) => sum + v.trafficPercent, 0)
      if (total !== 100) {
        // Adjust other variants proportionally
        const diff = 100 - total
        const otherIndexes = updated.map((_, i) => i).filter((i) => i !== index)
        const adjustment = Math.floor(diff / otherIndexes.length)
        otherIndexes.forEach((i, idx) => {
          updated[i].trafficPercent += idx === otherIndexes.length - 1
            ? diff - adjustment * (otherIndexes.length - 1)
            : adjustment
        })
      }
    }

    setVariants(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createABTest.mutateAsync({
        campaignId,
        name,
        description: description || undefined,
        variants: variants.map((v) => ({
          name: v.name,
          description: v.description || undefined,
          trafficPercent: v.trafficPercent,
          isControl: v.isControl,
        })),
        confidenceLevel,
        minimumSampleSize,
      })
      onOpenChange(false)
      resetForm()
    } catch {
      // Error is handled by the mutation
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setVariants([
      { name: '컨트롤', description: '기존 광고 소재', trafficPercent: 50, isControl: true },
      { name: '변형 A', description: '새로운 광고 소재', trafficPercent: 50, isControl: false },
    ])
    setConfidenceLevel(95)
    setMinimumSampleSize(1000)
  }

  const totalTraffic = variants.reduce((sum, v) => sum + v.trafficPercent, 0)
  const isValid = name && totalTraffic === 100 && variants.length >= 2

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-600" />
            새 A/B 테스트 만들기
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">테스트 이름</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 헤드라인 테스트"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="테스트 목적과 가설을 설명하세요"
                rows={2}
              />
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>변형 그룹</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVariant}
                disabled={variants.length >= 4}
              >
                <Plus className="h-4 w-4 mr-1" />
                변형 추가
              </Button>
            </div>

            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-gray-50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {variant.isControl ? '컨트롤 그룹' : `변형 그룹 ${index}`}
                      </span>
                      {variant.isControl && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 rounded">
                          기준
                        </span>
                      )}
                    </div>
                    {!variant.isControl && variants.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVariant(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs">이름</Label>
                      <Input
                        value={variant.name}
                        onChange={(e) =>
                          handleVariantChange(index, 'name', e.target.value)
                        }
                        placeholder="변형 이름"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">설명</Label>
                      <Input
                        value={variant.description}
                        onChange={(e) =>
                          handleVariantChange(index, 'description', e.target.value)
                        }
                        placeholder="변형 설명"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">트래픽 비율 (%)</Label>
                      <Input
                        type="number"
                        min={1}
                        max={99}
                        value={variant.trafficPercent}
                        onChange={(e) =>
                          handleVariantChange(
                            index,
                            'trafficPercent',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalTraffic !== 100 && (
              <p className="text-sm text-red-600">
                트래픽 비율의 합이 100%가 되어야 합니다 (현재: {totalTraffic}%)
              </p>
            )}
          </div>

          {/* Settings */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="confidence">신뢰 수준 (%)</Label>
              <Input
                id="confidence"
                type="number"
                min={80}
                max={99}
                value={confidenceLevel}
                onChange={(e) => setConfidenceLevel(parseInt(e.target.value) || 95)}
              />
              <p className="text-xs text-muted-foreground">
                권장: 95% (통계적으로 유의미한 결과를 위해)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sample">최소 샘플 수</Label>
              <Input
                id="sample"
                type="number"
                min={100}
                value={minimumSampleSize}
                onChange={(e) => setMinimumSampleSize(parseInt(e.target.value) || 1000)}
              />
              <p className="text-xs text-muted-foreground">
                권장: 1,000 이상 (신뢰할 수 있는 결과를 위해)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createABTest.isPending}
            >
              {createABTest.isPending ? '생성 중...' : '테스트 생성'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
