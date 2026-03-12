import Link from 'next/link'


const footerLinks = {
  제품: [
    { label: '기능', href: '#features', disabled: false },
    { label: '가격', href: '#pricing', disabled: false },
    { label: '보안', href: '#', disabled: true },
    { label: '문서', href: '/docs', disabled: false },
  ],
  회사: [
    { label: '소개', href: '#', disabled: true },
    { label: '블로그', href: '#', disabled: true },
    { label: '채용', href: '#', disabled: true },
    { label: '파트너', href: '#', disabled: true },
  ],
  리소스: [
    { label: '고객 사례', href: '#', disabled: true },
    { label: '튜토리얼', href: '#', disabled: true },
    { label: '커뮤니티', href: '#', disabled: true },
    { label: '지원', href: 'mailto:support@batwo.io', disabled: false },
  ],
  소셜: [
    { label: 'Twitter', href: 'https://twitter.com/batwo_ai', disabled: false },
    { label: 'Instagram', href: 'https://instagram.com/batwo_ai', disabled: false },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/batwo', disabled: false },
    { label: 'GitHub', href: 'https://github.com/batwo-ai', disabled: false },
  ],
}

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Top row: Logo + columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Logo & tagline */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
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
                      className={`text-sm text-muted-foreground transition-colors${link.disabled ? ' opacity-50 cursor-not-allowed pointer-events-none' : ' hover:text-primary'}`}
                      aria-label={link.label}
                      aria-disabled={link.disabled || undefined}
                      tabIndex={link.disabled ? -1 : undefined}
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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
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
