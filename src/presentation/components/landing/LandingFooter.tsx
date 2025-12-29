import Link from 'next/link'

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-8 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Copyright */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold text-primary">
              바투
            </Link>
            <span className="text-sm text-muted-foreground">
              &copy; {currentYear} 바투. All rights reserved.
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6">
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
