/**
 * Chat Assistant Prompts — 2026 알고리즘 정렬 테스트
 *
 * Phase 1: 시스템 프롬프트에 Meta Trinity 기반 진단 원칙 포함 여부
 * Phase 2: 응답 템플릿의 2026 알고리즘 기반 업데이트 검증
 */
import { describe, it, expect } from 'vitest'
import {
    CHAT_ASSISTANT_SYSTEM_PROMPT,
    ROAS_IMPROVEMENT_TEMPLATE,
    SCALING_TEMPLATE,
    QUERY_PATTERNS,
    buildQueryClassificationPrompt,
} from '@infrastructure/external/openai/prompts/chatAssistant'
import { ChatIntent } from '@domain/value-objects/ChatIntent'

// ============================================================================
// Phase 1: 시스템 프롬프트 2026 알고리즘 정렬
// ============================================================================

describe('CHAT_ASSISTANT_SYSTEM_PROMPT — 2026 Meta Trinity 정렬', () => {
    describe('Meta Trinity 진단 프레임워크', () => {
        it('GEM 관련 개념을 포함해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/GEM/i)
        })

        it('Lattice 관련 개념을 포함해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/Lattice/i)
        })

        it('Andromeda 관련 개념을 포함해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/Andromeda/i)
        })
    })

    describe('학습 단계(Learning Phase) 수치 기준', () => {
        it('주 50회 전환 데이터 필수 조건을 언급해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/50회/)
        })

        it('학습 단계(Learning Phase) 개념을 포함해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/학습\s*단계/)
        })
    })

    describe('광고 피로도 수치 기준', () => {
        it('빈도 3.5회 임계치를 언급해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/3\.5회/)
        })

        it('광고 피로도(Creative Fatigue) 개념을 포함해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/피로도/)
        })
    })

    describe('크리에이티브 = 타겟팅 원칙', () => {
        it('Entity ID 개념을 포함해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/Entity\s*ID/i)
        })

        it('시각적 다양성 원칙을 포함해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/시각적\s*다양성/)
        })

        it('광범위 타겟팅(Broad Targeting) 원칙을 포함해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/광범위\s*타겟팅/)
        })
    })

    describe('스케일링 원칙', () => {
        it('10~20% 점진적 스케일업 원칙을 포함해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/10.{0,5}20%/)
        })

        it('Advantage+ 관련 개념을 포함해야 한다', () => {
            expect(CHAT_ASSISTANT_SYSTEM_PROMPT).toMatch(/Advantage\+?/i)
        })
    })
})

// ============================================================================
// Phase 2: 응답 템플릿 2026 기반 업데이트
// ============================================================================

describe('ROAS_IMPROVEMENT_TEMPLATE — 2026 업데이트', () => {
    it('구시대적 "룩어라이크 오디언스" 조언을 포함하지 않아야 한다', () => {
        expect(ROAS_IMPROVEMENT_TEMPLATE.message).not.toMatch(/룩어라이크/)
    })

    it('Entity ID 또는 소재 다양성 관련 조언을 포함해야 한다', () => {
        expect(ROAS_IMPROVEMENT_TEMPLATE.message).toMatch(/Entity\s*ID|소재\s*다양성|시각적/)
    })

    it('구조 단순화 또는 예산 통합 권고를 포함해야 한다', () => {
        expect(ROAS_IMPROVEMENT_TEMPLATE.message).toMatch(/구조\s*단순화|예산\s*통합|캠페인\s*통합/)
    })

    it('광범위 타겟팅 권고를 포함해야 한다', () => {
        expect(ROAS_IMPROVEMENT_TEMPLATE.message).toMatch(/광범위\s*타겟팅|Broad/)
    })

    it('가치 기반 입찰 조언을 포함해야 한다', () => {
        expect(ROAS_IMPROVEMENT_TEMPLATE.message).toMatch(/가치\s*기반\s*입찰|ROAS\s*목표|목표\s*ROAS/)
    })
})

describe('SCALING_TEMPLATE — 2026 업데이트', () => {
    it('스케일링 비율이 10~20%로 명시되어야 한다', () => {
        expect(SCALING_TEMPLATE.message).toMatch(/10.{0,5}20%/)
    })

    it('안정화 기간(Stabilization Window) 개념을 포함해야 한다', () => {
        expect(SCALING_TEMPLATE.message).toMatch(/안정화\s*기간|Stabilization/)
    })

    it('구시대적 "타겟 오디언스 포화도" 기준을 포함하지 않아야 한다', () => {
        expect(SCALING_TEMPLATE.message).not.toMatch(/포화도\s*50%/)
    })

    it('구시대적 "룩어라이크 1-3%" 조언을 포함하지 않아야 한다', () => {
        expect(SCALING_TEMPLATE.message).not.toMatch(/룩어라이크\s*1.{0,3}3%/)
    })

    it('Entity ID 다양성 또는 소재 다양성 기반 확장 조건을 포함해야 한다', () => {
        expect(SCALING_TEMPLATE.message).toMatch(/Entity\s*ID|소재\s*다양성|크리에이티브\s*다양성/)
    })
})

