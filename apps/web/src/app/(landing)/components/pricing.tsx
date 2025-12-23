import Link from 'next/link';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Container } from '@batow/ui';
import { Check } from 'lucide-react';

const features = [
  '캠페인 주 5개 생성',
  'AI 카피 생성 일 20회',
  '보고서 무제한 생성',
  'Meta Ads 연동',
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20">
      <Container size="lg">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">요금제</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              지금 무료 베타에 참여하고 바투의 모든 기능을 경험해보세요
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-primary">
              <CardHeader className="text-center space-y-4">
                <Badge variant="default" className="w-fit mx-auto">
                  무료 베타
                </Badge>
                <CardTitle className="text-2xl">무료 체험</CardTitle>
                <div>
                  <span className="text-4xl font-bold">₩0</span>
                  <span className="text-muted-foreground">/월</span>
                </div>
                <CardDescription>베타 기간 동안 모든 기능 무료 제공</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Features List */}
                <ul className="space-y-3">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button size="lg" className="w-full" asChild>
                  <Link href="/signup">무료로 시작하기</Link>
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  신용카드 등록 불필요 • 언제든 취소 가능
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}
