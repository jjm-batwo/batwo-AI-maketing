# Meta App Review - Timing Guide

Complete timing reference for coordinating demo video recording with subtitles.

## Overall Video Structure

Total duration: **~5 minutes**

```
Intro (0:00-0:30)
├─ Scene 1: App Introduction
│
Meta Connection (0:30-1:30)
├─ Scene 2: Facebook OAuth & Permission Consent
│
Feature Demonstrations (1:30-4:45)
├─ Scene 3: pages_show_list (1:30-2:00)
├─ Scene 4: pages_read_engagement (2:00-4:15)
├─ Scene 5: business_management (4:15-5:05)
├─ Scene 6: ads_read (5:05-7:05)
├─ Scene 7: ads_management (7:05-8:35)
│
Outro (8:35-9:00)
└─ Scene 8: Completion & Summary
```

## Detailed Scene Timing

### Scene 1: App Introduction (0:00 - 0:30)
**Action**: Show login page and app overview

| Time | Action | Duration |
|------|--------|----------|
| 0:00-0:03 | Show login page | 3s |
| 0:03-0:30 | Brief app feature overview | 27s |

**Subtitle**: "Batwo AI Marketing Solution - E-commerce advertising automation platform"

---

### Scene 2: Meta Account Connection (0:30 - 1:30)
**Action**: Complete OAuth flow with permission consent

| Time | Action | Duration |
|------|--------|----------|
| 0:30-0:36 | Click "Connect Meta Account" button | 6s |
| 0:36-0:45 | Facebook login dialog appears | 9s |
| 0:45-0:54 | Enter test email | 9s |
| 0:54-1:03 | Enter password | 9s |
| 1:03-1:09 | Click "Log In" button | 6s |
| 1:09-1:21 | Permission consent screen displays (5 permissions visible) | 12s |
| 1:21-1:30 | Click "Continue" & redirect to app | 9s |

**Key**: Ensure permission consent screen shows:
- pages_show_list
- pages_read_engagement
- business_management
- ads_read
- ads_management

---

### Scene 3: pages_show_list Demo (1:30 - 2:00)
**Duration**: 30 seconds
**Location**: Settings > Meta Pages Management

| Time | Action | Duration |
|------|--------|----------|
| 1:30-1:33 | Show pages_show_list permission intro | 3s |
| 1:33-1:39 | Navigate to Settings > Meta Pages Management | 6s |
| 1:39-1:48 | Show page list loading | 9s |
| 1:48-1:54 | Display 3 pages with details (name, category, followers) | 6s |
| 1:54-2:00 | Click on first page to show details | 6s |

**API Calls Shown**:
- `GET /me/accounts` - pages_show_list permission

**Subtitle Reference**: `pages_show_list_en.srt` lines 1-42

---

### Scene 4: pages_read_engagement Demo (2:00 - 4:15)
**Duration**: 2 minutes 15 seconds
**Location**: Settings > Meta Pages > Page Analytics

| Time | Action | Duration |
|------|--------|----------|
| 2:00-2:03 | Show pages_read_engagement permission intro | 3s |
| 2:03-2:09 | Click "View Analytics" tab | 6s |
| 2:09-2:15 | API loads, dashboard appears | 6s |
| 2:15-2:30 | Show KPI metrics (fans, impressions, engaged users) | 15s |
| 2:30-2:45 | Display engagement metrics (total engagement, rate) | 15s |
| 2:45-3:00 | Scroll to recent posts section | 15s |
| 3:00-3:30 | Show 3 recent posts with engagement data | 30s |
| 3:30-3:45 | Scroll to trend charts | 15s |
| 3:45-4:00 | Show daily engagement trend (bar chart) | 15s |
| 4:00-4:15 | Show engagement type breakdown (likes/comments/shares) | 15s |

**API Calls Shown**:
- `GET /{page-id}/insights?metric=page_fans`
- `GET /{page-id}/insights?metric=page_impressions`
- `GET /{page-id}/insights?metric=page_engaged_users`
- `GET /{page-id}/posts?fields=story,shares.limit(0).summary(true)`

**Subtitle Reference**: `pages_read_engagement_en.srt` lines 1-45

---

### Scene 5: business_management Demo (4:15 - 5:05)
**Duration**: 50 seconds
**Location**: Settings > Pixel Installation

| Time | Action | Duration |
|------|--------|----------|
| 4:15-4:18 | Show business_management permission intro | 3s |
| 4:18-4:24 | Navigate to Settings > Pixel Installation | 6s |
| 4:24-4:30 | API loads, pixel list appears | 6s |
| 4:30-4:42 | Show 2 connected pixels with details | 12s |
| 4:42-4:48 | Click on first pixel to show detail page | 6s |
| 4:48-4:54 | Show pixel installation code section | 6s |
| 4:54-5:00 | Click "Copy Installation Code" button | 6s |
| 5:00-5:05 | Return to pixel list, show "Create New Pixel" | 5s |

**API Calls Shown**:
- `GET /me/businesses`
- `GET /{business-id}/adspixels`

