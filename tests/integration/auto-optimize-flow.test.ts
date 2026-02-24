/**
 * 자동 최적화 규칙 API 통합 플로우 테스트 (Phase 3 RED)
 *
 * UseCase 조합 흐름을 Mock Repository 기반으로 검증.
 * 실제 DB 연결 없이 비즈니스 플로우의 end-to-end 동작을 확인한다.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MockOptimizationRuleRepository } from '@tests/mocks/repositories/MockOptimizationRuleRepository'
import { MockCampaignRepository } from '@tests/mocks/repositories/MockCampaignRepository'
import { MockKPIRepository } from '@tests/mocks/repositories/MockKPIRepository'
import { CreateOptimizationRuleUseCase } from '@application/use-cases/optimization/CreateOptimizationRuleUseCase'
import { ListOptimizationRulesUseCase } from '@application/use-cases/optimization/ListOptimizationRulesUseCase'
import { UpdateOptimizationRuleUseCase } from '@application/use-cases/optimization/UpdateOptimizationRuleUseCase'
import { DeleteOptimizationRuleUseCase } from '@application/use-cases/optimization/DeleteOptimizationRuleUseCase'
import { EvaluateOptimizationRulesUseCase } from '@application/use-cases/optimization/EvaluateOptimizationRulesUseCase'
import { AutoOptimizeCampaignUseCase } from '@application/use-cases/optimization/AutoOptimizeCampaignUseCase'
import { OptimizationRule } from '@domain/entities/OptimizationRule'
import { Campaign } from '@domain/entities/Campaign'
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

// ─── 테스트 픽스처 ─────────────────────────────────────────────────────────────

const USER_ID = 'flow-test-user'
const CAMPAIGN_ID = 'flow-test-campaign'

const makeCampaign = (status = CampaignStatus.ACTIVE) =>
  Campaign.restore({
    id: CAMPAIGN_ID,
    userId: USER_ID,
    name: '통합 테스트 캠페인',
    objective: CampaignObjective.CONVERSIONS,
    status,
    dailyBudget: Money.create(100000, 'KRW'),
    startDate: new Date('2025-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
  })

// CPA = spend / conversions = 50000 / 2 = 25000 > 15000 → CPA_THRESHOLD 조건 충족
const makeKPI = () =>
  KPI.create({
    campaignId: CAMPAIGN_ID,
    impressions: 1000,
    clicks: 50,
    linkClicks: 40,
    conversions: 2,
    spend: Money.create(50000, 'KRW'),
    revenue: Money.create(80000, 'KRW'),
    date: new Date(),
  })

// ─── 테스트 스위트 ─────────────────────────────────────────────────────────────

describe('자동 최적화 규칙 API 통합 플로우', () => {
  let ruleRepository: MockOptimizationRuleRepository
  let campaignRepository: MockCampaignRepository
  let kpiRepository: MockKPIRepository
  let createUseCase: CreateOptimizationRuleUseCase
  let listUseCase: ListOptimizationRulesUseCase
  let updateUseCase: UpdateOptimizationRuleUseCase
  let deleteUseCase: DeleteOptimizationRuleUseCase
  let evaluateUseCase: EvaluateOptimizationRulesUseCase
  let mockAutoOptimize: { execute: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    ruleRepository = new MockOptimizationRuleRepository()
    campaignRepository = new MockCampaignRepository()
    kpiRepository = new MockKPIRepository()

    createUseCase = new CreateOptimizationRuleUseCase(ruleRepository)
    listUseCase = new ListOptimizationRulesUseCase(ruleRepository)
    updateUseCase = new UpdateOptimizationRuleUseCase(ruleRepository)
    deleteUseCase = new DeleteOptimizationRuleUseCase(ruleRepository)

    mockAutoOptimize = {
      execute: vi.fn().mockResolvedValue({
        actionType: 'PAUSE_CAMPAIGN',
        estimatedSavings: 50000,
      }),
    }

    evaluateUseCase = new EvaluateOptimizationRulesUseCase(
      ruleRepository,
      campaignRepository,
      kpiRepository,
      mockAutoOptimize as unknown as AutoOptimizeCampaignUseCase
    )
  })

  describe('규칙 CRUD 조합 플로우', () => {
    it('should_include_created_rule_when_listing_after_creation', async () => {
      // 규칙 생성
      const created = await createUseCase.execute({
        campaignId: CAMPAIGN_ID,
        userId: USER_ID,
        name: 'CPA 상한 초과 시 일시중지',
        ruleType: 'CPA_THRESHOLD',
        conditions: [{ metric: 'cpa', operator: 'gt', value: 15000 }],
        actions: [{ type: 'PAUSE_CAMPAIGN' }],
      })

      // 목록 조회
      const rules = await listUseCase.execute({ userId: USER_ID, campaignId: CAMPAIGN_ID })

      // 생성된 규칙이 목록에 포함되어야 함
      expect(rules).toHaveLength(1)
      expect(rules[0].id).toBe(created.id)
      expect(rules[0].name).toBe('CPA 상한 초과 시 일시중지')
    })

    it('should_reflect_updated_name_when_listing_after_update', async () => {
      // 규칙 생성
      const created = await createUseCase.execute({
        campaignId: CAMPAIGN_ID,
        userId: USER_ID,
        name: '원래 이름',
        ruleType: 'ROAS_FLOOR',
        conditions: [{ metric: 'roas', operator: 'lt', value: 1.0 }],
        actions: [{ type: 'REDUCE_BUDGET', params: { percentage: 30 } }],
      })

      // 이름 수정
      await updateUseCase.execute({
        ruleId: created.id,
        userId: USER_ID,
        name: '수정된 이름',
      })

      // 목록 조회 후 수정 내용 반영 확인
      const rules = await listUseCase.execute({ userId: USER_ID })
      expect(rules).toHaveLength(1)
      expect(rules[0].name).toBe('수정된 이름')
    })

    it('should_remove_rule_from_list_when_deleted', async () => {
      // 규칙 생성
      const created = await createUseCase.execute({
        campaignId: CAMPAIGN_ID,
        userId: USER_ID,
        name: '삭제될 규칙',
        ruleType: 'BUDGET_PACE',
        conditions: [{ metric: 'spend_pace', operator: 'gt', value: 120 }],
        actions: [{ type: 'ALERT_ONLY', params: { notifyChannel: 'in_app' } }],
      })

      // 생성 후 목록에 존재 확인
      const beforeDelete = await listUseCase.execute({ userId: USER_ID })
      expect(beforeDelete).toHaveLength(1)

      // 삭제
      await deleteUseCase.execute({ ruleId: created.id, userId: USER_ID })

      // 삭제 후 목록에서 제거 확인
      const afterDelete = await listUseCase.execute({ userId: USER_ID })
      expect(afterDelete).toHaveLength(0)
    })

    it('should_return_only_own_rules_when_listing_by_userId', async () => {
      // 두 사용자의 규칙 생성
      await createUseCase.execute({
        campaignId: CAMPAIGN_ID,
        userId: USER_ID,
        name: '내 규칙',
        ruleType: 'CPA_THRESHOLD',
        conditions: [{ metric: 'cpa', operator: 'gt', value: 15000 }],
        actions: [{ type: 'PAUSE_CAMPAIGN' }],
      })
      await createUseCase.execute({
        campaignId: 'other-campaign',
        userId: 'other-user',
        name: '다른 사용자 규칙',
        ruleType: 'ROAS_FLOOR',
        conditions: [{ metric: 'roas', operator: 'lt', value: 1.0 }],
        actions: [{ type: 'REDUCE_BUDGET', params: { percentage: 30 } }],
      })

      // userId로 필터링 시 본인 규칙만 반환
      const rules = await listUseCase.execute({ userId: USER_ID })
      expect(rules).toHaveLength(1)
      expect(rules[0].userId).toBe(USER_ID)
    })
  })

  describe('프리셋 플로우', () => {
    it('should_return_3_presets_when_ecommerce_presets_generated', () => {
      // 이커머스 프리셋 생성
      const presets = OptimizationRule.ecommercePresets(CAMPAIGN_ID, USER_ID)

      // 3개 프리셋 반환 확인
      expect(presets).toHaveLength(3)
      expect(presets[0].ruleType).toBe('CPA_THRESHOLD')
      expect(presets[1].ruleType).toBe('ROAS_FLOOR')
      expect(presets[2].ruleType).toBe('BUDGET_PACE')
    })

    it('should_save_all_presets_and_list_them_when_presets_stored', async () => {
      // 프리셋 생성 후 저장
      const presets = OptimizationRule.ecommercePresets(CAMPAIGN_ID, USER_ID)
      for (const preset of presets) {
        await ruleRepository.save(preset)
      }

      // 목록 조회 시 3개 모두 반환
      const rules = await listUseCase.execute({ userId: USER_ID, campaignId: CAMPAIGN_ID })
      expect(rules).toHaveLength(3)
      const ruleTypes = rules.map(r => r.ruleType)
      expect(ruleTypes).toContain('CPA_THRESHOLD')
      expect(ruleTypes).toContain('ROAS_FLOOR')
      expect(ruleTypes).toContain('BUDGET_PACE')
    })
  })

  describe('평가 플로우', () => {
    it('should_trigger_action_when_rule_created_and_condition_met', async () => {
      // 규칙 생성 (CPA > 1 → 항상 트리거)
      await createUseCase.execute({
        campaignId: CAMPAIGN_ID,
        userId: USER_ID,
        name: 'CPA 상한',
        ruleType: 'CPA_THRESHOLD',
        conditions: [{ metric: 'cpa', operator: 'gt', value: 1 }],
        actions: [{ type: 'PAUSE_CAMPAIGN' }],
        cooldownMinutes: 0,
      })

      // 캠페인 + KPI 세팅
      await campaignRepository.save(makeCampaign())
      await kpiRepository.save(makeKPI())

      // 평가 실행
      const result = await evaluateUseCase.execute()

      // 조건 충족 → 트리거 확인
      expect(result.evaluatedCount).toBe(1)
      expect(result.triggeredCount).toBe(1)
      expect(result.actions[0].actionType).toBe('PAUSE_CAMPAIGN')
    })

    it('should_return_zero_evaluatedCount_when_no_enabled_rules_exist', async () => {
      // 활성 규칙 없이 평가
      const result = await evaluateUseCase.execute()

      // 평가 대상 없음
      expect(result.evaluatedCount).toBe(0)
      expect(result.triggeredCount).toBe(0)
      expect(result.actions).toHaveLength(0)
    })

    it('should_increment_triggerCount_after_rule_fires', async () => {
      // 규칙 생성 후 평가
      const created = await createUseCase.execute({
        campaignId: CAMPAIGN_ID,
        userId: USER_ID,
        name: 'CPA 상한',
        ruleType: 'CPA_THRESHOLD',
        conditions: [{ metric: 'cpa', operator: 'gt', value: 1 }],
        actions: [{ type: 'PAUSE_CAMPAIGN' }],
        cooldownMinutes: 0,
      })
      await campaignRepository.save(makeCampaign())
      await kpiRepository.save(makeKPI())

      await evaluateUseCase.execute()

      // triggerCount가 0 → 1로 증가
      const updated = await ruleRepository.findById(created.id)
      expect(updated?.triggerCount).toBe(1)
      expect(updated?.lastTriggeredAt).not.toBeNull()
    })
  })
})
