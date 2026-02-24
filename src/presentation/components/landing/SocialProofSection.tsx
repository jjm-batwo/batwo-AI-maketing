import { SectionLabel } from './SectionLabel'

const PLATFORMS = [
  { name: 'Meta Business' },
  { name: 'Cafe24' },
  { name: 'Shopify' },
  { name: 'Naver' },
  { name: 'Instagram' },
  { name: 'Coupang' },
  { name: 'YouTube' },
  { name: 'Kakao' },
]

// Triplicated for seamless infinite marquee
const MARQUEE_ITEMS = [...PLATFORMS, ...PLATFORMS, ...PLATFORMS]

export function SocialProofSection() {
  return (
    <section
      id="social-proof"
      className="py-14 md:py-20 border-y border-gray-100 overflow-hidden"
    >
      <div className="container mx-auto px-4 mb-10 text-center">
        <SectionLabel className="text-center">연동 플랫폼</SectionLabel>
        <p className="text-sm text-muted-foreground">
          국내외 주요 이커머스 및 마케팅 플랫폼과 연동됩니다
        </p>
      </div>

      {/* Marquee wrapper — centered track with edge fades */}
      <div className="relative flex items-center overflow-hidden select-none">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-40 z-10 pointer-events-none bg-gradient-to-r from-background via-background/80 to-transparent" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-40 z-10 pointer-events-none bg-gradient-to-l from-background via-background/80 to-transparent" />

        <div className="flex animate-marquee gap-20 items-center whitespace-nowrap">
          {MARQUEE_ITEMS.map((platform, index) => (
            <span
              key={`${platform.name}-${index}`}
              className="shrink-0 text-base md:text-lg font-semibold tracking-tight text-gray-400 hover:text-gray-600 transition-colors duration-200"
              aria-hidden={index >= PLATFORMS.length}
            >
              {platform.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
