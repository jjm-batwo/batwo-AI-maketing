import Link from 'next/link';
import { Container } from '@batow/ui';

export function Footer() {
  return (
    <footer className="border-t py-12">
      <Container size="lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Logo and Description */}
          <div className="space-y-2">
            <Link href="/" className="text-xl font-bold">
              바투
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              AI 기반 마케팅 자동화 솔루션으로 누구나 쉽게 광고를 운영할 수 있습니다
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground text-center">
            © 2024 바투. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
