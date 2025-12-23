import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hero } from '../components/hero';
import { Features } from '../components/features';
import { Pricing } from '../components/pricing';
import { FAQ } from '../components/faq';
import { Header } from '../components/header';

describe('Landing Page Components', () => {
  describe('Hero Section', () => {
    it('renders headline text correctly', () => {
      render(<Hero />);

      expect(screen.getByText(/마케팅 지식 없이/i)).toBeInTheDocument();
      expect(screen.getByText(/광고 제대로 할 수 있습니다/i)).toBeInTheDocument();
    });

    it('renders subtitle text correctly', () => {
      render(<Hero />);

      expect(screen.getByText(/AI가 캠페인 세팅부터 성과 분석까지 모두 챙겨드립니다/i)).toBeInTheDocument();
    });

    it('renders primary CTA button', () => {
      render(<Hero />);

      const ctaButton = screen.getByRole('link', { name: /무료 베타 시작하기/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute('href', '/signup');
    });

    it('renders secondary CTA button', () => {
      render(<Hero />);

      const demoButton = screen.getByRole('link', { name: /데모 보기/i });
      expect(demoButton).toBeInTheDocument();
      expect(demoButton).toHaveAttribute('href', '#demo');
    });
  });

  describe('Features Section', () => {
    it('renders section header', () => {
      render(<Features />);

      expect(screen.getByText('핵심 기능')).toBeInTheDocument();
      expect(screen.getByText(/복잡한 광고 운영, 이제 AI에게 맡기세요/i)).toBeInTheDocument();
    });

    it('renders all 4 feature cards', () => {
      render(<Features />);

      // Check if all 4 feature titles are rendered
      expect(screen.getByText('AI 캠페인 세팅')).toBeInTheDocument();
      expect(screen.getByText('AI 광고 소재 생성')).toBeInTheDocument();
      expect(screen.getByText('실시간 성과 분석')).toBeInTheDocument();
      expect(screen.getByText('자동 보고서')).toBeInTheDocument();
    });

    it('renders feature descriptions', () => {
      render(<Features />);

      expect(screen.getByText(/타겟팅, 예산, 일정까지 AI가 알아서 최적 설정을 추천합니다/i)).toBeInTheDocument();
      expect(screen.getByText(/제품 정보만 입력하면 효과적인 광고 카피와 이미지를 자동 생성합니다/i)).toBeInTheDocument();
      expect(screen.getByText(/ROAS, CPA, CTR 등 핵심 지표를 실시간으로 확인하고 개선점을 받아보세요/i)).toBeInTheDocument();
      expect(screen.getByText(/주간\/월간 성과 보고서가 자동으로 생성되어 데이터 기반 의사결정을 지원합니다/i)).toBeInTheDocument();
    });

    it('has correct section id for navigation', () => {
      const { container } = render(<Features />);
      const section = container.querySelector('#features');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Pricing Section', () => {
    it('renders section header', () => {
      render(<Pricing />);

      expect(screen.getByText('요금제')).toBeInTheDocument();
      expect(screen.getByText(/지금 무료 베타에 참여하고 바투의 모든 기능을 경험해보세요/i)).toBeInTheDocument();
    });

    it('renders free beta badge', () => {
      render(<Pricing />);

      expect(screen.getByText('무료 베타')).toBeInTheDocument();
    });

    it('renders pricing information', () => {
      render(<Pricing />);

      expect(screen.getByText('무료 체험')).toBeInTheDocument();
      expect(screen.getByText('₩0')).toBeInTheDocument();
      expect(screen.getByText('/월')).toBeInTheDocument();
      expect(screen.getByText('베타 기간 동안 모든 기능 무료 제공')).toBeInTheDocument();
    });

    it('renders all feature items', () => {
      render(<Pricing />);

      expect(screen.getByText('캠페인 주 5개 생성')).toBeInTheDocument();
      expect(screen.getByText('AI 카피 생성 일 20회')).toBeInTheDocument();
      expect(screen.getByText('보고서 무제한 생성')).toBeInTheDocument();
      expect(screen.getByText('Meta Ads 연동')).toBeInTheDocument();
    });

    it('renders CTA button', () => {
      render(<Pricing />);

      const ctaButton = screen.getByRole('link', { name: /무료로 시작하기/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute('href', '/signup');
    });

    it('displays no credit card required message', () => {
      render(<Pricing />);

      expect(screen.getByText(/신용카드 등록 불필요/i)).toBeInTheDocument();
      expect(screen.getByText(/언제든 취소 가능/i)).toBeInTheDocument();
    });

    it('has correct section id for navigation', () => {
      const { container } = render(<Pricing />);
      const section = container.querySelector('#pricing');
      expect(section).toBeInTheDocument();
    });
  });

  describe('FAQ Section', () => {
    it('renders section header', () => {
      render(<FAQ />);

      expect(screen.getByText('자주 묻는 질문')).toBeInTheDocument();
      expect(screen.getByText(/바투에 대해 궁금하신 점을 확인해보세요/i)).toBeInTheDocument();
    });

    it('renders all FAQ questions', () => {
      render(<FAQ />);

      expect(screen.getByText(/마케팅 지식이 없어도 정말 사용할 수 있나요\?/i)).toBeInTheDocument();
      expect(screen.getByText(/무료 베타는 언제까지 진행되나요\?/i)).toBeInTheDocument();
      expect(screen.getByText(/어떤 광고 플랫폼을 지원하나요\?/i)).toBeInTheDocument();
      expect(screen.getByText(/제 광고 데이터는 안전한가요\?/i)).toBeInTheDocument();
      expect(screen.getByText(/기존 대행사와 비교해서 비용이 얼마나 절약되나요\?/i)).toBeInTheDocument();
    });

    it('accordion items are initially closed', () => {
      render(<FAQ />);

      // FAQ answers should not be in the document when accordion is closed (hidden attribute)
      const answer = screen.queryByText(/네, 가능합니다. 바투는 마케팅 전문가가 아니어도 쉽게 사용할 수 있도록 설계되었습니다/i);
      expect(answer).not.toBeInTheDocument();
    });

    it('can toggle accordion items', async () => {
      const user = userEvent.setup();
      render(<FAQ />);

      // Find and click the first question
      const firstQuestion = screen.getByText(/마케팅 지식이 없어도 정말 사용할 수 있나요\?/i);
      await user.click(firstQuestion);

      // Answer should now be visible
      const answer = screen.getByText(/네, 가능합니다. 바투는 마케팅 전문가가 아니어도 쉽게 사용할 수 있도록 설계되었습니다/i);
      expect(answer).toBeVisible();
    });

    it('can open and close accordion items', async () => {
      const user = userEvent.setup();
      render(<FAQ />);

      const question = screen.getByText(/무료 베타는 언제까지 진행되나요\?/i);

      // Initially closed - answer should not be in document
      expect(screen.queryByText(/정식 출시 전까지/i)).not.toBeInTheDocument();

      // Open accordion
      await user.click(question);
      const answer = await screen.findByText(/정식 출시 전까지/i);
      expect(answer).toBeInTheDocument();

      // Close accordion
      await user.click(question);
      expect(screen.queryByText(/정식 출시 전까지/i)).not.toBeInTheDocument();
    });

    it('has correct section id for navigation', () => {
      const { container } = render(<FAQ />);
      const section = container.querySelector('#faq');
      expect(section).toBeInTheDocument();
    });
  });

  describe('Header Navigation', () => {
    it('renders logo', () => {
      render(<Header />);

      const logo = screen.getByRole('link', { name: /바투/i });
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('href', '/');
    });

    it('renders navigation links', () => {
      render(<Header />);

      const featuresLink = screen.getByRole('link', { name: '기능' });
      const pricingLink = screen.getByRole('link', { name: '요금제' });
      const faqLink = screen.getByRole('link', { name: 'FAQ' });

      expect(featuresLink).toBeInTheDocument();
      expect(featuresLink).toHaveAttribute('href', '#features');

      expect(pricingLink).toBeInTheDocument();
      expect(pricingLink).toHaveAttribute('href', '#pricing');

      expect(faqLink).toBeInTheDocument();
      expect(faqLink).toHaveAttribute('href', '#faq');
    });

    it('renders CTA button', () => {
      render(<Header />);

      const ctaButton = screen.getByRole('link', { name: /무료 체험 시작/i });
      expect(ctaButton).toBeInTheDocument();
      expect(ctaButton).toHaveAttribute('href', '/signup');
    });
  });

  describe('Accessibility', () => {
    it('hero section has proper heading hierarchy', () => {
      render(<Hero />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('features section has proper heading hierarchy', () => {
      render(<Features />);

      const heading = screen.getByRole('heading', { level: 2, name: '핵심 기능' });
      expect(heading).toBeInTheDocument();
    });

    it('pricing section has proper heading hierarchy', () => {
      render(<Pricing />);

      const heading = screen.getByRole('heading', { level: 2, name: '요금제' });
      expect(heading).toBeInTheDocument();
    });

    it('FAQ section has proper heading hierarchy', () => {
      render(<FAQ />);

      const heading = screen.getByRole('heading', { level: 2, name: '자주 묻는 질문' });
      expect(heading).toBeInTheDocument();
    });

    it('all CTA buttons are keyboard accessible', () => {
      render(<Hero />);

      const ctaButton = screen.getByRole('link', { name: /무료 베타 시작하기/i });
      expect(ctaButton).toHaveAttribute('href');
    });
  });

  describe('Responsive Design', () => {
    it('hero section has responsive text classes', () => {
      const { container } = render(<Hero />);
      const heading = container.querySelector('h1');

      expect(heading).toHaveClass('text-4xl', 'md:text-5xl', 'lg:text-6xl');
    });

    it('features grid has responsive columns', () => {
      const { container } = render(<Features />);
      const grid = container.querySelector('.grid');

      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });
  });
});
