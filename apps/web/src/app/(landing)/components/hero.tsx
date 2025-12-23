import Link from 'next/link';
import { Button, Container } from '@batow/ui';

export function Hero() {
  return (
    <section className="py-24 md:py-32">
      <Container size="lg">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Headline */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              마케팅 지식 없이
              <br />
              광고 제대로 할 수 있습니다
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              AI가 캠페인 세팅부터 성과 분석까지 모두 챙겨드립니다
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">무료 베타 시작하기</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">데모 보기</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
