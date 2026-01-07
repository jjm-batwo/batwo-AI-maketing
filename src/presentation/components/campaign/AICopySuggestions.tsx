'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sparkles, Copy, Check, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAICopy, type GenerateCopyInput, type AdCopyVariant } from '@/presentation/hooks/useAICopy'

interface AICopySuggestionsProps {
  productName: string
  productDescription: string
  targetAudience: string
  onSelect?: (variant: AdCopyVariant) => void
  className?: string
}

const TONE_OPTIONS = [
  { value: 'professional', label: '전문적' },
  { value: 'casual', label: '친근한' },
  { value: 'playful', label: '재미있는' },
  { value: 'urgent', label: '긴급한' },
] as const

const OBJECTIVE_OPTIONS = [
  { value: 'awareness', label: '인지도' },
  { value: 'consideration', label: '고려' },
  { value: 'conversion', label: '전환' },
] as const

export function AICopySuggestions({
  productName,
  productDescription,
  targetAudience,
  onSelect,
  className,
}: AICopySuggestionsProps) {
  const [selectedTone, setSelectedTone] = useState<GenerateCopyInput['tone']>('professional')
  const [selectedObjective, setSelectedObjective] = useState<GenerateCopyInput['objective']>('conversion')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const {
    generateCopy,
    variants,
    remainingQuota,
    isLoading,
    isError,
    error,
  } = useAICopy()

  const canGenerate = productName && productDescription && targetAudience

  const handleGenerate = () => {
    if (!canGenerate) return

    generateCopy({
      productName,
      productDescription,
      targetAudience,
      tone: selectedTone,
      objective: selectedObjective,
      variantCount: 3,
    })
  }

  const handleCopy = async (variant: AdCopyVariant, index: number) => {
    const text = `${variant.headline}\n${variant.primaryText}\n${variant.description}`
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleSelect = (variant: AdCopyVariant, index: number) => {
    setSelectedIndex(index)
    onSelect?.(variant)
  }

  return (
    <Card className={cn('border-dashed', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI 카피 제안</CardTitle>
          </div>
          {remainingQuota !== undefined && (
            <Badge variant="outline" className="text-xs">
              남은 횟수: {remainingQuota}/20
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settings */}
        <div className="flex flex-wrap gap-3">
          <Select
            value={selectedTone}
            onValueChange={(v) => setSelectedTone(v as GenerateCopyInput['tone'])}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="톤" />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedObjective}
            onValueChange={(v) => setSelectedObjective(v as GenerateCopyInput['objective'])}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="목표" />
            </SelectTrigger>
            <SelectContent>
              {OBJECTIVE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || isLoading}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : variants.length > 0 ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                다시 생성
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                카피 생성
              </>
            )}
          </Button>
        </div>

        {!canGenerate && (
          <p className="text-sm text-muted-foreground">
            제품명, 설명, 타겟 고객을 입력하면 AI가 광고 카피를 제안해드립니다.
          </p>
        )}

        {isError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error?.message || 'AI 카피 생성에 실패했습니다'}
          </div>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg border p-4 transition-all cursor-pointer hover:border-primary/50',
                  selectedIndex === index && 'border-primary bg-primary/5 ring-1 ring-primary'
                )}
                onClick={() => handleSelect(variant, index)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-2">
                    <div>
                      <Badge variant="secondary" className="mb-1 text-xs">
                        헤드라인
                      </Badge>
                      <p className="font-medium">{variant.headline}</p>
                    </div>
                    <div>
                      <Badge variant="secondary" className="mb-1 text-xs">
                        본문
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {variant.primaryText}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        설명: {variant.description}
                      </span>
                      <Badge variant="outline">{variant.callToAction}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(variant, index)
                    }}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
