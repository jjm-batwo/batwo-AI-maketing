import { NextRequest, NextResponse } from 'next/server'

// Mock reports data for MVP
const mockReports = [
  {
    id: '1',
    type: 'WEEKLY',
    status: 'GENERATED',
    dateRange: {
      startDate: '2024-06-10',
      endDate: '2024-06-16',
    },
    generatedAt: '2024-06-17T09:00:00Z',
    campaignCount: 3,
  },
  {
    id: '2',
    type: 'WEEKLY',
    status: 'GENERATED',
    dateRange: {
      startDate: '2024-06-03',
      endDate: '2024-06-09',
    },
    generatedAt: '2024-06-10T09:00:00Z',
    campaignCount: 3,
  },
  {
    id: '3',
    type: 'MONTHLY',
    status: 'GENERATED',
    dateRange: {
      startDate: '2024-05-01',
      endDate: '2024-05-31',
    },
    generatedAt: '2024-06-01T09:00:00Z',
    campaignCount: 5,
  },
  {
    id: '4',
    type: 'WEEKLY',
    status: 'PENDING',
    dateRange: {
      startDate: '2024-06-17',
      endDate: '2024-06-23',
    },
    campaignCount: 2,
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const type = searchParams.get('type')

    let filteredReports = [...mockReports]

    if (type) {
      filteredReports = filteredReports.filter((r) => r.type === type)
    }

    const total = filteredReports.length
    const start = (page - 1) * pageSize
    const reports = filteredReports.slice(start, start + pageSize)

    return NextResponse.json({
      reports,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json(
      { message: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
