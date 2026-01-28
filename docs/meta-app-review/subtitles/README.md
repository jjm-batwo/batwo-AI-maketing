# Meta App Review Demo - Subtitle Files

Complete subtitle files for Meta App Review screening videos. These subtitles guide both the recording process and help Meta reviewers understand each permission's purpose and usage.

## Files Overview

### Permission-Based Subtitles

Each permission has two subtitle files (Korean + English):

| Permission | Korean | English | Duration | Content |
|-----------|--------|---------|----------|---------|
| **ads_management** | `ads_management_ko.srt` | `ads_management_en.srt` | ~1:30 | Campaign creation, modification, pause/resume |
| **ads_read** | `ads_read_ko.srt` | `ads_read_en.srt` | ~2:00 | KPI dashboard, performance data, analytics |
| **business_management** | `business_management_ko.srt` | `business_management_en.srt` | ~1:50 | Pixel management, creation, installation code |
| **pages_show_list** | `pages_show_list_ko.srt` | `pages_show_list_en.srt` | ~2:00 | Page list retrieval, page details |
| **pages_read_engagement** | `pages_read_engagement_ko.srt` | `pages_read_engagement_en.srt` | ~2:15 | Engagement metrics, post analytics, trends |

**Total Video Length**: ~5 minutes (all permissions combined)

## Usage Instructions

### For Recording

Use these subtitles as a **script** when recording your demo video:

1. **Follow the timing**: Each subtitle line has specific timestamps showing when it should appear on screen
2. **Synchronize actions**: Match UI clicks and navigation to the subtitle timestamps
3. **Show API calls**: The subtitles indicate which API endpoints are being called - ensure your network tab shows these calls
4. **Include all elements**: Each subtitle ensures you capture all required screens and actions

### For Submission

You have two options for including subtitles in your final video:

#### Option A: Hard Subtitles (Recommended for Meta)
Burn the English subtitles directly into the video file using:
```bash
ffmpeg -i demo.mp4 -vf subtitles=ads_management_en.srt output.mp4
```

#### Option B: Soft Subtitles
Keep subtitles as separate files and upload with the video. Meta will display them automatically.

## Key Sections by Permission

### ads_management (00:00 - 01:30)
**Purpose**: Demonstrate campaign creation and management capability
- Create new campaign with form
- Enable "Sync to Meta" option
- Show API call: `POST /act_{account-id}/campaigns`
- Demonstrate pause/resume functionality
- Show API call: `POST /{campaign-id}` with status change

**Key Screens**:
- Campaign creation form
- Campaign list with newly created campaign
- Campaign status management menu

---

### ads_read (00:00 - 02:00)
**Purpose**: Show real-time performance data dashboard
- Display KPI cards (ROAS, Spend, Conversions, CTR)
- Show performance trend charts
- Display campaign performance table
- Show detailed campaign analytics

**Key Metrics**:
- ROAS: Return on Ad Spend
- Total Spend: Cumulative advertising costs
- Conversions: Number of conversions
- CTR: Click-Through Rate

**API Calls Demonstrated**:
- `GET /act_{account-id}/insights?fields=roas`
- `GET /act_{account-id}/insights?fields=spend`
- `GET /act_{account-id}/campaigns?fields=name,spend,insights`

---

### business_management (00:00 - 01:50)
**Purpose**: Demonstrate pixel management for conversion tracking
- List connected Meta Pixels
- Show pixel details
- Display pixel installation code
- Create new pixel
- Show pixel events tracking

**Key Screens**:
- Pixel management page
- Pixel detail view with installation code
- New pixel creation form
- Pixel list with newly created pixel

**API Calls Demonstrated**:
- `GET /me/businesses`
- `GET /{business-id}/adspixels`
- `POST /{business-id}/adspixels` (create new)

---

### pages_show_list (00:00 - 02:00)
**Purpose**: Show Facebook Pages management capability
- Display OAuth flow completion
- Show permission consent screen (all 5 permissions)
- List user's managed Facebook Pages
- Display page details (name, category, followers)
- Navigate between multiple pages

**Key Information Per Page**:
- Page Name
- Page Category
- Follower Count
- Page Status (Active/Inactive)
- Page ID

**API Call Demonstrated**:
- `GET /me/accounts` (pages_show_list permission)

---

### pages_read_engagement (00:00 - 02:15)
**Purpose**: Show engagement analytics for Facebook Pages
- Display engagement metrics dashboard
- Show fan count and growth
- Display recent posts with engagement data
- Show engagement trend charts
- Display peak engagement hours

**Metrics Shown**:
- Fan Count
- Page Impressions (28-day)
- Engaged Users
- Total Engagement
- Post-level: Likes, Comments, Shares
- Engagement Rate by Type
- Engagement Rate by Time

**API Calls Demonstrated**:
- `GET /{page-id}/insights?metric=page_fans`
- `GET /{page-id}/insights?metric=page_impressions`
- `GET /{page-id}/posts?fields=story,shares.limit(0).summary(true)`

## Technical Notes

### Subtitle Format: SRT
All files use SRT (SubRip) format:
```
Sequence Number
Start Time --> End Time
Subtitle Text
```

Example:
```
1
00:00:00,000 --> 00:00:03,000
Batwo AI Marketing - ads_management Permission Demo
```

### Timing Synchronization
- **Intro**: 3 seconds
- **Main content**: 2-4 seconds per subtitle
- **API calls**: 1-2 seconds for callout
- **Result/transition**: 1-2 seconds

### Language Strategy
- **Primary**: English subtitles (Meta requirement)
- **Secondary**: Korean subtitles (user reference)
- Both maintain consistent timing and messaging

## Recording Tips

### Before Recording
1. Clear browser cache and cookies (so OAuth dialog appears)
2. Test all functionality in staging environment
3. Prepare test data in Meta test account
4. Have network tab open to show API calls
5. Disable notifications and other distractions

### During Recording
1. Record at 1920x1080 resolution minimum
2. Use 30 FPS
3. Keep mouse movements smooth and deliberate
4. Wait for API responses before proceeding
5. Click buttons where subtitles indicate

### After Recording
1. Render with English subtitles burned in
2. Check video length ≤ 5 minutes
3. Verify all permissions are clearly demonstrated
4. Ensure resolution is 720p minimum
5. Test that video plays correctly

## Submission Checklist

- [ ] All 5 permissions demonstrated with clear end-to-end flows
- [ ] English subtitles included (burned or as sidecar file)
- [ ] Video length ≤ 5 minutes
- [ ] Video resolution ≥ 720p
- [ ] All API calls visible (network tab shown or subtitles indicate)
- [ ] Complete OAuth flow shown (including permission consent screen)
- [ ] Test account credentials provided to Meta
- [ ] No sensitive data exposed (real passwords, API keys)
- [ ] Smooth UI navigation without errors

## Related Documentation

- **Recording Instructions**: `RECORDING_INSTRUCTIONS.md`
- **Submission Notes**: `SUBMISSION_NOTES.md`
- **Meta App Review Guide**: `META_APP_REVIEW_GUIDE.md`
- **Quick Start**: `QUICK_START.md`

## Support

If you need to adjust timings:
1. Adjust the timestamp in the SRT file (MM:SS,mmm format)
2. Ensure clips don't overlap
3. Maintain subtitle clarity (2-4 seconds minimum per line)
4. Test syncing with video player before final submission
