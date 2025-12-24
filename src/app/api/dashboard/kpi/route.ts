import { NextRequest, NextResponse } from 'next/server'

// Mock KPI data for MVP
function generateMockKPIData(period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const chartData = []

  const baseDate = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - i)

    chartData.push({
      date: date.toISOString().split('T')[0],
      spend: Math.floor(Math.random() * 50000) + 30000,
      revenue: Math.floor(Math.random() * 150000) + 80000,
      roas: Math.random() * 2 + 1.5,
      impressions: Math.floor(Math.random() * 30000) + 10000,
      clicks: Math.floor(Math.random() * 1500) + 500,
      conversions: Math.floor(Math.random() * 50) + 10,
    })
  }

  const totalSpend = chartData.reduce((sum, d) => sum + d.spend, 0)
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
  const totalImpressions = chartData.reduce((sum, d) => sum + d.impressions, 0)
  const totalClicks = chartData.reduce((sum, d) => sum + d.clicks, 0)
  const totalConversions = chartData.reduce((sum, d) => sum + d.conversions, 0)

  return {
    summary: {
      totalSpend,
      totalRevenue,
      totalImpressions,
      totalClicks,
      totalConversions,
      averageRoas: totalRevenue / totalSpend,
      averageCtr: (totalClicks / totalImpressions) * 100,
      averageCpa: totalSpend / totalConversions,
      activeCampaigns: 3,
      changes: {
        spend: Math.random() * 20 - 10,
        revenue: Math.random() * 30 - 5,
        roas: Math.random() * 0.5 - 0.1,
        ctr: Math.random() * 2 - 0.5,
        conversions: Math.random() * 25 - 5,
      },
    },
    chartData,
    period: {
      startDate: chartData[0].date,
      endDate: chartData[chartData.length - 1].date,
    },
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'

    const data = generateMockKPIData(period)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch dashboard KPI:', error)
    return NextResponse.json(
      { message: 'Failed to fetch dashboard KPI' },
      { status: 500 }
    )
  }
}
