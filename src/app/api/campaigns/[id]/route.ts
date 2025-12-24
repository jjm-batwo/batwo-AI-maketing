import { NextRequest, NextResponse } from 'next/server'

// Mock data for MVP
const mockCampaigns = new Map([
  ['1', {
    id: '1',
    name: '여름 시즌 프로모션',
    objective: 'CONVERSIONS',
    status: 'ACTIVE',
    dailyBudget: 50000,
    totalSpent: 350000,
    impressions: 150000,
    clicks: 4500,
    conversions: 120,
    roas: 3.2,
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    createdAt: '2024-05-28T10:00:00Z',
  }],
  ['2', {
    id: '2',
    name: '신규 고객 유입',
    objective: 'TRAFFIC',
    status: 'ACTIVE',
    dailyBudget: 30000,
    totalSpent: 180000,
    impressions: 80000,
    clicks: 3200,
    conversions: 45,
    roas: 2.1,
    startDate: '2024-06-05',
    createdAt: '2024-06-03T14:30:00Z',
  }],
])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const campaign = mockCampaigns.get(id)

    if (!campaign) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Failed to fetch campaign:', error)
    return NextResponse.json(
      { message: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const campaign = mockCampaigns.get(id)

    if (!campaign) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const updatedCampaign = { ...campaign, ...body }
    mockCampaigns.set(id, updatedCampaign)

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error('Failed to update campaign:', error)
    return NextResponse.json(
      { message: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const campaign = mockCampaigns.get(id)

    if (!campaign) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    mockCampaigns.delete(id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete campaign:', error)
    return NextResponse.json(
      { message: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
