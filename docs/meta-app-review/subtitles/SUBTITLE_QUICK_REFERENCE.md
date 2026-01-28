# Subtitle Quick Reference

Fast lookup guide for all subtitle files and their content.

## File Listing

```
docs/meta-app-review/subtitles/
├── README.md                          (Overview & usage guide)
├── TIMING_GUIDE.md                    (Detailed timing reference)
├── SUBTITLE_QUICK_REFERENCE.md        (This file)
│
├── ads_management_ko.srt              (Korean - 1:30)
├── ads_management_en.srt              (English - 1:30)
├── ads_read_ko.srt                    (Korean - 2:00)
├── ads_read_en.srt                    (English - 2:00)
├── business_management_ko.srt         (Korean - 1:50)
├── business_management_en.srt         (English - 1:50)
├── pages_show_list_ko.srt             (Korean - 2:00)
├── pages_show_list_en.srt             (English - 2:00)
├── pages_read_engagement_ko.srt       (Korean - 2:15)
└── pages_read_engagement_en.srt       (English - 2:15)
```

## At a Glance

| Permission | Focus | Scenes | Lines | Duration |
|-----------|-------|--------|-------|----------|
| **ads_management** | Create & manage campaigns | Campaign creation form → Success message | 31 | 1:30 |
| **ads_read** | Performance dashboard | KPI cards → Charts → Campaign details | 42 | 2:00 |
| **business_management** | Pixel management | Pixel list → Details → Creation form | 54 | 1:50 |
| **pages_show_list** | Facebook pages list | OAuth → Permission → Page list → Details | 42 | 2:00 |
| **pages_read_engagement** | Page analytics | Analytics tab → Metrics → Posts → Charts | 45 | 2:15 |

**Total**: 10 files, ~540 subtitles, ~9 minutes (trim to ≤5 minutes for submission)

---

## Permission Purpose (One-liner)

```
ads_management        Create, update, pause, and delete advertising campaigns
ads_read              Fetch campaign performance data (KPI, metrics, analytics)
business_management   Manage Meta Pixels for conversion tracking
pages_show_list       Retrieve list of managed Facebook Pages
pages_read_engagement Fetch engagement metrics from Facebook Pages
```

## Key API Calls by Permission

```
ads_management
└─ POST /act_{account-id}/campaigns          (create campaign)
└─ POST /{campaign-id}                       (update status)

ads_read
├─ GET /act_{account-id}/insights            (KPI metrics)
└─ GET /act_{account-id}/campaigns           (campaign list with insights)

business_management
├─ GET /me/businesses                        (list businesses)
└─ GET /{business-id}/adspixels              (list pixels)
└─ POST /{business-id}/adspixels             (create pixel)

pages_show_list
└─ GET /me/accounts                          (list managed pages)

pages_read_engagement
├─ GET /{page-id}/insights                   (page metrics)
└─ GET /{page-id}/posts                      (posts with engagement)
```

---

## Screen by Screen Guide

### ads_management (1:30)
1. Campaign creation form
2. Form fields (name, objective, budget, dates)
3. "Sync to Meta" toggle
4. Success message
5. Campaign list with new campaign
6. Campaign pause/resume (optional)

### ads_read (2:00)
1. Dashboard main page
2. KPI cards (ROAS, Spend, Conversions, CTR)
3. Spend trend chart
4. ROAS trend chart
5. Campaign performance table
6. Campaign detail page with full metrics

### business_management (1:50)
1. Pixel management page
2. Connected pixels list
3. Pixel detail view
4. Installation code display
5. "Copy Installation Code" button
6. New pixel creation form (optional)

### pages_show_list (2:00)
1. Settings > Meta Pages Management
2. OAuth login dialog
3. Permission consent screen (5 permissions)
4. Facebook pages list
5. Page details (name, category, followers)
6. Multiple pages selection (optional)

### pages_read_engagement (2:15)
1. Page detail page
2. "View Analytics" tab
3. Engagement metrics cards (fans, impressions, engaged users)
4. Recent posts with engagement
5. Daily engagement trend chart
6. Engagement type breakdown (likes/comments/shares)

---

## Subtitle Content Summary

### ads_management_en.srt
**Lines**: 31 | **Duration**: 1:30

Lines 1-3: Introduction to ads_management
Lines 4-10: Campaign creation form walkthrough
Lines 11-15: Form completion and "Sync to Meta"
Lines 16-27: Campaign creation API call and success
Lines 28-31: Pause/resume and summary

**Key Phrases**:
- "Create and manage advertising campaigns"
- "POST /act_{account-id}/campaigns"
- "Immediately reflected in Meta Ads Manager"

---

### ads_read_en.srt
**Lines**: 42 | **Duration**: 2:00

Lines 1-3: Introduction to ads_read
Lines 4-12: KPI cards display
Lines 13-24: Chart visualization
Lines 25-33: Campaign list and selection
Lines 34-42: Campaign details and summary

**Key Phrases**:
- "Real-time campaign performance data"
- "GET /act_{account-id}/insights"
- "KPI dashboard"

---

### business_management_en.srt
**Lines**: 54 | **Duration**: 1:50

Lines 1-6: Introduction and navigation
Lines 7-12: Pixel list loading via API
Lines 13-22: Display pixel details
Lines 23-30: Installation code display and copy
Lines 31-42: New pixel creation form
Lines 43-54: Summary and value proposition

**Key Phrases**:
- "Manage business assets like Meta Pixels"
- "GET /me/businesses"
- "POST /{business-id}/adspixels"

---

### pages_show_list_en.srt
**Lines**: 42 | **Duration**: 2:00

