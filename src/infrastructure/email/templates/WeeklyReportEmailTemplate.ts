interface WeeklyReportEmailProps {
  reportName: string
  dateRange: {
    startDate: string
    endDate: string
  }
  summaryMetrics: {
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    totalSpend: number
    totalRevenue: number
    overallROAS: number
  }
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num))
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(num)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function WeeklyReportEmailTemplate({
  reportName,
  dateRange,
  summaryMetrics,
}: WeeklyReportEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportName} 주간 리포트</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">바투</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">AI 마케팅 솔루션</p>
            </td>
          </tr>

          <!-- Title Section -->
          <tr>
            <td style="padding: 40px 40px 24px;">
              <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 24px; font-weight: 600;">주간 마케팅 리포트</h2>
              <p style="margin: 0; color: #64748b; font-size: 14px;">
                ${formatDate(dateRange.startDate)} ~ ${formatDate(dateRange.endDate)}
              </p>
            </td>
          </tr>

          <!-- Summary Metrics -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 20px; color: #475569; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">성과 요약</h3>

                    <!-- Metrics Grid -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="33%" style="padding: 12px; text-align: center; border-right: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">총 노출</p>
                          <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 700;">${formatNumber(summaryMetrics.totalImpressions)}</p>
                        </td>
                        <td width="33%" style="padding: 12px; text-align: center; border-right: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">총 클릭</p>
                          <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 700;">${formatNumber(summaryMetrics.totalClicks)}</p>
                        </td>
                        <td width="34%" style="padding: 12px; text-align: center;">
                          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">총 전환</p>
                          <p style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 700;">${formatNumber(summaryMetrics.totalConversions)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="3" style="padding-top: 16px; border-top: 1px solid #e2e8f0;"></td>
                      </tr>
                      <tr>
                        <td width="33%" style="padding: 12px; text-align: center; border-right: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">총 지출</p>
                          <p style="margin: 0; color: #dc2626; font-size: 18px; font-weight: 700;">${formatCurrency(summaryMetrics.totalSpend)}</p>
                        </td>
                        <td width="33%" style="padding: 12px; text-align: center; border-right: 1px solid #e2e8f0;">
                          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">총 매출</p>
                          <p style="margin: 0; color: #16a34a; font-size: 18px; font-weight: 700;">${formatCurrency(summaryMetrics.totalRevenue)}</p>
                        </td>
                        <td width="34%" style="padding: 12px; text-align: center;">
                          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">ROAS</p>
                          <p style="margin: 0; color: #2563eb; font-size: 18px; font-weight: 700;">${summaryMetrics.overallROAS.toFixed(2)}x</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Section -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0 0 16px; color: #475569; font-size: 14px; line-height: 1.6;">
                자세한 캠페인별 성과와 AI 인사이트는 첨부된 PDF 리포트를 확인해주세요.
                또는 대시보드에서 실시간 성과를 확인할 수 있습니다.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #2563eb; border-radius: 8px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://batwo.co.kr'}/dashboard"
                       style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      대시보드 바로가기 →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">
                이 이메일은 ${reportName} 주간 리포트입니다.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                © ${new Date().getFullYear()} 바투 AI 마케팅. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
