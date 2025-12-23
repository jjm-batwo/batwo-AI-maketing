# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

바투(Batow)는 커머스 사업자를 위한 올인원 AI 마케팅 대행 솔루션입니다. Meta Ads와 Google Ads 연동을 통해 AI 기반 캠페인 세팅, 성과 분석, 자동 보고서 생성 기능을 제공합니다.

## Tech Stack (Planned)

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Node.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **External APIs**: Meta Ads API, Google Ads API, OpenAI API
- **Testing**: Jest, Playwright

## Project Structure (Planned)

```
batow-service/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Node.js backend
├── packages/
│   ├── ui/           # Shared UI components
│   └── shared/       # Shared utilities and types
└── docs/             # Documentation
```

## Key Documents

- `PRD.md` - 제품 요구사항 문서
- `execution-plan.md` - 개발 실행 계획 및 태스크 목록

## Development Context

### Core Domains
1. **인증**: JWT 기반 인증, 소셜 로그인 (Google/Kakao)
2. **Meta Ads 연동**: OAuth, 캠페인 CRUD, Insights API
3. **AI 기능**: 캠페인 추천, 광고 카피 생성, 성과 분석
4. **보고서**: 주간/월간 자동 생성, PDF 다운로드

### Key Metrics
- ROAS (Return on Ad Spend)
- CPA (Cost per Acquisition)
- CTR (Click-Through Rate)
