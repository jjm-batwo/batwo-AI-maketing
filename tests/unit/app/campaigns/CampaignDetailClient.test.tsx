import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'

import { CampaignDetailClient } from '../../../../src/app/(dashboard)/campaigns/[id]/CampaignDetailClient'

const mockUseUpdateCampaign = vi.fn()
const mockUseCampaignKPI = vi.fn()
const mockHierarchySection = vi.fn()

vi.mock('@/presentation/hooks', () => ({
  useUpdateCampaign: () => mockUseUpdateCampaign(),
  useCampaignKPI: (...args: unknown[]) => mockUseCampaignKPI(...args),
}))

vi.mock('@/presentation/components/campaign/CampaignHierarchySection', () => ({
  CampaignHierarchySection: (props: unknown) => {
    mockHierarchySection(props)
    return <div data-testid="hierarchy-section" />
  },
}))

describe('CampaignDetailClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseUpdateCampaign.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })

    mockUseCampaignKPI.mockReturnValue({
      data: {
        summary: {
          spend: 34832,
          conversions: 5,
          roas: 2.1,
          impressions: 15078,
          clicks: 423,
        },
      },
    })
  })

  it('shows KPI summary from useCampaignKPI instead of campaign fallback values', () => {
    render(
      <CampaignDetailClient
        campaign={{
          id: 'cmp_1',
          name: '00_웹유입_studio',
          objective: 'TRAFFIC',
          status: 'ACTIVE',
          dailyBudget: 5000,
          totalSpent: 0,
          conversions: 0,
          roas: 0,
          impressions: 0,
          clicks: 0,
        }}
      />
    )

    expect(screen.getByText('34,832원')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('2.10x')).toBeInTheDocument()
  })

  it('passes converted datePreset to hierarchy section when period tab changes', async () => {
    const user = userEvent.setup()

    render(
      <CampaignDetailClient
        campaign={{
          id: 'cmp_1',
          name: '00_웹유입_studio',
          objective: 'TRAFFIC',
          status: 'ACTIVE',
          dailyBudget: 5000,
        }}
      />
    )

    expect(mockHierarchySection).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: 'cmp_1',
        campaignName: '00_웹유입_studio',
        datePreset: 'last_7d',
      })
    )

    await user.click(screen.getByRole('tab', { name: '3일' }))

    expect(mockHierarchySection).toHaveBeenLastCalledWith(
      expect.objectContaining({
        campaignId: 'cmp_1',
        campaignName: '00_웹유입_studio',
        datePreset: 'last_3d',
      })
    )
  })
})
