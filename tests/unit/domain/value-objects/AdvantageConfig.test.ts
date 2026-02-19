import { describe, it, expect } from 'vitest'
import { AdvantageConfig } from '@domain/value-objects/AdvantageConfig'

describe('AdvantageConfig', () => {
  describe('create', () => {
    it('should create AdvantageConfig with all levers enabled', () => {
      const config = AdvantageConfig.create({
        advantageBudget: true,
        advantageAudience: true,
        advantagePlacement: true,
      })

      expect(config.advantageBudget).toBe(true)
      expect(config.advantageAudience).toBe(true)
      expect(config.advantagePlacement).toBe(true)
    })

    it('should create AdvantageConfig with all levers disabled', () => {
      const config = AdvantageConfig.create({
        advantageBudget: false,
        advantageAudience: false,
        advantagePlacement: false,
      })

      expect(config.advantageBudget).toBe(false)
      expect(config.advantageAudience).toBe(false)
      expect(config.advantagePlacement).toBe(false)
    })

    it('should create AdvantageConfig with mixed levers', () => {
      const config = AdvantageConfig.create({
        advantageBudget: true,
        advantageAudience: false,
        advantagePlacement: true,
      })

      expect(config.advantageBudget).toBe(true)
      expect(config.advantageAudience).toBe(false)
      expect(config.advantagePlacement).toBe(true)
    })
  })

  describe('isAdvantagePlus', () => {
    it('should return true when all three levers are enabled', () => {
      const config = AdvantageConfig.create({
        advantageBudget: true,
        advantageAudience: true,
        advantagePlacement: true,
      })

      expect(config.isAdvantagePlus()).toBe(true)
    })

    it('should return false when any lever is disabled', () => {
      const config1 = AdvantageConfig.create({
        advantageBudget: false,
        advantageAudience: true,
        advantagePlacement: true,
      })
      expect(config1.isAdvantagePlus()).toBe(false)

      const config2 = AdvantageConfig.create({
        advantageBudget: true,
        advantageAudience: false,
        advantagePlacement: true,
      })
      expect(config2.isAdvantagePlus()).toBe(false)

      const config3 = AdvantageConfig.create({
        advantageBudget: true,
        advantageAudience: true,
        advantagePlacement: false,
      })
      expect(config3.isAdvantagePlus()).toBe(false)
    })

    it('should return false when all levers are disabled', () => {
      const config = AdvantageConfig.create({
        advantageBudget: false,
        advantageAudience: false,
        advantagePlacement: false,
      })

      expect(config.isAdvantagePlus()).toBe(false)
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const config = AdvantageConfig.create({
        advantageBudget: true,
        advantageAudience: false,
        advantagePlacement: true,
      })

      const json = config.toJSON()

      expect(json).toEqual({
        advantageBudget: true,
        advantageAudience: false,
        advantagePlacement: true,
      })
    })
  })
})
