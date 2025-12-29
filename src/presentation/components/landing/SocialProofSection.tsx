import { Users, TrendingUp, Clock, Award, Shield, Zap } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex flex-col items-center p-6 bg-card rounded-lg border">
      <div className="p-3 mb-4 bg-primary/10 rounded-full text-primary">
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
    icon: <Users className="h-6 w-6" />,
    value: '1,000+',
    label: '활성 사용자',
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    value: '35%',
    label: '평균 ROAS 향상',
  },
  {
    icon: <Clock className="h-6 w-6" />,
    value: '10시간',
    label: '주간 시간 절약',
  },
  {
    icon: <Award className="h-6 w-6" />,
    value: '98%',
    label: '고객 만족도',
  },
]

const trustBadges = [
  {
    icon: <Shield className="h-5 w-5" />,
    label: 'Meta 공식 파트너',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    label: 'ISO 27001 인증',
  },
  {
    icon: <Award className="h-5 w-5" />,
    label: '2024 마케팅 어워드',
  },
]

export function SocialProofSection() {
  return (
    <section id="social-proof" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            이미 많은 사업자가 바투와 함께하고 있습니다
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
              className="flex items-center gap-2 text-muted-foreground"
            >
              <div className="p-2 bg-background rounded-full border">
                {badge.icon}
              </div>
              <span className="text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
