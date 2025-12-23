import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Container,
} from '@batow/ui';

const faqs = [
  {
    question: '마케팅 지식이 없어도 정말 사용할 수 있나요?',
    answer:
      '네, 가능합니다. 바투는 마케팅 전문가가 아니어도 쉽게 사용할 수 있도록 설계되었습니다. AI가 캠페인 세팅부터 성과 분석까지 모든 과정을 가이드하고, 복잡한 용어는 쉬운 말로 풀어서 설명해드립니다.',
  },
  {
    question: '무료 베타는 언제까지 진행되나요?',
    answer:
      '정식 출시 전까지 무료로 이용하실 수 있습니다. 베타 참여자분들께는 정식 출시 후에도 특별 할인 혜택을 제공할 예정입니다. 정확한 종료일이 결정되면 사전에 공지해드리겠습니다.',
  },
  {
    question: '어떤 광고 플랫폼을 지원하나요?',
    answer:
      '현재 Meta Ads(Facebook, Instagram)를 지원하고 있으며, Google Ads는 곧 추가될 예정입니다. 향후 네이버, 카카오 등 국내 주요 플랫폼도 순차적으로 지원할 계획입니다.',
  },
  {
    question: '제 광고 데이터는 안전한가요?',
    answer:
      '모든 데이터는 암호화되어 안전하게 보관되며, 고객님의 동의 없이 제3자와 공유되지 않습니다. 또한 Meta와 Google의 공식 API를 사용하여 보안 기준을 준수하고 있습니다.',
  },
  {
    question: '기존 대행사와 비교해서 비용이 얼마나 절약되나요?',
    answer:
      '일반적인 광고 대행사는 광고비의 15-30%를 수수료로 청구합니다. 바투를 사용하면 월 정액 요금만으로 무제한 캠페인 관리가 가능하여, 광고비가 클수록 더 큰 비용 절감 효과를 얻으실 수 있습니다.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 bg-muted/50">
      <Container size="lg">
        <div className="space-y-12">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">자주 묻는 질문</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              바투에 대해 궁금하신 점을 확인해보세요
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="bg-background border rounded-lg px-6">
                  <AccordionTrigger className="text-left hover:no-underline">
                    <span className="font-semibold">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </Container>
    </section>
  );
}
