/**
 * accountStatus 헬퍼 유틸리티 단위 테스트
 */
import { describe, it, expect } from 'vitest'
import {
  getStatusLabel,
  getStatusColor,
  getStatusDotColor,
  isActiveAccount,
  sortByStatus,
} from '@/presentation/utils/accountStatus'

describe('getStatusLabel', () => {
  it('status 1 → "운영 중"', () => {
    expect(getStatusLabel(1)).toBe('운영 중')
  })

  it('status 2 → "비활성"', () => {
    expect(getStatusLabel(2)).toBe('비활성')
  })

  it('status 3 → "미결제"', () => {
    expect(getStatusLabel(3)).toBe('미결제')
  })

  it('status 101 → "폐쇄됨"', () => {
    expect(getStatusLabel(101)).toBe('폐쇄됨')
  })

  it('알 수 없는 status → "알 수 없음"', () => {
    expect(getStatusLabel(999)).toBe('알 수 없음')
  })
})

describe('getStatusColor', () => {
  it('활성 계정은 green 계열', () => {
    expect(getStatusColor(1)).toContain('green')
  })

  it('비활성 계정은 red 계열', () => {
    expect(getStatusColor(2)).toContain('red')
  })

  it('미결제 계정은 amber 계열', () => {
    expect(getStatusColor(3)).toContain('amber')
  })

  it('알 수 없는 status는 muted', () => {
    expect(getStatusColor(999)).toContain('muted')
  })
})

describe('getStatusDotColor', () => {
  it('활성 계정은 bg-green-500', () => {
    expect(getStatusDotColor(1)).toBe('bg-green-500')
  })

  it('비활성 계정은 bg-red-500', () => {
    expect(getStatusDotColor(2)).toBe('bg-red-500')
  })
})

describe('isActiveAccount', () => {
  it('status 1 → true', () => {
    expect(isActiveAccount(1)).toBe(true)
  })

  it('status 201 → true', () => {
    expect(isActiveAccount(201)).toBe(true)
  })

  it('status 2 → false', () => {
    expect(isActiveAccount(2)).toBe(false)
  })

  it('status 3 → false', () => {
    expect(isActiveAccount(3)).toBe(false)
  })

  it('status 101 → false', () => {
    expect(isActiveAccount(101)).toBe(false)
  })

  it('알 수 없는 status → false', () => {
    expect(isActiveAccount(999)).toBe(false)
  })
})

describe('sortByStatus', () => {
  it('활성 계정이 상단에 정렬됨', () => {
    const accounts = [
      { id: 'act_1', accountStatus: 2 },
      { id: 'act_2', accountStatus: 1 },
      { id: 'act_3', accountStatus: 3 },
      { id: 'act_4', accountStatus: 201 },
    ]
    const sorted = sortByStatus(accounts)
    expect(sorted[0].id).toBe('act_2')
    expect(sorted[1].id).toBe('act_4')
    expect(sorted[2].id).toBe('act_1')
    expect(sorted[3].id).toBe('act_3')
  })

  it('원본 배열을 변경하지 않음', () => {
    const accounts = [
      { id: 'act_1', accountStatus: 2 },
      { id: 'act_2', accountStatus: 1 },
    ]
    sortByStatus(accounts)
    expect(accounts[0].id).toBe('act_1')
  })

  it('빈 배열 → 빈 배열', () => {
    expect(sortByStatus([])).toEqual([])
  })
})
