import { Hero } from './components/hero';
import { Features } from './components/features';
import { Pricing } from './components/pricing';
import { FAQ } from './components/faq';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
    </>
  );
}
