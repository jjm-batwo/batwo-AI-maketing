import { NextRequest, NextResponse } from 'next/server'

// Mock data for MVP - will be replaced with actual database queries
const mockCampaigns = [
  {
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
  },
  {
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
  },
  {
    id: '3',
    name: '브랜드 인지도 캠페인',
    objective: 'BRAND_AWARENESS',
    status: 'PAUSED',
    dailyBudget: 100000,
    totalSpent: 500000,
    impressions: 500000,
    clicks: 8000,
    conversions: 80,
    roas: 1.5,
    startDate: '2024-05-01',
    endDate: '2024-05-31',
    createdAt: '2024-04-28T09:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status')

    let filteredCampaigns = [...mockCampaigns]

    if (status) {
      filteredCampaigns = filteredCampaigns.filter((c) => c.status === status)
    }

    const total = filteredCampaigns.length
    const start = (page - 1) * pageSize
    const campaigns = filteredCampaigns.slice(start, start + pageSize)

    return NextResponse.json({
      campaigns,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json(
      { message: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.objective || !body.dailyBudget || !body.startDate) {
      return NextResponse.json(
        { message: '필수 항목을 모두 입력해주세요' },
        { status: 400 }
      )
    }

    // Create new campaign (in production, this would insert into database)
    const newCampaign = {
      id: String(mockCampaigns.length + 1),
      name: body.name,
      objective: body.objective,
      status: 'DRAFT' as const,
      dailyBudget: body.dailyBudget,
      totalSpent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      roas: 0,
      startDate: body.startDate,
      endDate: body.endDate,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(newCampaign, { status: 201 })
  } catch (error) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json(
      { message: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
