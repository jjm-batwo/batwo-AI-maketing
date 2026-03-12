import { describe, it, expect } from 'vitest'
import { DashboardLayout } from '@domain/entities/DashboardLayout'
import {
  DEFAULT_WIDGETS,
  MAX_WIDGETS,
  type DashboardWidget,
} from '@domain/value-objects/DashboardWidget'

describe('DashboardLayout', () => {
  const userId = 'user-123'

  describe('create', () => {
    it('기본 위젯으로 생성되어야 한다', () => {
      const layout = DashboardLayout.create({ userId, name: '내 대시보드' })

      expect(layout.id).toBeDefined()
      expect(layout.userId).toBe(userId)
      expect(layout.name).toBe('내 대시보드')
      expect(layout.widgets).toEqual(DEFAULT_WIDGETS)
      expect(layout.isDefault).toBe(true)
      expect(layout.createdAt).toBeInstanceOf(Date)
      expect(layout.updatedAt).toBeInstanceOf(Date)
    })

    it('커스텀 위젯으로 생성할 수 있다', () => {
      const widgets: DashboardWidget[] = [
        { id: 'w1', type: 'kpi_card', position: { x: 0, y: 0, w: 6, h: 2 }, config: { metric: 'roas' } },
      ]

      const layout = DashboardLayout.create({ userId, name: '커스텀', widgets })

      expect(layout.widgets).toEqual(widgets)
      expect(layout.widgetCount).toBe(1)
    })

    it('이름이 비어있으면 에러가 발생한다', () => {
      expect(() => DashboardLayout.create({ userId, name: '' }))
        .toThrow('레이아웃 이름은 필수입니다')
    })

    it('이름이 공백만이면 에러가 발생한다', () => {
      expect(() => DashboardLayout.create({ userId, name: '   ' }))
        .toThrow('레이아웃 이름은 필수입니다')
    })

    it('이름이 100자를 초과하면 에러가 발생한다', () => {
      const longName = 'a'.repeat(101)
      expect(() => DashboardLayout.create({ userId, name: longName }))
        .toThrow('레이아웃 이름은 100자 이하여야 합니다')
    })

    it('이름의 앞뒤 공백이 제거된다', () => {
      const layout = DashboardLayout.create({ userId, name: '  트리밍 테스트  ' })
      expect(layout.name).toBe('트리밍 테스트')
    })
  })

  describe('restore', () => {
    it('저장된 속성으로 복원할 수 있다', () => {
      const now = new Date()
      const layout = DashboardLayout.restore({
        id: 'layout-1',
        userId,
        name: '복원 레이아웃',
        widgets: DEFAULT_WIDGETS,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      })

      expect(layout.id).toBe('layout-1')
      expect(layout.name).toBe('복원 레이아웃')
      expect(layout.isDefault).toBe(false)
    })
  })

  describe('updateWidgets', () => {
    it('위젯을 업데이트할 수 있다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트' })
      const newWidgets: DashboardWidget[] = [
        { id: 'w1', type: 'kpi_card', position: { x: 0, y: 0, w: 6, h: 2 }, config: { metric: 'ctr' } },
      ]

      const updated = layout.updateWidgets(newWidgets)

      expect(updated.widgets).toEqual(newWidgets)
      expect(updated.id).toBe(layout.id) // 같은 ID 유지
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(layout.updatedAt.getTime())
    })

    it('20개를 초과하면 에러가 발생한다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트' })
      const tooManyWidgets: DashboardWidget[] = Array.from({ length: MAX_WIDGETS + 1 }, (_, i) => ({
        id: `w${i}`,
        type: 'kpi_card' as const,
        position: { x: (i * 3) % 12, y: Math.floor(i / 4) * 2, w: 3, h: 2 },
        config: { metric: 'roas' },
      }))

      expect(() => layout.updateWidgets(tooManyWidgets))
        .toThrow(`위젯은 최대 ${MAX_WIDGETS}개까지 추가 가능합니다`)
    })

    it('위젯 ID가 중복되면 에러가 발생한다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트' })
      const duplicateWidgets: DashboardWidget[] = [
        { id: 'w1', type: 'kpi_card', position: { x: 0, y: 0, w: 3, h: 2 }, config: {} },
        { id: 'w1', type: 'kpi_chart', position: { x: 3, y: 0, w: 3, h: 2 }, config: {} },
      ]

      expect(() => layout.updateWidgets(duplicateWidgets))
        .toThrow('위젯 ID가 중복됩니다')
    })

    it('유효하지 않은 위젯 타입이면 에러가 발생한다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트' })
      const invalidWidgets = [
        { id: 'w1', type: 'invalid_type' as any, position: { x: 0, y: 0, w: 3, h: 2 }, config: {} },
      ]

      expect(() => layout.updateWidgets(invalidWidgets))
        .toThrow('유효하지 않은 위젯 타입입니다')
    })

    it('유효하지 않은 위치이면 에러가 발생한다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트' })
      const invalidWidgets: DashboardWidget[] = [
        { id: 'w1', type: 'kpi_card', position: { x: -1, y: 0, w: 3, h: 2 }, config: {} },
      ]

      expect(() => layout.updateWidgets(invalidWidgets))
        .toThrow('유효하지 않은 위젯 위치입니다')
    })

    it('위젯 너비가 12를 초과하면 에러가 발생한다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트' })
      const invalidWidgets: DashboardWidget[] = [
        { id: 'w1', type: 'kpi_card', position: { x: 10, y: 0, w: 3, h: 2 }, config: {} },
      ]

      expect(() => layout.updateWidgets(invalidWidgets))
        .toThrow('유효하지 않은 위젯 위치입니다')
    })
  })

  describe('addWidget', () => {
    it('위젯을 추가할 수 있다', () => {
      const layout = DashboardLayout.create({
        userId,
        name: '테스트',
        widgets: [],
      })

      const newWidget: DashboardWidget = {
        id: 'new-w1',
        type: 'savings',
        position: { x: 0, y: 0, w: 4, h: 3 },
        config: {},
      }

      const updated = layout.addWidget(newWidget)
      expect(updated.widgetCount).toBe(1)
      expect(updated.widgets[0]).toEqual(newWidget)
    })

    it('유효하지 않은 위젯 타입을 추가하면 에러가 발생한다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트', widgets: [] })
      const badWidget = {
        id: 'bad',
        type: 'unknown' as any,
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {},
      }

      expect(() => layout.addWidget(badWidget)).toThrow('유효하지 않은 위젯 타입입니다')
    })
  })

  describe('removeWidget', () => {
    it('위젯을 제거할 수 있다', () => {
      const widgets: DashboardWidget[] = [
        { id: 'w1', type: 'kpi_card', position: { x: 0, y: 0, w: 3, h: 2 }, config: {} },
        { id: 'w2', type: 'kpi_chart', position: { x: 3, y: 0, w: 9, h: 4 }, config: {} },
      ]

      const layout = DashboardLayout.create({ userId, name: '테스트', widgets })
      const updated = layout.removeWidget('w1')

      expect(updated.widgetCount).toBe(1)
      expect(updated.widgets[0].id).toBe('w2')
    })

    it('존재하지 않는 위젯을 제거하면 에러가 발생한다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트' })

      expect(() => layout.removeWidget('nonexistent'))
        .toThrow('위젯을 찾을 수 없습니다')
    })
  })

  describe('rename', () => {
    it('이름을 변경할 수 있다', () => {
      const layout = DashboardLayout.create({ userId, name: '원본' })
      const renamed = layout.rename('변경된 이름')

      expect(renamed.name).toBe('변경된 이름')
      expect(renamed.id).toBe(layout.id)
    })

    it('빈 이름으로 변경 시 에러가 발생한다', () => {
      const layout = DashboardLayout.create({ userId, name: '원본' })

      expect(() => layout.rename('')).toThrow('레이아웃 이름은 필수입니다')
    })
  })

  describe('setDefault', () => {
    it('기본 레이아웃 여부를 변경할 수 있다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트' })
      expect(layout.isDefault).toBe(true)

      const updated = layout.setDefault(false)
      expect(updated.isDefault).toBe(false)
    })
  })

  describe('toJSON', () => {
    it('직렬화 가능한 객체를 반환한다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트' })
      const json = layout.toJSON()

      expect(json.id).toBe(layout.id)
      expect(json.userId).toBe(userId)
      expect(json.name).toBe('테스트')
      expect(json.widgets).toEqual(DEFAULT_WIDGETS)
      expect(json.isDefault).toBe(true)
      expect(json.createdAt).toBeInstanceOf(Date)
      expect(json.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('immutability', () => {
    it('widgets getter는 복사본을 반환한다', () => {
      const layout = DashboardLayout.create({ userId, name: '테스트' })
      const widgets = layout.widgets
      widgets.push({
        id: 'injected',
        type: 'kpi_card',
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: {},
      })

      expect(layout.widgetCount).toBe(DEFAULT_WIDGETS.length)
    })
  })
})
