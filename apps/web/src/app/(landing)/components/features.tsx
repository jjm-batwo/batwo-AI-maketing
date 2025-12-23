import { Card, CardContent, CardDescription, CardHeader, CardTitle, Container } from '@batow/ui';
import { Sparkles, PenLine, BarChart3, FileText } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI 캠페인 세팅',
    description: '타겟팅, 예산, 일정까지 AI가 알아서 최적 설정을 추천합니다',
  },
  {
    icon: PenLine,
    title: 'AI 광고 소재 생성',
    description: '제품 정보만 입력하면 효과적인 광고 카피와 이미지를 자동 생성합니다',
  },
  {
    icon: BarChart3,
    title: '실시간 성과 분석',
    description: 'ROAS, CPA, CTR 등 핵심 지표를 실시간으로 확인하고 개선점을 받아보세요',
  },
  {
    icon: FileText,
    title: '자동 보고서',
    description: '주간/월간 성과 보고서가 자동으로 생성되어 데이터 기반 의사결정을 지원합니다',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 bg-muted/50">
      <Container size="lg">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">핵심 기능</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              복잡한 광고 운영, 이제 AI에게 맡기세요
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
