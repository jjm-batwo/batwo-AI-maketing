import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // In production, this would generate or fetch the actual PDF
    // For MVP, we return a simple text response
    const pdfContent = `Report ${id} - Generated at ${new Date().toISOString()}`

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report-${id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Failed to download report:', error)
    return NextResponse.json(
      { message: 'Failed to download report' },
      { status: 500 }
    )
  }
}
