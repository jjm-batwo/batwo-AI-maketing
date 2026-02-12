'use client'

import { useState } from 'react'
import { ScienceScore, DomainBreakdown, RecommendationCard, CitationCard } from '@/presentation/components/ai'
import { useScienceScore, useScienceCopy } from '@/presentation/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkles, RefreshCw, Loader2, Copy, Check } from 'lucide-react'

const INDUSTRY_OPTIONS = [
  { value: 'ecommerce', label: '이커머스' },
  { value: 'fashion', label: '패션' },
  { value: 'beauty', label: '뷰티' },
  { value: 'food', label: '식품' },
  { value: 'tech', label: '기술' },
  { value: 'education', label: '교육' },
  { value: 'travel', label: '여행' },
  { value: 'healthcare', label: '건강/의료' },
]

const OBJECTIVE_OPTIONS = [
  { value: 'awareness', label: '인지도' },
  { value: 'consideration', label: '고려' },
  { value: 'conversion', label: '전환' },
]

export default function ScienceAnalysisPage() {
  const [formData, setFormData] = useState({
    headline: '',
    primaryText: '',
    description: '',
    callToAction: '',
    industry: 'ecommerce',
    targetAudience: '',
    objective: 'conversion' as 'awareness' | 'consideration' | 'conversion',
  })

  const [scoreInput, setScoreInput] = useState<{
    content?: {
      headline?: string
      primaryText?: string
      description?: string
      callToAction?: string
    }
    context?: {
      industry?: string
      targetAudience?: string
      objective?: 'awareness' | 'consideration' | 'conversion'
    }
  } | undefined>(undefined)
  const { data: scoreData, isLoading, error } = useScienceScore(scoreInput)

  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const scienceCopyMutation = useScienceCopy()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault()

    const analysisInput = {
      content: {
        headline: formData.headline,
        primaryText: formData.primaryText,
        description: formData.description,
        callToAction: formData.callToAction,
      },
      context: {
        industry: formData.industry,
        targetAudience: formData.targetAudience,
        objective: formData.objective,
      },
    }

    setScoreInput(analysisInput)
    setHasAnalyzed(true)
  }

  const handleGenerateCopy = () => {
    if (!formData.headline || !formData.primaryText || !formData.targetAudience) return

    scienceCopyMutation.mutate({
      productName: formData.headline,
      productDescription: formData.primaryText,
      targetAudience: formData.targetAudience,
      tone: 'professional' as const,
      objective: formData.objective,
      variantCount: 3,
    })
  }

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const isFormValid = formData.headline && formData.primaryText && formData.targetAudience

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            과학 기반 마케팅 분석
          </h1>
          <p className="text-muted-foreground mt-1">
            6개 과학 도메인을 기반으로 광고 카피의 설득력을 분석합니다
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card className="backdrop-blur-sm bg-white/90 border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              광고 카피 입력
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="headline" className="text-sm font-medium">
                  헤드라인 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="headline"
                  placeholder="예: 지금 구매하면 50% 할인"
                  value={formData.headline}
                  onChange={(e) => handleInputChange('headline', e.target.value)}
                  className="bg-white/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="primaryText" className="text-sm font-medium">
                  본문 <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="primaryText"
                  placeholder="예: 단 3일간만 진행되는 특별 할인! 프리미엄 제품을 절반 가격에 만나보세요."
                  value={formData.primaryText}
                  onChange={(e) => handleInputChange('primaryText', e.target.value)}
                  rows={4}
                  className="bg-white/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  설명
                </label>
                <Textarea
                  id="description"
                  placeholder="추가 설명이나 혜택을 입력하세요"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="bg-white/50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="callToAction" className="text-sm font-medium">
                  행동 유도 (CTA)
                </label>
                <Input
                  id="callToAction"
                  placeholder="예: 지금 바로 구매하기"
                  value={formData.callToAction}
                  onChange={(e) => handleInputChange('callToAction', e.target.value)}
                  className="bg-white/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="industry" className="text-sm font-medium">
                    업계
                  </label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger id="industry" className="bg-white/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="objective" className="text-sm font-medium">
                    목표
                  </label>
                  <Select
                    value={formData.objective}
                    onValueChange={(value) => handleInputChange('objective', value)}
                  >
                    <SelectTrigger id="objective" className="bg-white/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OBJECTIVE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="targetAudience" className="text-sm font-medium">
                  타겟 고객 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="targetAudience"
                  placeholder="예: 20-30대 여성, 직장인"
                  value={formData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="bg-white/50"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    분석하기
                  </>
                )}
              </Button>

              {hasAnalyzed && scoreData && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={handleGenerateCopy}
                  disabled={scienceCopyMutation.isPending || !isFormValid}
                >
                  {scienceCopyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      카피 생성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      과학 기반 카피 생성
                    </>
                  )}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {!hasAnalyzed && !scoreData && (
            <Card className="backdrop-blur-sm bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-indigo-100 p-6 mb-4">
                  <Sparkles className="h-12 w-12 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  과학적 근거를 기반으로 분석합니다
                </h3>
                <p className="text-muted-foreground max-w-md">
                  행동경제학, 신경과학, 사회심리학, 인지심리학, 소비자행동론, 설득심리학 6개 도메인에서 광고 카피를 평가합니다
                </p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-6">
                <div className="flex flex-col items-center text-center">
                  <p className="text-red-600 mb-4">분석 중 오류가 발생했습니다</p>
                  <Button
                    variant="outline"
                    onClick={() => setScoreInput(undefined)}
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    다시 시도
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(hasAnalyzed || scoreData) && (
            <>
              {/* Score Display */}
              <Card>
                <CardHeader>
                  <CardTitle>종합 점수</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <ScienceScore
                    score={scoreData?.score.overall ?? 0}
                    grade={scoreData?.score.grade ?? 'F'}
                    analyzedDomains={scoreData?.score.analyzedDomains}
                    totalDomains={6}
                    isLoading={isLoading}
                    size="lg"
                  />
                </CardContent>
              </Card>

              {/* Domain Breakdown */}
              <DomainBreakdown
                domainScores={scoreData?.score.domainScores ?? []}
                analyzedDomains={scoreData?.score.analyzedDomains ?? 0}
                totalDomains={scoreData?.score.totalDomains ?? 6}
                isLoading={isLoading}
              />

              {/* Summary */}
              {scoreData?.score.summary && (
                <Card className="backdrop-blur-sm bg-white/90 border-white/20">
                  <CardContent className="py-6">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {scoreData.score.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Top Recommendations */}
              {scoreData?.score.topRecommendations && scoreData.score.topRecommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>주요 개선 제안</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {scoreData.score.topRecommendations.slice(0, 3).map((rec: { domain: string; priority: 'critical' | 'high' | 'medium' | 'low'; recommendation: string; impact: string; evidence: string[] }, index: number) => (
                      <RecommendationCard
                        key={index}
                        recommendation={rec.recommendation}
                        priority={rec.priority === 'critical' ? 'high' : rec.priority as 'high' | 'medium' | 'low'}
                        domain={rec.domain}
                        citationCount={rec.evidence?.length || 0}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Generated Ad Copy Variants */}
              {scienceCopyMutation.data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      과학 기반 광고 카피
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {scienceCopyMutation.data.variants.map((variant: { headline: string; primaryText: string; description: string; callToAction: string; reasoning: string }, index: number) => (
                      <Card key={index} className="border-purple-100 bg-purple-50/30">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-purple-600 border-purple-300">
                              변형 {index + 1}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyText(
                                `${variant.headline}\n${variant.primaryText}\n${variant.description}\n${variant.callToAction}`,
                                index
                              )}
                              className="h-8 text-xs"
                            >
                              {copiedIndex === index ? (
                                <><Check className="mr-1 h-3 w-3" /> 복사됨</>
                              ) : (
                                <><Copy className="mr-1 h-3 w-3" /> 복사</>
                              )}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">헤드라인</span>
                              <p className="text-sm font-semibold">{variant.headline}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">본문</span>
                              <p className="text-sm">{variant.primaryText}</p>
                            </div>
                            {variant.description && (
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">설명</span>
                                <p className="text-sm text-muted-foreground">{variant.description}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-xs font-medium text-muted-foreground">CTA</span>
                              <p className="text-sm font-medium text-purple-700">{variant.callToAction}</p>
                            </div>
                          </div>
                          {variant.reasoning && (
                            <p className="text-xs text-muted-foreground italic border-t pt-2">
                              {variant.reasoning}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {/* Remaining Quota */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        남은 AI 과학 분석 횟수: {scienceCopyMutation.data.remainingQuota}회/주
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Science Copy Error */}
              {scienceCopyMutation.error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="py-4">
                    <p className="text-sm text-red-600 text-center">
                      {scienceCopyMutation.error instanceof Error
                        ? scienceCopyMutation.error.message
                        : '카피 생성에 실패했습니다'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Citations */}
              {scoreData?.score.domainScores && scoreData.score.domainScores.some((ds: { evidence: string[] }) => ds.evidence && ds.evidence.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">과학적 근거 인용</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {scoreData.score.domainScores
                      .flatMap((ds: { domain: string; evidence: string[] }) =>
                        (ds.evidence || []).slice(0, 2).map((ev: string, idx: number) => ({
                          domain: ds.domain,
                          evidence: ev,
                          id: `${ds.domain}-${idx}`,
                        }))
                      )
                      .slice(0, 5)
                      .map((item: { id: string; domain: string; evidence: string }, index: number) => (
                        <CitationCard
                          key={item.id || index}
                          source={item.domain}
                          finding={item.evidence}
                          applicability={0.8}
                        />
                      ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
