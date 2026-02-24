import Link from 'next/link'
import { Sparkles } from 'lucide-react'

const footerLinks = {
  제품: [
    { label: '기능', href: '#features' },
    { label: '가격', href: '#pricing' },
    { label: '보안', href: '/security' },
    { label: '문서', href: '/docs' },
  ],
  회사: [
    { label: '소개', href: '/about' },
    { label: '블로그', href: '/blog' },
    { label: '채용', href: '/careers' },
    { label: '파트너', href: '/partners' },
  ],
  리소스: [
    { label: '고객 사례', href: '/case-studies' },
    { label: '튜토리얼', href: '/tutorials' },
    { label: '커뮤니티', href: '/community' },
    { label: '지원', href: 'mailto:support@batwo.io' },
  ],
  소셜: [
    { label: 'Twitter', href: 'https://twitter.com/batwo_ai' },
    { label: 'Instagram', href: 'https://instagram.com/batwo_ai' },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/batwo' },
    { label: 'GitHub', href: 'https://github.com/batwo-ai' },
  ],
}

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Top row: Logo + columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Logo & tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-4 w-4 text-primary-foreground fill-current" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold text-foreground">바투</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI 기반 Meta 광고 자동화 솔루션. 누구나 전문가처럼 광고하세요.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground mb-4">{category}</h3>
              <ul className="space-y-3" role="list">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      aria-label={link.label}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row: copyright + legal links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-100">
          <p className="text-sm text-muted-foreground">
            Copyright &copy; {currentYear}{' '}
            <Link href="/" className="hover:text-primary transition-colors">
              바투 (Batwo)
            </Link>{' '}
            · AI 마케팅 자동화 솔루션
          </p>
          <nav className="flex items-center gap-6" aria-label="법적 링크">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              개인정보처리방침
            </Link>
            <a
              href="mailto:support@batwo.io"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              문의하기
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
