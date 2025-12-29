import { Zap, BarChart3, FileText, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Zap,
    title: 'AI 캠페인 자동 세팅',
    description:
      '비즈니스 정보만 입력하면 AI가 최적의 Meta 광고 캠페인을 자동으로 구성합니다.',
  },
  {
    icon: BarChart3,
    title: '실시간 KPI 대시보드',
    description:
      'ROAS, CTR, 전환율 등 핵심 지표를 한눈에 확인하고 광고 성과를 추적하세요.',
  },
  {
    icon: FileText,
    title: 'AI 주간 보고서',
    description:
      '광고 성과를 분석한 인사이트와 개선 제안을 매주 자동으로 받아보세요.',
  },
  {
    icon: Shield,
    title: 'Meta 공식 연동',
    description:
      'Meta Business API와 안전하게 연동하여 광고 계정을 직접 관리합니다.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            왜 바투인가요?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            복잡한 광고 운영을 AI가 대신합니다.
            당신은 비즈니스에만 집중하세요.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
