/**
 * 트렌드 알림 이메일 템플릿
 */

import type { TrendAlert } from '@/application/services/TrendAlertService'

interface TrendAlertEmailProps {
  userName: string
  digest: TrendAlert
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'critical':
      return '#dc2626' // red-600
    case 'high':
      return '#ea580c' // orange-600
    case 'medium':
      return '#ca8a04' // yellow-600
    default:
      return '#64748b' // slate-500
  }
}

function getUrgencyLabel(urgency: string): string {
  switch (urgency) {
    case 'critical':
      return '🔥 긴급'
    case 'high':
      return '⚡ 높음'
    case 'medium':
      return '📌 중간'
    default:
      return '📅 낮음'
  }
}

export function TrendAlertEmailTemplate({
  userName,
  digest,
}: TrendAlertEmailProps): string {
  const { events, weeklyDigest } = digest

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>주간 마케팅 기회 리포트</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">바투</h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">주간 마케팅 기회 리포트</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 24px;">
              <h2 style="margin: 0 0 8px; color: #1e293b; font-size: 24px; font-weight: 600;">${userName}님, 이번 주 준비하세요!</h2>
              <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                ${weeklyDigest.summary}
              </p>
            </td>
          </tr>

          <!-- Top Opportunity -->
          ${weeklyDigest.topOpportunity && weeklyDigest.topOpportunity !== '이번 주 특별 이벤트 없음' ? `
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 4px; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase;">🏆 이번 주 최고 기회</p>
                    <p style="margin: 0; color: #78350f; font-size: 18px; font-weight: 700;">${weeklyDigest.topOpportunity}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Action Items -->
          ${weeklyDigest.actionItems.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 32px;">
              <h3 style="margin: 0 0 16px; color: #475569; font-size: 16px; font-weight: 600;">🎯 이번 주 해야 할 일</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${weeklyDigest.actionItems.map((item, index) => `
                <tr>
                  <td style="padding: ${index > 0 ? '12px 0 0' : '0'};">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 6px; border-left: 3px solid #2563eb;">
                      <tr>
                        <td style="padding: 12px 16px;">
                          <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.5;">${item}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Upcoming Events -->
          ${events.length > 0 ? `
          <tr>
            <td style="padding: 0 40px 32px;">
              <h3 style="margin: 0 0 16px; color: #475569; font-size: 16px; font-weight: 600;">📅 다가오는 이벤트 (2주 내)</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${events.map((event, index) => `
                <tr>
                  <td style="padding: ${index > 0 ? '16px 0 0' : '0'};">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                      <tr>
                        <td style="padding: 20px;">
                          <!-- Event Header -->
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td width="70%">
                                <p style="margin: 0 0 4px; color: #1e293b; font-size: 18px; font-weight: 700;">${event.name}</p>
                                <p style="margin: 0; color: #64748b; font-size: 13px;">${formatDate(event.date)} • ${event.daysUntil}일 후</p>
                              </td>
                              <td width="30%" style="text-align: right;">
                                <span style="display: inline-block; padding: 6px 12px; background-color: ${getUrgencyColor(event.urgency)}; color: #ffffff; border-radius: 6px; font-size: 12px; font-weight: 600;">
                                  ${getUrgencyLabel(event.urgency)}
                                </span>
                              </td>
                            </tr>
                          </table>

                          <!-- Impact -->
                          <p style="margin: 16px 0 0; color: #475569; font-size: 14px; line-height: 1.6;">
                            <strong>영향:</strong> ${event.impact}
                          </p>

                          <!-- Budget Recommendation -->
                          ${event.isPrepPhase ? `
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 12px; background-color: #dbeafe; border-radius: 6px;">
                            <tr>
                              <td style="padding: 12px;">
                                <p style="margin: 0; color: #1e40af; font-size: 13px;">
                                  <strong>💰 예산 권장:</strong> ${event.budgetRecommendation}
                                </p>
                              </td>
                            </tr>
                          </table>
                          ` : ''}

                          <!-- Preparation Checklist (only for urgent events) -->
                          ${event.urgency === 'critical' || event.urgency === 'high' ? `
                          <div style="margin-top: 16px;">
                            <p style="margin: 0 0 8px; color: #334155; font-size: 13px; font-weight: 600;">✅ 준비사항:</p>
                            <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.8;">
                              ${event.preparationChecklist.slice(0, 3).map(item => `<li>${item}</li>`).join('')}
                            </ul>
                          </div>
                          ` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- CTA Section -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0 0 16px; color: #475569; font-size: 14px; line-height: 1.6;">
                지금 바로 캠페인을 기획하고 마케팅 기회를 선점하세요!
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #8b5cf6; border-radius: 8px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://batwo.co.kr'}/dashboard/campaigns"
                       style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600;">
                      캠페인 만들기 →
                    </a>
                  </td>
                  <td style="width: 12px;"></td>
                  <td style="border: 2px solid #8b5cf6; border-radius: 8px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://batwo.co.kr'}/dashboard"
                       style="display: inline-block; padding: 12px 28px; color: #8b5cf6; text-decoration: none; font-size: 14px; font-weight: 600;">
                      대시보드 보기
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
                이 이메일은 매주 월요일 발송되는 마케팅 기회 알림입니다.
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
