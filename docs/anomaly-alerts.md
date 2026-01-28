# Anomaly Detection Push Notifications

## Overview

Push notification system for anomaly detection that sends email alerts when critical campaign anomalies are detected.

## Features

- **Email Alerts**: Sends formatted HTML emails with anomaly details
- **Rate Limiting**: Prevents alert fatigue with configurable limits
- **Deduplication**: Avoids duplicate alerts within 24h window
- **Severity Filtering**: Only sends alerts for configured severity levels
- **Market Context**: Includes Korean market calendar context in alerts
- **Beautiful Emails**: Professional HTML email templates with metrics visualization

## Architecture

```
AnomalyDetectionService → AnomalyAlertService → EmailService (Resend)
```

### Components

1. **AnomalyDetectionService** (`src/application/services/AnomalyDetectionService.ts`)
   - Detects anomalies using statistical methods (Z-Score, IQR, Moving Average)
   - Returns list of anomalies with severity, type, and recommendations

2. **AnomalyAlertService** (`src/application/services/AnomalyAlertService.ts`)
   - Filters anomalies by severity
   - Enforces rate limiting and deduplication
   - Generates and sends email alerts

3. **EmailService** (`src/infrastructure/email/EmailService.ts`)
   - Sends emails via Resend API
   - Supports HTML templates and attachments

## Configuration

### Environment Variables

```bash
# Email Service (Required)
RESEND_API_KEY="re_xxxxx"
RESEND_FROM_EMAIL="noreply@batwo.co.kr"

# Cron Job Security (Recommended for production)
CRON_SECRET="your-secret-key"
```

### Alert Configuration

```typescript
{
  minimumSeverity: 'warning', // 'critical' | 'warning' | 'info'
  maxAlertsPerCampaignPerDay: 5,
  deduplicationWindowHours: 24,
  enableEmailAlerts: true
}
```

## API Endpoints

### GET /api/alerts/anomaly

Detect anomalies for the authenticated user (no alerts sent).

**Response:**
```json
{
  "success": true,
  "anomalies": [...],
  "count": 3,
  "detectedAt": "2024-01-23T10:00:00.000Z"
}
```

### POST /api/alerts/anomaly

Trigger anomaly detection and send alerts.

**Request Body:**
```json
{
  "minimumSeverity": "warning",
  "sendEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "detected": {
    "total": 5,
    "critical": 2,
    "warning": 3,
    "info": 0
  },
  "alerts": {
    "sent": 3,
    "skipped": 2,
    "errors": []
  },
  "detectedAt": "2024-01-23T10:00:00.000Z"
}
```

## Cron Job

### GET /api/cron/check-anomalies

Runs daily at 10:00 KST (01:00 UTC) to check all users' campaigns for anomalies.

**Vercel Cron Configuration** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/check-anomalies",
      "schedule": "0 1 * * *"
    }
  ]
}
```

**Authentication:**
```bash
Authorization: Bearer <CRON_SECRET>
```

## Email Template

Alert emails include:

- **Severity Badge**: Color-coded alert level (🚨 Critical, ⚠️ Warning, ℹ️ Info)
- **Campaign Name**: Name of affected campaign
- **Metrics Comparison**: Previous vs Current value
- **Change Percentage**: Visual change indicator
- **Market Context**: Special events (e.g., Black Friday) if applicable
- **Recommendations**: Actionable suggestions (up to 3)
- **Detection Details**: Method used (Z-Score, IQR, Moving Average)
- **CTA Button**: Link to dashboard

## Alert Logic

### Severity Filtering

Only anomalies meeting the minimum severity threshold are sent:

```typescript
minimumSeverity: 'warning'
// → Sends 'critical' and 'warning', skips 'info'

