import { describe, it, expect } from 'vitest'
import {
  CAMPAIGN_TEMPLATES,
  getCampaignTemplate,
  getAllCampaignTemplates,
  CampaignTemplateId,
} from '@domain/value-objects/CampaignTemplate'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

describe('CampaignTemplate', () => {
  describe('CAMPAIGN_TEMPLATES', () => {
    it('should have at least 3 predefined templates', () => {
      expect(Object.keys(CAMPAIGN_TEMPLATES).length).toBeGreaterThanOrEqual(3)
    })

    it('should have traffic template with correct objective', () => {
      const trafficTemplate = CAMPAIGN_TEMPLATES.traffic
      expect(trafficTemplate).toBeDefined()
      expect(trafficTemplate.objective).toBe(CampaignObjective.TRAFFIC)
    })

    it('should have conversions template with correct objective', () => {
      const conversionsTemplate = CAMPAIGN_TEMPLATES.conversions
      expect(conversionsTemplate).toBeDefined()
      expect(conversionsTemplate.objective).toBe(CampaignObjective.CONVERSIONS)
    })

    it('should have awareness template with correct objective', () => {
      const awarenessTemplate = CAMPAIGN_TEMPLATES.awareness
      expect(awarenessTemplate).toBeDefined()
      expect(awarenessTemplate.objective).toBe(CampaignObjective.AWARENESS)
    })

    it('each template should have required properties', () => {
      Object.values(CAMPAIGN_TEMPLATES).forEach((template) => {
        expect(template.id).toBeDefined()
        expect(template.name).toBeDefined()
        expect(template.description).toBeDefined()
        expect(template.objective).toBeDefined()
        expect(template.suggestedDailyBudget).toBeDefined()
        expect(template.suggestedDailyBudget).toBeGreaterThan(0)
        expect(template.icon).toBeDefined()
        expect(template.category).toBeDefined()
      })
    })
  })

  describe('getCampaignTemplate', () => {
    it('should return traffic template by id', () => {
      const template = getCampaignTemplate('traffic')
      expect(template).toBeDefined()
      expect(template?.id).toBe('traffic')
    })

    it('should return conversions template by id', () => {
      const template = getCampaignTemplate('conversions')
      expect(template).toBeDefined()
      expect(template?.id).toBe('conversions')
    })

    it('should return undefined for invalid template id', () => {
      const template = getCampaignTemplate('invalid' as CampaignTemplateId)
      expect(template).toBeUndefined()
    })
  })

  describe('getAllCampaignTemplates', () => {
    it('should return array of all templates', () => {
      const templates = getAllCampaignTemplates()
      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThanOrEqual(3)
    })

    it('should include all template categories', () => {
      const templates = getAllCampaignTemplates()
      const categories = templates.map((t) => t.category)
      expect(categories).toContain('트래픽')
      expect(categories).toContain('전환')
      expect(categories).toContain('인지도')
    })
  })

  describe('template structure', () => {
    it('traffic template should have appropriate suggested audience', () => {
      const template = CAMPAIGN_TEMPLATES.traffic
      expect(template.suggestedTargetAudience).toBeDefined()
      expect(template.suggestedTargetAudience.ageMin).toBeGreaterThanOrEqual(18)
      expect(template.suggestedTargetAudience.ageMax).toBeLessThanOrEqual(65)
    })

    it('conversions template should have higher suggested budget', () => {
      const trafficTemplate = CAMPAIGN_TEMPLATES.traffic
      const conversionsTemplate = CAMPAIGN_TEMPLATES.conversions
      expect(conversionsTemplate.suggestedDailyBudget).toBeGreaterThanOrEqual(
        trafficTemplate.suggestedDailyBudget
      )
    })

    it('each template should have valid tips', () => {
      Object.values(CAMPAIGN_TEMPLATES).forEach((template) => {
        expect(Array.isArray(template.tips)).toBe(true)
        expect(template.tips.length).toBeGreaterThan(0)
      })
    })
  })
})
