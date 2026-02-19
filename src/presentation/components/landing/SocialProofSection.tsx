import { Sparkles, Activity, Clock, Zap, Shield, Globe } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="group flex flex-col items-center p-6 bg-card rounded-lg border border-border/50 transition-colors hover:border-primary/30 cursor-default">
      <div className="p-3 mb-4 bg-primary/10 rounded-full text-primary transition-colors group-hover:bg-primary/20">
        {icon}
      </div>
      <span className="text-3xl md:text-4xl font-bold text-foreground mb-2">
        {value}
      </span>
      <span className="text-sm text-muted-foreground text-center">{label}</span>
    </div>
  )
}

const stats = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    value: 'AI 자동화',
    label: '캠페인 생성부터 최적화까지',
  },
  {
    icon: <Activity className="h-6 w-6" />,
    value: '실시간',
    label: '성과 모니터링 & 리포트',
  },
  {
    icon: <Clock className="h-6 w-6" />,
    value: '5분',
    label: '간편한 초기 설정',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    value: '24/7',
    label: 'AI가 항상 광고 최적화',
  },
]

const trustBadges = [
  {
    icon: <Shield className="h-5 w-5" />,
    label: 'Meta Marketing API 연동',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    label: '데이터 암호화 적용',
  },
  {
    icon: <Globe className="h-5 w-5" />,
    label: '한국어 최적화',
  },
]

export function SocialProofSection() {
  return (
    <section id="social-proof" className="py-10 md:py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            바투 AI가 제공하는 가치
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI 기반 마케팅 자동화로 광고 성과를 높이고 시간을 절약하세요
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
            />
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {trustBadges.map((badge, index) => (
            <div
              key={index}
              className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary cursor-default"
            >
              <div className="p-2 bg-background rounded-full border transition-colors group-hover:bg-primary/10 group-hover:border-primary/30">
                {badge.icon}
              </div>
              <span className="text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </div>

        {/* 연동 플랫폼 로고 바 */}
        <div className="mt-12 pt-8 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center mb-6 uppercase tracking-widest">연동 플랫폼</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-50">
            <span className="text-lg font-bold tracking-tight">Meta</span>
            <span className="text-lg font-bold tracking-tight">카페24</span>
            <span className="text-lg font-bold tracking-tight">스마트스토어</span>
            <span className="text-lg font-bold tracking-tight">Shopify</span>
          </div>
        </div>
      </div>
    </section>
  )
}
