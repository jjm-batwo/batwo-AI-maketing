'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Menu, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '#features', label: '기능' },
  { href: '#how-it-works', label: '작동방식' },
  { href: '#pricing', label: '가격' },
]

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { data: session, status } = useSession()
  const isLoggedIn = !!session?.user
  const isLoading = status === 'loading'

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || isMenuOpen
          ? 'bg-background/70 backdrop-blur-md border-b border-white/20 dark:border-white/10 shadow-sm'
          : 'bg-transparent border-transparent'
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 md:h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-600 text-white shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-bold tracking-tight">바투</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-primary/10 text-primary uppercase tracking-wider rounded-sm border border-primary/20">
                Beta
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground/80 hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary relative group py-2"
                  aria-label={`Navigate to ${link.label}`}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full group-focus-visible:w-full opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3 min-w-[150px] justify-end">
              {isLoading ? (
                <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />
              ) : isLoggedIn ? (
                <>
                  <Button variant="ghost" asChild className="hover:bg-primary/5 text-muted-foreground hover:text-primary">
                    <Link href="/campaigns">대시보드</Link>
                  </Button>
                  <Button variant="outline" asChild className="border-primary/20 hover:border-primary/50 hover:bg-primary/5">
                    <Link href="/api/auth/signout">로그아웃</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild className="hover:bg-primary/5 text-muted-foreground hover:text-primary">
                    <Link href="/login">로그인</Link>
                  </Button>
                  <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                    <Link href="/register">무료로 시작하기</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
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
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'
              }`}
            aria-hidden={!isMenuOpen}
          >
            <div className="pt-2 pb-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-3.5 text-base font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label={`Navigate to ${link.label}`}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="pt-4 mt-2 border-t border-border/50 px-4 flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  <Button variant="outline" className="w-full justify-center" asChild>
                    <Link href="/campaigns">대시보드</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-center" asChild>
                    <Link href="/api/auth/signout">로그아웃</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full justify-center border-primary/20" asChild>
                    <Link href="/login">로그인</Link>
                  </Button>
                  <Button className="w-full justify-center shadow-md bg-gradient-to-r from-primary to-purple-600 border-0" asChild>
                    <Link href="/register">무료로 시작하기</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
