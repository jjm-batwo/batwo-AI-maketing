'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { useIntersectionObserver } from '@/presentation/hooks'
import {
  BarChart3,
  Target,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MessageCircle,
} from 'lucide-react'

// Mock Dashboard Preview Component
function DashboardPreview() {
  return (
    <div className="bg-background rounded-lg border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">오늘의 성과</h3>
        <span className="text-sm text-muted-foreground">2024년 12월 29일</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">광고비</span>
          </div>
          <div className="text-base lg:text-xl font-bold">₩1,250,000</div>
          <div className="flex items-center text-xs text-green-600">
            <ArrowUpRight className="h-3 w-3" />
            <span>12%</span>
          </div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">매출</span>
          </div>
          <div className="text-base lg:text-xl font-bold">₩4,375,000</div>
          <div className="flex items-center text-xs text-green-600">
            <ArrowUpRight className="h-3 w-3" />
            <span>28%</span>
          </div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">ROAS</span>
          </div>
          <div className="text-base lg:text-xl font-bold">3.5x</div>
          <div className="flex items-center text-xs text-green-600">
            <ArrowUpRight className="h-3 w-3" />
            <span>0.5x</span>
          </div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="h-4 w-4" />
            <span className="text-xs">전환</span>
          </div>
          <div className="text-base lg:text-xl font-bold">127건</div>
          <div className="flex items-center text-xs text-red-600">
            <ArrowDownRight className="h-3 w-3" />
            <span>3%</span>
          </div>
        </div>
      </div>

      {/* Mock Chart */}
      <div className="h-32 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-lg flex items-end justify-around p-4">
        {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
          <div
            key={i}
            className="w-8 bg-primary/60 rounded-t"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  )
}

// Mock Campaign Preview Component
function CampaignPreview() {
  const campaigns = [
    {
      name: '신규 고객 유입 캠페인',
      status: '진행중',
      budget: '₩500,000/일',
      roas: '4.2x',
    },
    {
      name: '리타겟팅 캠페인',
      status: '진행중',
      budget: '₩300,000/일',
      roas: '5.8x',
    },
    {
      name: '브랜드 인지도',
      status: '일시정지',
      budget: '₩200,000/일',
      roas: '2.1x',
    },
  ]

  return (
    <div className="bg-background rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">활성 캠페인</h3>
        <span className="text-sm text-primary cursor-pointer">+ 새 캠페인</span>
      </div>

      <div className="space-y-3">
        {campaigns.map((campaign, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">{campaign.name}</div>
                <div className="text-xs text-muted-foreground">
                  {campaign.budget}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-sm ${campaign.status === '진행중' ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                {campaign.status}
              </div>
              <div className="text-sm font-semibold">ROAS {campaign.roas}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mock Report Preview Component
function ReportPreview() {
  return (
    <div className="bg-background rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI 주간 보고서</h3>
        <span className="text-sm text-muted-foreground">12월 4주차</span>
      </div>

      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium mb-2">AI 인사이트 요약</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-600">+</span>
                <span>리타겟팅 캠페인 ROAS가 15% 상승했습니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600">!</span>
                <span>25-34세 여성 타겟 전환율이 높습니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">i</span>
                <span>주말 오후 3시 광고 효율이 가장 좋습니다</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">+23%</div>
          <div className="text-xs text-muted-foreground">전주 대비 성과</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="text-2xl font-bold">3건</div>
          <div className="text-xs text-muted-foreground">최적화 제안</div>
        </div>
      </div>
    </div>
  )
}

// Mock Chat Preview Component
function ChatPreview() {
  return (
    <div className="bg-background rounded-lg border p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI 마케팅 어시스턴트</h3>
        <span className="text-sm text-muted-foreground">실시간 대화</span>
      </div>

      <div className="space-y-3">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
            <p className="text-sm">이번 주 캠페인 성과 어때?</p>
          </div>
        </div>

        {/* AI Response */}
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%] space-y-2">
            <p className="text-sm">이번 주 캠페인 성과를 분석했습니다.</p>
            {/* Mini KPI Card */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-background rounded-lg border">
              <div>
                <div className="text-[10px] text-muted-foreground">ROAS</div>
                <div className="text-sm font-semibold">4.52x</div>
                <div className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />+12.3%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">전환수</div>
                <div className="text-sm font-semibold">123건</div>
                <div className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />+8.1%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Message */}
        <div className="flex justify-end">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
            <p className="text-sm">신규 캠페인 만들어줘</p>
          </div>
        </div>

        {/* AI Confirmation Card */}
        <div className="flex justify-start">
          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[85%] space-y-2">
            <p className="text-sm">새 캠페인을 생성하겠습니다.</p>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Target className="h-3.5 w-3.5" />
                캠페인 생성 확인
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">목표</span><span>전환</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">예산</span><span>₩50,000/일</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductShowcaseSection() {
  const { ref, isIntersecting } = useIntersectionObserver()

  return (
    <section id="product-showcase" className="py-16 md:py-24 overflow-hidden">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-1000 ${isIntersecting ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
          }`}
      >
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            직관적인 대시보드로 모든 것을 한눈에
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            복잡한 광고 데이터를 쉽게 이해하고, AI 인사이트로 빠르게 의사결정하세요
          </p>
        </div>

        {/* Tabbed Product Showcase */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="dashboard" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">대시보드</span>
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="gap-2">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">캠페인 관리</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">AI 보고서</span>
                </TabsTrigger>
                <TabsTrigger value="ai-assistant" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">AI 어시스턴트</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <DashboardPreview />
              </TabsContent>

              <TabsContent value="campaigns">
                <CampaignPreview />
              </TabsContent>

              <TabsContent value="reports">
                <ReportPreview />
              </TabsContent>

              <TabsContent value="ai-assistant">
                <ChatPreview />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