// ============================================================================
// Phase 3: ChatIntent 확장 및 질문 분류기 업데이트
// ============================================================================

describe('ChatIntent — 2026 신규 인텐트 추가', () => {
    it('기존 6개 인텐트가 유지되어야 한다', () => {
        expect(ChatIntent.CAMPAIGN_CREATION).toBe('CAMPAIGN_CREATION')
        expect(ChatIntent.REPORT_QUERY).toBe('REPORT_QUERY')
        expect(ChatIntent.KPI_ANALYSIS).toBe('KPI_ANALYSIS')
        expect(ChatIntent.PIXEL_SETUP).toBe('PIXEL_SETUP')
        expect(ChatIntent.BUDGET_OPTIMIZATION).toBe('BUDGET_OPTIMIZATION')
        expect(ChatIntent.GENERAL).toBe('GENERAL')
    })

    it('CREATIVE_FATIGUE 인텐트가 존재해야 한다', () => {
        expect(ChatIntent.CREATIVE_FATIGUE).toBe('CREATIVE_FATIGUE')
    })

    it('LEARNING_PHASE 인텐트가 존재해야 한다', () => {
        expect(ChatIntent.LEARNING_PHASE).toBe('LEARNING_PHASE')
    })

    it('STRUCTURE_OPTIMIZATION 인텐트가 존재해야 한다', () => {
        expect(ChatIntent.STRUCTURE_OPTIMIZATION).toBe('STRUCTURE_OPTIMIZATION')
    })

    it('LEAD_QUALITY 인텐트가 존재해야 한다', () => {
        expect(ChatIntent.LEAD_QUALITY).toBe('LEAD_QUALITY')
    })

    it('TRACKING_HEALTH 인텐트가 존재해야 한다', () => {
        expect(ChatIntent.TRACKING_HEALTH).toBe('TRACKING_HEALTH')
    })
})

describe('buildQueryClassificationPrompt — 14개 카테고리', () => {
    const prompt = buildQueryClassificationPrompt('테스트 메시지')

    it('기존 9개 카테고리를 포함해야 한다', () => {
        expect(prompt).toMatch(/roas_analysis/)
        expect(prompt).toMatch(/scaling/)
        expect(prompt).toMatch(/budget_allocation/)
        expect(prompt).toMatch(/campaign_stop/)
        expect(prompt).toMatch(/creative_performance/)
        expect(prompt).toMatch(/targeting/)
        expect(prompt).toMatch(/competitor/)
        expect(prompt).toMatch(/seasonal/)
        expect(prompt).toMatch(/general/)
    })

    it('learning_phase 카테고리를 포함해야 한다', () => {
        expect(prompt).toMatch(/learning_phase/)
    })

    it('creative_fatigue 카테고리를 포함해야 한다', () => {
        expect(prompt).toMatch(/creative_fatigue/)
    })

    it('campaign_structure 카테고리를 포함해야 한다', () => {
        expect(prompt).toMatch(/campaign_structure/)
    })

    it('lead_quality 카테고리를 포함해야 한다', () => {
        expect(prompt).toMatch(/lead_quality/)
    })

    it('tracking_health 카테고리를 포함해야 한다', () => {
        expect(prompt).toMatch(/tracking_health/)
    })
})

describe('QUERY_PATTERNS — 2026 신규 패턴', () => {
    it('creativeFatigue 패턴이 존재해야 한다', () => {
        expect(QUERY_PATTERNS.creativeFatigue).toBeDefined()
        expect(QUERY_PATTERNS.creativeFatigue.keywords).toEqual(
            expect.arrayContaining(['피로도', '피로'])
        )
    })

    it('learningPhase 패턴이 존재해야 한다', () => {
        expect(QUERY_PATTERNS.learningPhase).toBeDefined()
        expect(QUERY_PATTERNS.learningPhase.keywords).toEqual(
            expect.arrayContaining(['학습', '소진'])
        )
    })

    it('campaignStructure 패턴이 존재해야 한다', () => {
        expect(QUERY_PATTERNS.campaignStructure).toBeDefined()
        expect(QUERY_PATTERNS.campaignStructure.keywords).toEqual(
            expect.arrayContaining(['구조', '통합'])
        )
    })

    it('leadQuality 패턴이 존재해야 한다', () => {
        expect(QUERY_PATTERNS.leadQuality).toBeDefined()
        expect(QUERY_PATTERNS.leadQuality.keywords).toEqual(
            expect.arrayContaining(['리드', '허수'])
        )
    })

    it('trackingHealth 패턴이 존재해야 한다', () => {
        expect(QUERY_PATTERNS.trackingHealth).toBeDefined()
        expect(QUERY_PATTERNS.trackingHealth.keywords).toEqual(
            expect.arrayContaining(['CAPI', 'EMQ'])
        )
    })
})
