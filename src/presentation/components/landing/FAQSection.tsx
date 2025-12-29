'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { HelpCircle } from 'lucide-react'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    id: 'faq-1',
    question: '바투는 어떤 서비스인가요?',
    answer:
      '바투는 AI 기반 Meta(Facebook/Instagram) 광고 자동화 플랫폼입니다. 마케팅 지식이 없어도 쉽게 광고를 생성하고 관리할 수 있으며, AI가 자동으로 성과를 분석하고 최적화합니다.',
  },
  {
    id: 'faq-2',
    question: 'Meta 광고 계정 연동은 어떻게 하나요?',
    answer:
      '회원가입 후 Meta 비즈니스 계정으로 로그인하시면 자동으로 광고 계정이 연동됩니다. 연동 과정은 약 2분 정도 소요되며, 기존 캠페인 데이터도 함께 불러옵니다.',
  },
  {
    id: 'faq-3',
    question: 'AI가 어떻게 광고를 최적화하나요?',
    answer:
      '바투의 AI는 실시간으로 광고 성과 데이터를 분석하여 타겟팅, 예산 배분, 입찰가를 자동 조정합니다. 또한 가장 효과적인 광고 소재와 카피를 추천하고, 성과가 낮은 광고는 자동으로 중단합니다.',
  },
  {
    id: 'faq-4',
    question: '무료 체험 기간이 있나요?',
    answer:
      '네, 14일간 모든 기능을 무료로 체험할 수 있습니다. 신용카드 등록 없이 시작할 수 있으며, 체험 기간 중 언제든지 유료 플랜으로 업그레이드하거나 취소할 수 있습니다.',
  },
  {
    id: 'faq-5',
    question: '요금은 어떻게 책정되나요?',
    answer:
      '월 광고비 규모에 따라 Starter(월 100만원 이하), Growth(월 500만원 이하), Pro(무제한) 플랜을 선택할 수 있습니다. 연간 결제 시 20% 할인 혜택이 있습니다.',
  },
  {
    id: 'faq-6',
    question: '기존 광고 캠페인도 관리할 수 있나요?',
    answer:
      '네, 기존에 Meta Ads Manager에서 운영하던 캠페인도 바투에서 통합 관리할 수 있습니다. 연동 즉시 기존 캠페인의 성과 데이터와 설정이 자동으로 동기화됩니다.',
  },
  {
    id: 'faq-7',
    question: '데이터 보안은 어떻게 되나요?',
    answer:
      '바투는 ISO 27001 인증을 받은 보안 시스템을 운영하고 있습니다. 모든 데이터는 암호화되어 저장되며, Meta의 공식 API만을 사용하여 안전하게 연동됩니다.',
  },
  {
    id: 'faq-8',
    question: '고객 지원은 어떻게 받나요?',
    answer:
      '이메일, 채팅, 전화 상담을 통해 고객 지원을 받으실 수 있습니다. Pro 플랜 고객에게는 전담 매니저가 배정되어 1:1 컨설팅을 제공합니다. 평일 오전 9시부터 오후 6시까지 실시간 상담이 가능합니다.',
  },
]

// JSON-LD Schema for SEO
function FAQSchema({ items }: { items: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSection() {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 mb-4 bg-primary/10 rounded-full">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            자주 묻는 질문
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            바투 서비스에 대해 궁금하신 점을 확인해보세요
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            더 궁금한 점이 있으신가요?{' '}
            <a
              href="mailto:support@batwo.io"
              className="text-primary hover:underline"
            >
              support@batwo.io
            </a>
            로 문의해주세요
          </p>
        </div>
      </div>

      {/* JSON-LD Schema */}
      <FAQSchema items={faqItems} />
    </section>
  )
}