minimumSeverity: 'critical'
// → Sends only 'critical', skips 'warning' and 'info'
```

### Rate Limiting

Prevents alert fatigue:
- Maximum 5 alerts per campaign per day (configurable)
- Enforced at campaign level, not user level

### Deduplication

Prevents duplicate alerts:
- Same campaign + same metric within 24h window = skip
- Example: If "Campaign A - CPA spike" was sent at 10:00, another CPA spike for Campaign A won't send until next day

## Usage Examples

### Manual Trigger (Authenticated User)

```typescript
// Client-side
const response = await fetch('/api/alerts/anomaly', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    minimumSeverity: 'warning',
    sendEmail: true
  })
})
const result = await response.json()
console.log(`Sent ${result.alerts.sent} alerts`)
```

### Programmatic (Server-side)

```typescript
import { AnomalyDetectionService } from '@application/services/AnomalyDetectionService'
import { AnomalyAlertService } from '@application/services/AnomalyAlertService'

const anomalyService = new AnomalyDetectionService(kpiRepo, campaignRepo)
const alertService = new AnomalyAlertService(emailService, {
  minimumSeverity: 'critical',
  maxAlertsPerCampaignPerDay: 3
})

// Detect anomalies
const anomalies = await anomalyService.detectAnomalies(userId)

// Send alerts
const result = await alertService.sendAlerts({
  userId,
  userEmail: 'user@example.com',
  userName: 'John Doe',
  anomalies
})

console.log(`Sent: ${result.sent.length}, Skipped: ${result.skipped.length}`)
```

## Testing

### Unit Tests

```bash
npm test -- AnomalyAlertService.test.ts
```

Coverage:
- Email sending for all severity levels
- Severity filtering
- Rate limiting per campaign
- Deduplication logic
- Email formatting
- Error handling
- Market context inclusion

### Manual Testing

1. **Trigger Manual Alert**
   ```bash
   curl -X POST http://localhost:3000/api/alerts/anomaly \
     -H "Content-Type: application/json" \
     -d '{"minimumSeverity":"warning","sendEmail":true}'
   ```

2. **Check Cron Job Locally**
   ```bash
   curl http://localhost:3000/api/cron/check-anomalies \
     -H "Authorization: Bearer your-cron-secret"
   ```

## Monitoring

### Logs

Cron job logs:
```
[Anomaly Cron] Starting anomaly detection for all users...
[Anomaly Cron] Found 42 users with campaigns
[Anomaly Cron] Processing user user_123 (user@example.com)
[Anomaly Cron] Detected 3 anomalies for user user_123
[Anomaly Cron] Sent 2 alerts to user user_123
[Anomaly Cron] Completed: {
  usersProcessed: 42,
  totalAnomaliesDetected: 127,
  totalAlertsSent: 89,
  errors: []
}
```

### Metrics to Track

- Total anomalies detected per run
- Alert send rate (sent / detected)
- Email delivery success rate
- Rate limit hit frequency
- Deduplication effectiveness

## Future Enhancements

1. **In-App Notifications**: Push to browser/mobile app
2. **Webhook Support**: Send to Slack/Discord/Teams
3. **SMS Alerts**: For critical anomalies only
4. **Alert Preferences**: User-configurable per campaign
5. **Snooze Functionality**: Temporarily disable alerts
6. **Alert History**: UI to view past alerts
7. **Anomaly Acknowledgement**: Mark as "reviewed"

## Troubleshooting

### Emails Not Sending

1. Check `RESEND_API_KEY` is set
2. Verify Resend domain is verified
3. Check email service logs for errors
4. Ensure `enableEmailAlerts` is `true`

### Too Many Alerts

1. Increase `minimumSeverity` to `'critical'`
2. Decrease `maxAlertsPerCampaignPerDay`
3. Review anomaly detection thresholds

### Missing Alerts

1. Check if anomalies are being detected: GET `/api/alerts/anomaly`
2. Verify severity threshold isn't too high
3. Check rate limiting history
4. Review deduplication window

## References

- [Resend API Docs](https://resend.com/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Anomaly Detection Service](../src/application/services/AnomalyDetectionService.ts)
- [Email Service](../src/infrastructure/email/EmailService.ts)
