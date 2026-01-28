import { memo, useMemo } from 'react'
import type { FAQItem } from './faqData'

interface FAQSchemaProps {
  items: FAQItem[]
}

export const FAQSchema = memo(function FAQSchema({ items }: FAQSchemaProps) {
  const schema = useMemo(
    () => ({
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
    }),
    [items]
  )

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
})
