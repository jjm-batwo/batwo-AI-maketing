/**
 * Dynamic Open Graph Image Generation
 *
 * Next.js의 ImageResponse를 사용한 동적 OG 이미지 생성
 * https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 */

import { ImageResponse } from 'next/og'
import { SEO } from '@/lib/constants/seo'

// 이미지 크기 설정
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Alt 텍스트
export const alt = SEO.og.imageAlt

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 배경 그라데이션 원 */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.2)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -150,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.15)',
            filter: 'blur(80px)',
          }}
        />

        {/* 로고 아이콘 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 40px rgba(99, 102, 241, 0.4)',
            }}
          >
            <span style={{ fontSize: 40, color: 'white', fontWeight: 700 }}>B</span>
          </div>
        </div>

        {/* 메인 타이틀 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: 'white',
              margin: 0,
              letterSpacing: -2,
              textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            {SEO.siteName}
          </h1>
          <p
            style={{
              fontSize: 28,
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '20px 0 0 0',
              maxWidth: 800,
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            커머스 사업자를 위한 AI 마케팅 대행 솔루션
          </p>
        </div>

        {/* 하단 태그라인 */}
        <div
          style={{
            display: 'flex',
            gap: 24,
            marginTop: 50,
          }}
        >
          {['Meta 광고 자동화', 'AI 성과 분석', '실시간 대시보드'].map((tag) => (
            <div
              key={tag}
              style={{
                padding: '12px 24px',
                borderRadius: 30,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: 18,
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* URL */}
        <p
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 20,
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          batwo.ai
        </p>
      </div>
    ),
    {
      ...size,
    }
  )
}
