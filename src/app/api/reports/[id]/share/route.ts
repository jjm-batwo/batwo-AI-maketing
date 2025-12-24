import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.email) {
      return NextResponse.json(
        { message: '이메일 주소가 필요합니다' },
        { status: 400 }
      )
    }

    // In production, this would send the report via email
    console.log(`Sharing report ${id} to ${body.email}`)

    return NextResponse.json({
      success: true,
      message: `보고서가 ${body.email}로 전송되었습니다`,
    })
  } catch (error) {
    console.error('Failed to share report:', error)
    return NextResponse.json(
      { message: 'Failed to share report' },
      { status: 500 }
    )
  }
}
