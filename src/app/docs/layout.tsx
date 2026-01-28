import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API 문서 | 바투 AI 마케팅',
  description: '바투 AI 마케팅 솔루션 REST API 문서',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
