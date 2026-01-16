'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '#features', label: '기능' },
  { href: '#how-it-works', label: '작동방식' },
  { href: '#pricing', label: '가격' },
]

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { data: session, status } = useSession()
  const isLoggedIn = !!session?.user

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">바투</span>
            <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
              Beta
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
                aria-label={`Navigate to ${link.label}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/campaigns">대시보드</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/api/auth/signout">로그아웃</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">무료로 시작하기</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div 
          id="mobile-menu"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
          aria-hidden={!isMenuOpen}
        >
          <div className="py-4 border-t">
            <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary min-h-[44px] flex items-center transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label={`Navigate to ${link.label}`}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {isLoggedIn ? (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/campaigns">대시보드</Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href="/api/auth/signout">로그아웃</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild>
                      <Link href="/login">로그인</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register">무료로 시작하기</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
        </div>
      </header>
    </>
  )
}
