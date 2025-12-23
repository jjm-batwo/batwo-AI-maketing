import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '바투 - AI 마케팅 대행 솔루션',
  description: '커머스 사업자를 위한 올인원 AI 마케팅 대행 솔루션',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