**Note**: Optional - can extend to 1:50 by including:
- New pixel creation form
- Fill pixel details
- Show new pixel in list (adds ~50s)

**Subtitle Reference**: `business_management_en.srt` lines 1-54

---

### Scene 6: ads_read Demo (5:05 - 7:05)
**Duration**: 2 minutes
**Location**: Dashboard Main Page

| Time | Action | Duration |
|------|--------|----------|
| 5:05-5:08 | Show ads_read permission intro | 3s |
| 5:08-5:14 | Navigate to Dashboard | 6s |
| 5:14-5:20 | KPI cards load | 6s |
| 5:20-5:35 | Show 4 KPI cards (ROAS, Spend, Conversions, CTR) | 15s |
| 5:35-5:45 | Scroll down to charts section | 10s |
| 5:45-6:00 | Show daily spend trend chart | 15s |
| 6:00-6:15 | Show ROAS trend chart | 15s |
| 6:15-6:30 | Continue scrolling to campaign table | 15s |
| 6:30-6:45 | Show campaign list table with performance data | 15s |
| 6:45-7:00 | Click on campaign to show detailed analytics | 15s |
| 7:00-7:05 | Show campaign detail page with all metrics | 5s |

**API Calls Shown**:
- `GET /act_{account-id}/insights?fields=roas`
- `GET /act_{account-id}/insights?fields=spend`
- `GET /act_{account-id}/insights?fields=conversions`
- `GET /act_{account-id}/insights?fields=ctr`
- `GET /act_{account-id}/campaigns?fields=name,spend,insights`

**Metrics to Display**:
- ROAS: 3.45
- Spend: ₩1,234,567
- Conversions: 358
- CTR: 2.34%

**Subtitle Reference**: `ads_read_en.srt` lines 1-42

---

### Scene 7: ads_management Demo (7:05 - 8:35)
**Duration**: 1 minute 30 seconds
**Location**: Campaigns > Create New Campaign

| Time | Action | Duration |
|------|--------|----------|
| 7:05-7:08 | Show ads_management permission intro | 3s |
| 7:08-7:14 | Navigate to Campaigns menu | 6s |
| 7:14-7:20 | Show campaign list with existing campaigns | 6s |
| 7:20-7:26 | Click "Create New Campaign" button | 6s |
| 7:26-7:32 | Campaign creation form loads | 6s |
| 7:32-7:42 | Fill campaign name: "Test Campaign for Review" | 10s |
| 7:42-7:48 | Select campaign objective: Conversions | 6s |
| 7:48-7:54 | Enter budget: ₩10,000 | 6s |
| 7:54-8:00 | Set campaign dates | 6s |
| 8:00-8:06 | Enable "Sync to Meta" option | 6s |
| 8:06-8:12 | Click "Create Campaign" button | 6s |
| 8:12-8:18 | API call processes | 6s |
| 8:18-8:24 | Success message appears | 6s |
| 8:24-8:30 | Return to campaign list | 6s |
| 8:30-8:35 | Show newly created campaign in list | 5s |

**API Calls Shown**:
- `POST /act_{account-id}/campaigns` (campaign creation)

**Optional Extensions** (adds 30s):
- 8:35-8:42 | Click pause button on campaign
- 8:42-8:49 | Show status change to "Paused"
- 8:49-8:55 | Show API call with status=PAUSED
- 8:55-9:02 | Click resume to reactivate

**Subtitle Reference**: `ads_management_en.srt` lines 1-31

---

### Scene 8: Outro (8:35 - 9:00)
**Duration**: 25 seconds

| Time | Action | Duration |
|------|--------|----------|
| 8:35-8:40 | Show summary of permissions demonstrated | 5s |
| 8:40-8:50 | Brief explanation of app value | 10s |
| 8:50-9:00 | App logo / thank you message | 10s |

---

## Quick Timing Reference Table

| Scene | Content | Start | End | Duration |
|-------|---------|-------|-----|----------|
| 1 | App Intro | 0:00 | 0:30 | 30s |
| 2 | OAuth Flow | 0:30 | 1:30 | 60s |
| 3 | pages_show_list | 1:30 | 2:00 | 30s |
| 4 | pages_read_engagement | 2:00 | 4:15 | 135s |
| 5 | business_management | 4:15 | 5:05 | 50s |
| 6 | ads_read | 5:05 | 7:05 | 120s |
| 7 | ads_management | 7:05 | 8:35 | 90s |
| 8 | Outro | 8:35 | 9:00 | 25s |
| **TOTAL** | | **0:00** | **9:00** | **540s (9min)** |

**Note**: Recommended total is ≤ 5 minutes (300s). Above timing allows flexibility. Trim to ≤ 5 minutes before submission.

---

## Subtitle Synchronization Tips

### 1. Use SRT Timestamps
Each `.srt` file has precise timestamps. When recording:
- Start timer at 0:00:00
- Pause timer during editing
- Use subtitle timestamps as action cues

