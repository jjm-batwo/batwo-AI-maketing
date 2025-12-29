import {
  LandingHeader,
  HeroSection,
  SocialProofSection,
  FeaturesSection,
  ProductShowcaseSection,
  HowItWorksSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  CTASection,
  LandingFooter,
} from '@/presentation/components/landing'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main>
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <ProductShowcaseSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
