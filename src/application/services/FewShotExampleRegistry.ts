import { ChatIntent } from '@domain/value-objects/ChatIntent'
import { FewShotExample } from '@domain/value-objects/FewShotExample'
import { IFewShotExampleRegistry } from '../ports/IFewShotExampleRegistry'

/**
 * FewShotExampleRegistry
 * - 도메인별 few-shot 예시를 하드코딩 맵으로 관리합니다.
 * - 각 카테고리별 2-3개의 user→assistant 예시 쌍을 제공합니다.
 * - DB 저장 없이 인메모리로 동작합니다.
 */
export class FewShotExampleRegistry implements IFewShotExampleRegistry {
  private readonly examples: Map<ChatIntent, FewShotExample[]>

  constructor() {
    this.examples = new Map([
      [
        ChatIntent.CAMPAIGN_CREATION,
        [
          {
            role: 'user',
            content: 'Meta 광고 캠페인을 새로 만들고 싶어요. 일일 예산은 5만원이고 패션 상품을 홍보하려고 해요.',
            category: ChatIntent.CAMPAIGN_CREATION,
          },
          {
            role: 'assistant',
            content:
              '패션 상품 캠페인을 생성하겠습니다. 일일 예산 5만원, 목표는 전환(구매)으로 설정하는 것을 권장합니다. 타겟 연령대와 관심사를 알려주시면 더 정밀한 캠페인을 만들 수 있어요.',
            category: ChatIntent.CAMPAIGN_CREATION,
          },
          {
            role: 'user',
            content: '코스메틱 브랜드 캠페인을 만들어줘. 인지도 목표로 주간 예산 70만원.',
            category: ChatIntent.CAMPAIGN_CREATION,
          },
        ],
      ],
      [
        ChatIntent.REPORT_QUERY,
        [
          {
            role: 'user',
            content: '지난주 광고 성과 보고서를 보여줘.',
            category: ChatIntent.REPORT_QUERY,
          },
          {
            role: 'assistant',
            content:
              '지난주(2024년 1월 15일~21일) 광고 성과를 조회합니다. 캠페인별 노출수, 클릭수, 전환수, 광고비를 포함한 보고서를 생성 중입니다.',
            category: ChatIntent.REPORT_QUERY,
          },
          {
            role: 'user',
            content: '이번 달 캠페인 성과 요약 리포트 만들어줘.',
            category: ChatIntent.REPORT_QUERY,
          },
        ],
      ],
      [
        ChatIntent.KPI_ANALYSIS,
        [
          {
            role: 'user',
            content: '현재 ROAS가 왜 이렇게 낮아졌는지 분석해줘.',
            category: ChatIntent.KPI_ANALYSIS,
          },
          {
            role: 'assistant',
            content:
              'ROAS 하락 원인을 분석합니다. 최근 7일간 데이터를 보면 클릭당 비용(CPC)은 유지되나 전환율이 12% 감소했습니다. 랜딩페이지 이탈률 증가나 타겟 피로도가 원인일 수 있습니다.',
            category: ChatIntent.KPI_ANALYSIS,
          },
          {
            role: 'user',
            content: 'CTR이 1% 미만으로 떨어졌어. 클릭률 개선 방법 알려줘.',
            category: ChatIntent.KPI_ANALYSIS,
          },
        ],
      ],
      [
        ChatIntent.PIXEL_SETUP,
        [
          {
            role: 'user',
            content: '카페24 쇼핑몰에 Meta 픽셀 설치하고 싶어요.',
            category: ChatIntent.PIXEL_SETUP,
          },
          {
            role: 'assistant',
            content:
              '카페24 쇼핑몰에 Meta 픽셀을 설치하겠습니다. 먼저 Meta 비즈니스 계정과 연동 후, 카페24 앱스토어를 통해 원클릭 설치가 가능합니다. 픽셀 ID를 알려주세요.',
            category: ChatIntent.PIXEL_SETUP,
          },
          {
            role: 'user',
            content: '픽셀이 제대로 작동하는지 확인하는 방법은?',
            category: ChatIntent.PIXEL_SETUP,
          },
        ],
      ],
      [
        ChatIntent.BUDGET_OPTIMIZATION,
        [
          {
            role: 'user',
            content: '월 광고비 200만원을 어떻게 배분하면 효율적일까요?',
            category: ChatIntent.BUDGET_OPTIMIZATION,
          },
          {
            role: 'assistant',
            content:
              '월 200만원 예산 최적 배분 방안입니다. 인지도 캠페인 20%(40만원), 리타겟팅 40%(80만원), 전환 캠페인 40%(80만원)를 권장합니다. 업종과 시즌에 따라 조정이 필요합니다.',
            category: ChatIntent.BUDGET_OPTIMIZATION,
          },
          {
            role: 'user',
            content: '성과가 낮은 광고세트 예산을 줄이고 싶어. 자동으로 조정해줄 수 있어?',
            category: ChatIntent.BUDGET_OPTIMIZATION,
          },
        ],
      ],
      [
        ChatIntent.GENERAL,
        [
          {
            role: 'user',
            content: '바투 AI가 어떤 기능을 제공하나요?',
            category: ChatIntent.GENERAL,
          },
          {
            role: 'assistant',
            content:
              '바투 AI는 Meta 광고 캠페인 자동화, KPI 대시보드, 주간 성과 보고서 생성, 예산 최적화 추천 기능을 제공합니다. 더 궁금한 기능이 있으시면 질문해 주세요.',
            category: ChatIntent.GENERAL,
          },
          {
            role: 'user',
            content: '무료 체험 기간이 있나요?',
            category: ChatIntent.GENERAL,
          },
        ],
      ],
    ])
  }

  getExamples(intent: ChatIntent): FewShotExample[] {
    return this.examples.get(intent) ?? this.examples.get(ChatIntent.GENERAL) ?? []
  }

  getAllExamples(): FewShotExample[] {
    const all: FewShotExample[] = []
    for (const examples of this.examples.values()) {
      all.push(...examples)
    }
    return all
  }
}
