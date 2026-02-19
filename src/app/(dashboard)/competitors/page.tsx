'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search } from 'lucide-react'
import { useCompetitorSearch } from '@/presentation/hooks/useCompetitorAnalysis'
import { CompetitorCard } from '@/presentation/components/competitors/CompetitorCard'
import { TrendChart } from '@/presentation/components/competitors/TrendChart'
import { RecommendationList } from '@/presentation/components/competitors/RecommendationList'

const INDUSTRY_OPTIONS = [
  { value: '', label: '전체 업종' },
  { value: 'ecommerce', label: '이커머스' },
  { value: 'fashion', label: '패션/뷰티' },
  { value: 'food', label: '식품/음료' },
  { value: 'health', label: '건강/피트니스' },
  { value: 'education', label: '교육' },
  { value: 'finance', label: '금융' },
  { value: 'travel', label: '여행' },
]

export default function CompetitorsPage() {
  const [keywords, setKeywords] = useState('')
  const [industry, setIndustry] = useState('')
  const [searchKeywords, setSearchKeywords] = useState('')
  const [searchIndustry, setSearchIndustry] = useState('')

  const { data, isLoading, error } = useCompetitorSearch(
    searchKeywords,
    'KR',
    searchIndustry || undefined
  )

  function handleSearch() {
    setSearchKeywords(keywords)
    setSearchIndustry(industry)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">경쟁사 광고 분석</h1>
        <p className="text-muted-foreground text-sm">
          키워드로 경쟁사 광고 트렌드를 분석하고 전략을 수립하세요.
        </p>
      </div>

      {/* 검색 폼 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="키워드 입력 (예: 다이어트, 스킨케어)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="업종 선택" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value || '_all'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} disabled={!keywords || isLoading} className="shrink-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          분석하기
        </Button>
      </div>

      {/* 초기 상태 */}
      {!searchKeywords && (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <Search className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">키워드를 입력하고 경쟁사 광고를 분석해보세요.</p>
        </div>
      )}

      {/* 에러 상태 */}
      {error && searchKeywords && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 결과 */}
      {data && !isLoading && (
        <div className="space-y-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>총 <strong className="text-foreground">{data.totalAds}개</strong> 광고 분석 완료</span>
          </div>

          {/* 트렌드 + 추천 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendChart
              formatDistribution={data.analysis.trends.formatDistribution}
              popularHooks={data.analysis.trends.popularHooks}
              commonOffers={data.analysis.trends.commonOffers}
            />
            <RecommendationList recommendations={data.analysis.recommendations} />
          </div>

          {/* 경쟁사 카드 그리드 */}
          {data.analysis.competitors.length > 0 ? (
            <div>
              <h2 className="text-base font-semibold mb-4">경쟁사 목록</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.analysis.competitors.map((competitor) => (
                  <CompetitorCard
                    key={competitor.pageId}
                    pageName={competitor.pageName}
                    pageId={competitor.pageId}
                    adCount={competitor.adCount}
                    dominantFormats={competitor.dominantFormats}
                    commonHooks={competitor.commonHooks}
                    averageAdLifespan={competitor.averageAdLifespan}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              해당 키워드의 경쟁사 광고를 찾을 수 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