Lines 1-6: Introduction and navigation
Lines 7-14: OAuth login flow
Lines 15-22: Permission consent (all 5 visible)
Lines 23-32: Page list with details
Lines 33-42: Page selection and summary

**Key Phrases**:
- "View their managed Facebook Pages"
- "GET /me/accounts"
- "pages_show_list permission"

---

### pages_read_engagement_en.srt
**Lines**: 45 | **Duration**: 2:15

Lines 1-6: Introduction and navigation
Lines 7-18: Engagement metrics display
Lines 19-29: Recent posts with engagement data
Lines 30-40: Engagement trend charts
Lines 41-45: Summary and value

**Key Phrases**:
- "Read engagement data from Facebook Pages"
- "GET /{page-id}/insights"
- "Likes, Comments, Shares"

---

## Using This Guide

### For Recording
1. Open the relevant `.srt` file (e.g., `ads_management_en.srt`)
2. Read through entire file to understand flow
3. Note the timing markers (00:00:00 --> 00:00:03)
4. Record screen following the subtitle progression
5. Sync your actions to subtitle timestamps

### For Editing
1. Export raw video of all recordings
2. Cut video into scenes by permission
3. Synchronize cuts to subtitle timing
4. Render with subtitles using FFmpeg:
   ```bash
   ffmpeg -i demo.mp4 -vf subtitles=ads_management_en.srt output.mp4
   ```
5. Verify subtitle timing matches video content

### For Troubleshooting

**Subtitle appears too early/late**:
- Adjust subtitle start/end times in SRT file
- Format: MM:SS,mmm (e.g., 00:00:03,000)

**Text is hard to read**:
- Increase video resolution to 1920x1080
- Ensure video bitrate ≥ 2500 kbps
- Use dark background for text visibility

**Timing doesn't match video**:
- Check if video was sped up/slowed down
- Adjust all subtitle times proportionally
- Example: If video is 2x speed, halve all times

---

## Format Reference

### SRT File Structure
```
[Sequence Number]
[Start Time] --> [End Time]
[Subtitle Text]
[Blank Line]
```

### Time Format
- **Format**: HH:MM:SS,mmm
- **Example**: 00:00:03,000 = 3 seconds, 0 milliseconds
- **Range**: Hours (00-23), Minutes (00-59), Seconds (00-59), Milliseconds (000-999)

### Subtitle Text Rules
- One or two lines maximum per subtitle
- Keep text concise (fit on screen at 720p)
- No special characters unless supported by player

---

## Encoding/Export Reference

### FFmpeg Burn Subtitles
```bash
# Simple (uses default styling)
ffmpeg -i input.mp4 -vf subtitles=subtitles.srt output.mp4

# With quality settings
ffmpeg -i input.mp4 \
  -vf subtitles=subtitles.srt \
  -c:v libx264 -crf 23 \
  -c:a aac -b:a 128k \
  output.mp4

# Multiple subtitle files
ffmpeg -i input.mp4 \
  -vf "subtitles=ads_management_en.srt" \
  output.mp4
```

### VLC Player (Verify Sync)
1. Open video file
2. Drag .srt file onto VLC window
3. Subtitles load automatically
4. Use keyboard: J/K to adjust sync by 500ms
5. Save changes: Tools > Preferences > Subtitles > Save

---

## Validation Checklist

Before submitting video to Meta:

- [ ] All 10 .srt files created successfully
- [ ] Both Korean and English versions exist for each permission
- [ ] SRT format is valid (test opening in VLC)
- [ ] All timestamps are in MM:SS,mmm format
- [ ] No overlapping subtitle times
- [ ] Total content duration ~5 minutes or less
- [ ] All 5 permissions clearly demonstrated
- [ ] API calls visible in subtitles or on screen
- [ ] Permission consent screen shows all 5 permissions
- [ ] Video resolution ≥ 720p
- [ ] Subtitles burned into video (not sidecar file)
- [ ] Video exports to MP4 successfully
- [ ] No sensitive data visible (passwords, API keys)

---

## Glossary

| Term | Definition |
|------|-----------|
| **SRT** | SubRip Subtitle format (plain text, standard for video) |
| **Burn** | Embed subtitles permanently into video file |
| **Sync** | Align subtitle timing with video content |
| **API Call** | Request to Meta's Graph API shown in browser network tab |
| **OAuth** | Open Authorization flow (login with Facebook) |
| **Permission** | User-granted access level for specific operations |
| **Insight** | Analytics data from Meta (performance metrics) |
| **CPC** | Cost Per Click |
| **CTR** | Click-Through Rate |
| **ROAS** | Return on Ad Spend |

---

## Related Files

- `README.md` - Full guide and usage instructions
- `TIMING_GUIDE.md` - Detailed scene-by-scene timing breakdown
- `META_APP_REVIEW_GUIDE.md` - Overall review process guide
- `RECORDING_INSTRUCTIONS.md` - How to record the demo

---

## Quick Start

1. **Download subtitle files** from `/docs/meta-app-review/subtitles/`
2. **Choose language**: Use `*_en.srt` files for Meta submission
3. **Open in text editor** to review (should be plain text, not binary)
4. **Record video** following subtitle timing
5. **Burn subtitles** into video using FFmpeg
6. **Verify** sync by playing video with subtitles
7. **Submit** to Meta with all required documentation

---

## Support

For questions about specific permission flows, see:
- `META_APP_REVIEW_GUIDE.md` - Permission usage details
- `SUBMISSION_NOTES.md` - API endpoints and implementation notes

For recording and timing issues, see:
- `TIMING_GUIDE.md` - Detailed scene timing breakdown
- `RECORDING_INSTRUCTIONS.md` - Recording setup and best practices
