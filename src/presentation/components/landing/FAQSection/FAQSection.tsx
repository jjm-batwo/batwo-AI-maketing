'use client'

import { memo } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FAQ_ITEMS } from './faqData'
import { FAQSchema } from './FAQSchema'
import { SectionLabel } from '../SectionLabel'

export const FAQSection = memo(function FAQSection() {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <header className="text-center mb-12">
          <SectionLabel className="text-center">자주 묻는 질문</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            궁금하신 점이 있으신가요?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            바투 서비스에 대해 궁금하신 점을 확인해보세요
          </p>
        </header>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md">
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
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="이메일로 문의하기 support@batwo.io"
            >
              support@batwo.io
            </a>
            로 문의해주세요
          </p>
        </div>
      </div>

      {/* JSON-LD Schema */}
      <FAQSchema items={FAQ_ITEMS} />
    </section>
  )
})
