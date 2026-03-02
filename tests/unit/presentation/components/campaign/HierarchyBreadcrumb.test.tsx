import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { HierarchyBreadcrumb } from '../../../../../src/presentation/components/campaign/HierarchyBreadcrumb'

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('lucide-react', () => ({
  ChevronRight: (props: React.SVGProps<SVGSVGElement>) => (
    <svg data-testid="chevron-right" {...props} />
  ),
}))

describe('HierarchyBreadcrumb', () => {
  describe('렌더링', () => {
    it('aria-label="계층 탐색"을 가진 nav 요소를 렌더링한다', () => {
      render(<HierarchyBreadcrumb items={[{ label: '캠페인' }]} />)
      expect(screen.getByRole('navigation', { name: '계층 탐색' })).toBeInTheDocument()
    })

    it('단일 항목을 렌더링한다', () => {
      render(<HierarchyBreadcrumb items={[{ label: '캠페인' }]} />)
      expect(screen.getByText('캠페인')).toBeInTheDocument()
    })

    it('다수 항목을 렌더링한다', () => {
      render(
        <HierarchyBreadcrumb
          items={[
            { label: '캠페인', onClick: vi.fn() },
            { label: '광고 세트' },
          ]}
        />
      )
      expect(screen.getByText('캠페인')).toBeInTheDocument()
      expect(screen.getByText('광고 세트')).toBeInTheDocument()
    })

    it('항목 사이에 ChevronRight 구분자를 렌더링한다', () => {
      render(
        <HierarchyBreadcrumb
          items={[
            { label: '캠페인', onClick: vi.fn() },
            { label: '광고 세트' },
          ]}
        />
      )
      expect(screen.getByTestId('chevron-right')).toBeInTheDocument()
    })

    it('단일 항목일 때 ChevronRight를 렌더링하지 않는다', () => {
      render(<HierarchyBreadcrumb items={[{ label: '캠페인' }]} />)
      expect(screen.queryByTestId('chevron-right')).not.toBeInTheDocument()
    })
  })

  describe('마지막 항목', () => {
    it('마지막 항목은 span으로 렌더링한다 (버튼이 아님)', () => {
      render(
        <HierarchyBreadcrumb
          items={[
            { label: '캠페인', onClick: vi.fn() },
            { label: '광고 세트' },
          ]}
        />
      )
      // 마지막 항목 "광고 세트"는 button이 아닌 span
      expect(screen.queryByRole('button', { name: '광고 세트' })).not.toBeInTheDocument()
      expect(screen.getByText('광고 세트')).toBeInTheDocument()
    })

    it('단일 항목은 span으로 렌더링한다', () => {
      render(<HierarchyBreadcrumb items={[{ label: '캠페인' }]} />)
      expect(screen.queryByRole('button', { name: '캠페인' })).not.toBeInTheDocument()
      expect(screen.getByText('캠페인')).toBeInTheDocument()
    })
  })

  describe('클릭 핸들러', () => {
    it('마지막이 아닌 항목은 button으로 렌더링한다', () => {
      render(
        <HierarchyBreadcrumb
          items={[
            { label: '캠페인', onClick: vi.fn() },
            { label: '광고 세트' },
          ]}
        />
      )
      expect(screen.getByRole('button', { name: '캠페인' })).toBeInTheDocument()
    })

    it('마지막이 아닌 항목 클릭 시 onClick 콜백을 호출한다', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(
        <HierarchyBreadcrumb
          items={[
            { label: '캠페인', onClick: handleClick },
            { label: '광고 세트' },
          ]}
        />
      )

      await user.click(screen.getByRole('button', { name: '캠페인' }))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('3단계 breadcrumb에서 중간 항목도 클릭 가능하다', async () => {
      const user = userEvent.setup()
      const handleClickCampaign = vi.fn()
      const handleClickAdSet = vi.fn()
      render(
        <HierarchyBreadcrumb
          items={[
            { label: '캠페인', onClick: handleClickCampaign },
            { label: '광고 세트', onClick: handleClickAdSet },
            { label: '광고' },
          ]}
        />
      )

      await user.click(screen.getByRole('button', { name: '캠페인' }))
      expect(handleClickCampaign).toHaveBeenCalledTimes(1)

      await user.click(screen.getByRole('button', { name: '광고 세트' }))
      expect(handleClickAdSet).toHaveBeenCalledTimes(1)

      // 마지막 항목 "광고"는 버튼이 아님
      expect(screen.queryByRole('button', { name: '광고' })).not.toBeInTheDocument()
    })
  })
})
