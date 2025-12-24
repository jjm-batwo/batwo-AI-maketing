import { NextResponse } from 'next/server'

// Mock quota data for MVP - FREE plan limits
const mockQuota = {
  usage: {
    campaigns: {
      used: 2,
      limit: 3,
      period: 'monthly' as const,
    },
    aiReports: {
      used: 4,
      limit: 5,
      period: 'monthly' as const,
    },
    apiCalls: {
      used: 850,
      limit: 1000,
      period: 'daily' as const,
    },
    adSpend: {
      used: 450000,
      limit: 500000,
      period: 'monthly' as const,
    },
  },
  plan: 'FREE' as const,
  resetDates: {
    monthly: '2024-07-01',
    daily: new Date().toISOString().split('T')[0],
  },
}

export async function GET() {
  try {
    return NextResponse.json(mockQuota)
  } catch (error) {
    console.error('Failed to fetch quota:', error)
    return NextResponse.json(
      { message: 'Failed to fetch quota' },
      { status: 500 }
    )
  }
}
