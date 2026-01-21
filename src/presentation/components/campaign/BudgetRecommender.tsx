'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  type Industry,
  type BusinessScale,
  type BudgetRecommendation,
  type ExistingCampaignData,
  INDUSTRY_BUDGET_BENCHMARKS,
  BUSINESS_SCALE_MULTIPLIERS,
  MINIMUM_DAILY_BUDGET,
  formatBudget,
  formatROAS,
  getAllIndustries,
  getAllBusinessScales,
} from '@domain/value-objects/BudgetRecommendation'
import { BudgetRecommendationService } from '@application/services/BudgetRecommendationService'
import { Info, TrendingUp, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'

interface BudgetRecommenderProps {
  onBudgetSelect: (budget: number) => void
  onROASSelect?: (roas: number) => void
  selectedBudget?: number
  existingCampaignData?: ExistingCampaignData
  disabled?: boolean
}

export function BudgetRecommender({
  onBudgetSelect,
  onROASSelect,
  selectedBudget,
  existingCampaignData,
  disabled = false,
}: BudgetRecommenderProps) {
  // Form state
  const [industry, setIndustry] = useState<Industry>('ecommerce')
  const [businessScale, setBusinessScale] = useState<BusinessScale>('small')
  const [monthlyBudget, setMonthlyBudget] = useState<string>('')
  const [averageOrderValue, setAverageOrderValue] = useState<string>('')
  const [useMetaAOV, setUseMetaAOV] = useState<boolean>(!!existingCampaignData)

  // Service instance
  const budgetService = useMemo(() => new BudgetRecommendationService(), [])

  // Calculate recommendation
  const recommendation = useMemo<BudgetRecommendation | null>(() => {
    return budgetService.generateRecommendation({
      industry,
      businessScale,
      monthlyMarketingBudget: monthlyBudget ? parseInt(monthlyBudget, 10) : undefined,
      averageOrderValue: useMetaAOV && existingCampaignData
        ? existingCampaignData.avgAOV
        : averageOrderValue
          ? parseInt(averageOrderValue, 10)
          : undefined,
      existingCampaignData: existingCampaignData,
    })
  }, [
    industry,
    businessScale,
    monthlyBudget,
    averageOrderValue,
    useMetaAOV,
    existingCampaignData,
    budgetService,
  ])

  // Handle budget selection
  const handleApplyRecommendation = useCallback(() => {
    if (recommendation) {
      onBudgetSelect(recommendation.dailyBudget.recommended)
      if (onROASSelect) {
        onROASSelect(recommendation.targetROAS)
      }
    }
  }, [recommendation, onBudgetSelect, onROASSelect])

  // Budget option selection
  const handleBudgetOptionSelect = useCallback(
    (budget: number) => {
      onBudgetSelect(budget)
      if (recommendation && onROASSelect) {
        onROASSelect(recommendation.targetROAS)
      }
    },
    [onBudgetSelect, onROASSelect, recommendation]
  )

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          예산 및 ROAS 추천
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 업종 및 규모 선택 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="industry">업종</Label>
            <Select
              value={industry}
              onValueChange={(value) => setIndustry(value as Industry)}
              disabled={disabled}
            >
              <SelectTrigger id="industry">
                <SelectValue placeholder="업종 선택" />
              </SelectTrigger>
              <SelectContent>
                {getAllIndustries().map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {INDUSTRY_BUDGET_BENCHMARKS[ind].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="scale">사업 규모</Label>
            <Select
              value={businessScale}
              onValueChange={(value) => setBusinessScale(value as BusinessScale)}
              disabled={disabled}
            >
              <SelectTrigger id="scale">
                <SelectValue placeholder="규모 선택" />
              </SelectTrigger>
              <SelectContent>
                {getAllBusinessScales().map((scale) => (
                  <SelectItem key={scale} value={scale}>
                    {BUSINESS_SCALE_MULTIPLIERS[scale].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 기존 광고 성과 표시 (있는 경우) */}
        {existingCampaignData && (
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <TrendingUp className="mt-0.5 h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">
                  기존 광고 성과 (최근 30일)
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div>평균 일일 지출: {formatBudget(existingCampaignData.avgDailySpend)}</div>
                  <div>평균 ROAS: {formatROAS(existingCampaignData.avgROAS)}</div>
                  <div>평균 객단가: {formatBudget(existingCampaignData.avgAOV)}</div>
                  <div>총 전환: {existingCampaignData.totalPurchases30Days}건</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 객단가 입력 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="aov">평균 객단가</Label>
            {existingCampaignData && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useMetaAOV"
                  checked={useMetaAOV}
                  onCheckedChange={(checked) => setUseMetaAOV(!!checked)}
                  disabled={disabled}
                />
                <label
                  htmlFor="useMetaAOV"
                  className="text-xs text-muted-foreground cursor-pointer"
                >
                  Meta 데이터 사용
                </label>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="aov"
              type="number"
              placeholder={useMetaAOV && existingCampaignData
                ? existingCampaignData.avgAOV.toString()
                : INDUSTRY_BUDGET_BENCHMARKS[industry].defaultAOV.toString()
              }
              value={useMetaAOV && existingCampaignData ? '' : averageOrderValue}
              onChange={(e) => setAverageOrderValue(e.target.value)}
              disabled={disabled || (useMetaAOV && !!existingCampaignData)}
              className="w-40"
            />
            <span className="text-muted-foreground">원</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                  <Info className="h-3 w-3" />
                  객단가에 따라 목표 ROAS가 자동 계산됩니다
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>저가 (~₩30,000): ROAS 400%</p>
                <p>중저가 (₩30,000~70,000): ROAS 300%</p>
                <p>중가 (₩70,000~150,000): ROAS 250%</p>
                <p>중고가 (₩150,000~300,000): ROAS 200%</p>
                <p>고가 (₩300,000~): ROAS 150%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* 월 마케팅 예산 입력 (선택) */}
        <div className="space-y-2">
          <Label htmlFor="monthlyBudget">월 마케팅 예산 (선택)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="monthlyBudget"
              type="number"
              placeholder="예: 3000000"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              disabled={disabled}
              className="w-40"
            />
            <span className="text-muted-foreground">원</span>
          </div>
          <p className="text-xs text-muted-foreground">
            월 예산을 입력하면 적정 일일 예산을 자동 계산합니다
          </p>
        </div>

        {/* 추천 결과 */}
        {recommendation && (
          <div className="rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 p-4 space-y-4">
            {/* 목표 ROAS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">📌 목표 ROAS</span>
                <Badge variant="secondary">
                  {formatROAS(recommendation.targetROAS)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                객단가 {formatBudget(recommendation.aovUsed)} 기준
              </span>
            </div>

            {/* 예산 추천 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">💰 추천 일일 예산</span>
                <Badge
                  variant={
                    recommendation.source === 'existing_data'
                      ? 'default'
                      : recommendation.source === 'monthly_budget'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {recommendation.source === 'existing_data'
                    ? '성과 기반'
                    : recommendation.source === 'monthly_budget'
                      ? '월예산 기반'
                      : '업종 기반'}
                </Badge>
              </div>

              {/* 예산 옵션 버튼들 */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedBudget === recommendation.dailyBudget.min ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBudgetOptionSelect(recommendation.dailyBudget.min)}
                  disabled={disabled}
                  className="flex-col h-auto py-2"
                >
                  <span className="text-xs text-muted-foreground">최소</span>
                  <span className="font-semibold">{formatBudget(recommendation.dailyBudget.min)}</span>
                </Button>
                <Button
                  variant={selectedBudget === recommendation.dailyBudget.recommended ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBudgetOptionSelect(recommendation.dailyBudget.recommended)}
                  disabled={disabled}
                  className="flex-col h-auto py-2 border-primary"
                >
                  <span className="text-xs text-primary">권장</span>
                  <span className="font-semibold">{formatBudget(recommendation.dailyBudget.recommended)}</span>
                </Button>
                <Button
                  variant={selectedBudget === recommendation.dailyBudget.max ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBudgetOptionSelect(recommendation.dailyBudget.max)}
                  disabled={disabled}
                  className="flex-col h-auto py-2"
                >
                  <span className="text-xs text-muted-foreground">최대</span>
                  <span className="font-semibold">{formatBudget(recommendation.dailyBudget.max)}</span>
                </Button>
              </div>
            </div>

            {/* 추천 근거 */}
            <div className="text-sm text-muted-foreground bg-white/50 rounded p-3">
              <p className="flex items-start gap-2">
                {recommendation.comparison ? (
                  <TrendingUp className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                )}
                {recommendation.reasoning}
              </p>
            </div>

            {/* 비교 분석 (기존 데이터 있는 경우) */}
            {recommendation.comparison && (
              <div className="text-sm bg-white/50 rounded p-3 space-y-1">
                <p className="font-medium text-foreground">
                  {recommendation.comparison.currentVsRecommended}
                </p>
                <p className="text-muted-foreground">
                  {recommendation.comparison.potentialImpact}
                </p>
              </div>
            )}

            {/* 팁 */}
            <div className="space-y-1">
              {recommendation.tips.slice(0, 2).map((tip, index) => (
                <p key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span>💡</span>
                  {tip}
                </p>
              ))}
            </div>

            {/* 테스트 예산 정보 */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
              <span>7일 테스트 예산</span>
              <span className="font-medium">{formatBudget(recommendation.testBudget)}</span>
            </div>
          </div>
        )}

        {/* 권장 예산 적용 버튼 */}
        {recommendation && !selectedBudget && (
          <Button
            onClick={handleApplyRecommendation}
            className="w-full"
            disabled={disabled}
          >
            권장 예산 적용하기
          </Button>
        )}

        {/* 최소 예산 안내 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>최소 일일 예산: {formatBudget(MINIMUM_DAILY_BUDGET)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 간소화된 예산 추천 배지 (기존 폼에서 사용)
 */
export function BudgetRecommendationBadge({
  industry,
  businessScale,
}: {
  industry: Industry
  businessScale: BusinessScale
}) {
  const budgetService = useMemo(() => new BudgetRecommendationService(), [])

  const recommendation = useMemo(() => {
    return budgetService.generateRecommendation({
      industry,
      businessScale,
    })
  }, [industry, businessScale, budgetService])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="cursor-help">
            권장: {formatBudget(recommendation.dailyBudget.recommended)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>목표 ROAS: {formatROAS(recommendation.targetROAS)}</p>
          <p>목표 CPA: {formatBudget(recommendation.targetCPA)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
