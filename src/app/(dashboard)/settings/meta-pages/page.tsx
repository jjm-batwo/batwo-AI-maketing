'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ApiSourceBadge } from '@/presentation/components/common/ApiSourceBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertCircle,
  Loader2,
  Users,
  Eye,
  ThumbsUp,
  MessageCircle,
  Share2,
  TrendingUp,
  ChevronRight
} from 'lucide-react'
import Image from 'next/image'

interface MetaPage {
  id: string
  name: string
  category: string
  fan_count?: number
  followers_count?: number
  picture?: {
    data: {
      url: string
    }
  }
}

interface PageInsights {
  page: {
    id: string
    name: string
    category: string
    fanCount?: number
    followersCount?: number
    picture?: string
  }
  engagement: {
    page_fans: number
    page_engaged_users: number
    page_impressions: number
    page_post_engagements: number
    page_consumptions: number
    page_views_total: number
  }
  recentPosts: Array<{
    id: string
    message: string
    createdTime: string
    likes: number
    comments: number
    shares: number
  }>
}

export default function MetaPagesPage() {
  const searchParams = useSearchParams()
  const showApiSource = searchParams.get('showApiSource') === 'true'
  const [pages, setPages] = useState<MetaPage[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [insights, setInsights] = useState<PageInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/meta/pages', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
      const data = await response.json()

      if (response.ok) {
        setPages(data.pages)
      } else {
        setError(data.message || 'Failed to fetch pages')
      }
    } catch (err) {
      setError('페이지 목록을 불러오는데 실패했습니다')
      console.error('Failed to fetch pages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInsights = async (pageId: string) => {
    setIsLoadingInsights(true)
    setSelectedPageId(pageId)
    setInsights(null)

    try {
      const response = await fetch(`/api/meta/pages/${pageId}/insights`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      })
      const data = await response.json()

      if (response.ok) {
        setInsights(data)
      } else {
        console.error('Failed to fetch insights:', data.message)
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err)
    } finally {
      setIsLoadingInsights(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Meta 페이지 관리</h1>
        <p className="text-muted-foreground mt-1">
          연결된 Facebook 페이지의 참여 지표를 확인하세요
        </p>
        {showApiSource && <ApiSourceBadge endpoint="GET /me/accounts" permission="pages_show_list" className="mt-2" />}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {pages.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">연결된 페이지가 없습니다</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Meta 계정을 연결하면 관리 중인 페이지가 표시됩니다
              </p>
              <Button
                className="mt-4"
                onClick={() => window.location.href = '/settings/meta-connect'}
              >
                Meta 계정 연결하기
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pages List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">페이지 목록</h2>
            <p className="text-sm text-muted-foreground mb-4">
              관리 중인 {pages.length}개의 페이지
            </p>
            {pages.map((page) => (
              <Card
                key={page.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedPageId === page.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => fetchInsights(page.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {page.picture?.data?.url ? (
                      <Image
                        src={page.picture.data.url}
                        alt={page.name}
                        width={48}
                        height={48}
                        sizes="48px"
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{page.name}</p>
                      <p className="text-sm text-muted-foreground">{page.category}</p>
                      {page.followers_count && (
                        <p className="text-xs text-muted-foreground mt-1">
                          팔로워 {formatNumber(page.followers_count)}명
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Insights Panel */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">참여 지표</h2>
            {!selectedPageId ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <TrendingUp className="mx-auto h-12 w-12" />
                    <p className="mt-4">페이지를 선택하면 참여 지표가 표시됩니다</p>
                  </div>
                </CardContent>
              </Card>
            ) : isLoadingInsights ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ) : insights ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{insights.page.name}</CardTitle>
                    <CardDescription>최근 28일 참여 지표</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span className="text-xs">팬 수</span>
                        </div>
                        <p className="mt-1 text-xl font-bold">
                          {formatNumber(insights.engagement.page_fans)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span className="text-xs">노출 수</span>
                        </div>
                        <p className="mt-1 text-xl font-bold">
                          {formatNumber(insights.engagement.page_impressions)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs">참여 사용자</span>
                        </div>
                        <p className="mt-1 text-xl font-bold">
                          {formatNumber(insights.engagement.page_engaged_users)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-xs">게시물 참여</span>
                        </div>
                        <p className="mt-1 text-xl font-bold">
                          {formatNumber(insights.engagement.page_post_engagements)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Posts */}
                {insights.recentPosts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">최근 게시물</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {insights.recentPosts.map((post) => (
                          <div
                            key={post.id}
                            className="rounded-lg border p-3 text-sm"
                          >
                            <p className="text-muted-foreground truncate">
                              {post.message}
                            </p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {post.likes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {post.comments}
                              </span>
                              <span className="flex items-center gap-1">
                                <Share2 className="h-3 w-3" />
                                {post.shares}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="mx-auto h-12 w-12" />
                    <p className="mt-4">참여 데이터를 불러올 수 없습니다</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Permission Usage Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">사용 중인 권한</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">pages_show_list:</span>
              관리 중인 Facebook 페이지 목록을 조회합니다
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">pages_read_engagement:</span>
              페이지의 참여 지표(좋아요, 댓글, 공유 등)를 조회합니다
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