### 2. Record with Margins
- Record 2-3 seconds buffer before and after each action
- Gives flexibility when editing to exact subtitle timing

### 3. Test Sync Before Final Export
1. Export video with subtitles
2. Play full video
3. Verify subtitles appear at correct moments
4. Adjust video speed/timing if needed

### 4. Managing Silence Gaps
If action completes before subtitle ends:
- Use pause/wait moments (mouse hovering, API processing)
- Don't cut to next action too quickly
- Maintain visual interest (scroll, highlight, expand UI elements)

---

## Common Timing Adjustments

### If Demo Runs Too Fast
- Add deliberate pauses between actions
- Wait for API responses to fully render
- Extend time showing results (3-5 seconds per screen)

### If Demo Runs Too Slow
- Skip optional actions (some permission details can be condensed)
- Reduce display time for charts/data (2-3 seconds instead of 5)
- Combine some steps (show multiple items faster)

### Trimming to 5 Minutes
Recommended cuts (in priority order):
1. Reduce ad_read chart display time (save ~30s)
2. Skip optional campaign pause/resume demo in ads_management (save ~30s)
3. Condense business_management new pixel creation (save ~30s)
4. Shorten pages_read_engagement trend display (save ~30s)

Total possible savings: ~2 minutes

---

## Recording Environment Setup

### Before Hitting Record

```bash
# 1. Clear browser cache
chrome://settings/clearBrowserData

# 2. Ensure test account access
- Email: [test_account_email]
- Password: [test_account_password]

# 3. Check app is in development mode
- URL: http://localhost:3000 or staging URL
- Check OAuth config in .env.local

# 4. Open network tab
- Chrome DevTools > Network tab
- Filter: XHR/Fetch
- Shows all API calls as they happen

# 5. Set browser zoom to 100%
- Ensures proper resolution
- Makes text readable at 720p+

# 6. Disable browser notifications
- Settings > Notifications > Block all
```

### Recording Quality Settings

```
Resolution: 1920x1080 (minimum 720p for final)
Frame Rate: 30 FPS
Bitrate: 2500 kbps (for streaming-quality MP4)
Codec: H.264
Audio: Disabled (Meta doesn't require audio)
Format: MP4 (most compatible)
```

---

## Sample Recording Script

```
[START RECORDING]

[0:00-0:30] Scene 1: Show login page (3s), hover mouse, stay on page (27s)

[0:30-0:36] Click "Connect Meta Account" button

[0:36-0:45] Wait for Facebook login dialog to appear

[0:45-0:54] Enter test email in dialog

[0:54-1:03] Enter password in dialog

[1:03-1:09] Click "Log In" button - IMPORTANT: Let permission screen render

[1:09-1:21] Permission consent screen appears - wait (highlight all 5 permissions)

[1:21-1:30] Click "Continue" button - wait for redirect

[1:30-1:39] Navigate to Settings menu > Meta Pages Management

[1:39-1:48] Wait for page list to load...

[Continue following subtitle timing for each subsequent scene]

[9:00] STOP RECORDING - Total duration 9 minutes (edit down to ≤5 minutes)
```

---

## Subtitle File References

Use these to cross-reference exact wording during recording:

| Scene | Subtitle File | Key Lines |
|-------|---------------|-----------|
| pages_show_list | `pages_show_list_en.srt` | Lines 1-42 (total 30s of content) |
| pages_read_engagement | `pages_read_engagement_en.srt` | Lines 1-45 (total 135s of content) |
| business_management | `business_management_en.srt` | Lines 1-54 (total 50-100s of content) |
| ads_read | `ads_read_en.srt` | Lines 1-42 (total 120s of content) |
| ads_management | `ads_management_en.srt` | Lines 1-31 (total 90-120s of content) |

---

## Post-Recording: Subtitle Integration

### Method 1: FFmpeg (Burn subtitles into video)
```bash
ffmpeg -i demo_raw.mp4 \
  -vf subtitles=ads_management_en.srt \
  -c:a aac \
  demo_with_subtitles.mp4
```

### Method 2: VLC (Visual verification)
```bash
# Open video, drag .srt file onto window
# Verify timing looks good
# Check readability at 720p resolution
```

### Method 3: Video Editor (Final QA)
- Import video to editor (DaVinci Resolve, Adobe Premiere)
- Import SRT file
- Review sync frame-by-frame
- Export final MP4 (H.264, AAC, 720p+ resolution)

---

## Final Checklist Before Submission

- [ ] Total video length ≤ 5 minutes
- [ ] Resolution ≥ 720p (1920x1080 preferred)
- [ ] Frame rate 24-30 FPS
- [ ] English subtitles burned into video
- [ ] All 5 permissions clearly demonstrated
- [ ] OAuth flow shown start to finish
- [ ] Permission consent screen visible with all 5 permissions
- [ ] All API calls visible (network tab or evident from results)
- [ ] No errors or failures during demo
- [ ] No sensitive data (real passwords, API keys) visible
- [ ] Subtitles synchronized with on-screen content
- [ ] Video exports to MP4 format successfully
