# Meta App Review - Subtitle Files

Complete subtitle package for Meta app review demo videos.

## What's Included

Comprehensive subtitle files (Korean + English) for demonstrating all 5 required Meta permissions:

```
docs/meta-app-review/subtitles/
├── 📖 README.md                          Complete guide and usage instructions
├── ⏱️  TIMING_GUIDE.md                    Detailed scene-by-scene timing reference
├── 🚀 SUBTITLE_QUICK_REFERENCE.md        Quick lookup and cheat sheet
│
├── 📹 Video Files (10 .srt subtitle files)
│
├── ads_management_ko.srt                 Campaign creation/management (Korean)
├── ads_management_en.srt                 Campaign creation/management (English)
├── ads_read_ko.srt                       Performance dashboard (Korean)
├── ads_read_en.srt                       Performance dashboard (English)
├── business_management_ko.srt            Pixel management (Korean)
├── business_management_en.srt            Pixel management (English)
├── pages_show_list_ko.srt                Facebook pages list (Korean)
├── pages_show_list_en.srt                Facebook pages list (English)
├── pages_read_engagement_ko.srt          Page engagement analytics (Korean)
└── pages_read_engagement_en.srt          Page engagement analytics (English)
```

## Quick Navigation

### For Recording
**Start here**: `TIMING_GUIDE.md`
- Detailed timing for each scene (0:00-9:00)
- Action-by-action breakdown
- API calls to display
- Recording setup checklist

### For Understanding
**Start here**: `SUBTITLE_QUICK_REFERENCE.md`
- One-page overview of all permissions
- API calls summary
- File listing and at-a-glance reference
- Format reference and validation checklist

### For Implementation
**Start here**: `README.md`
- Complete usage guide
- How to use subtitles in your video
- Format explanation (SRT)
- Submission best practices

---

## File Summary

| File | Purpose | Lines | Duration |
|------|---------|-------|----------|
| **ads_management** | Demonstrate campaign creation and management | 31 | 1:30 |
| **ads_read** | Show real-time performance analytics dashboard | 42 | 2:00 |
| **business_management** | Show Meta Pixel setup and management | 54 | 1:50 |
| **pages_show_list** | Show Facebook Pages discovery and selection | 42 | 2:00 |
| **pages_read_engagement** | Show page engagement analytics and insights | 45 | 2:15 |

**Total**: 214 subtitle lines, ~9 minutes (trim to ≤5 minutes for Meta submission)

---

## The 5 Permissions Explained

### 1. ads_management (Campaign Management)
**What it does**: Create, edit, pause, and delete advertising campaigns
**Demonstrated in**: Campaign creation form → Success → Pause/Resume
**API**: `POST /act_{account-id}/campaigns`, `POST /{campaign-id}`

### 2. ads_read (Performance Dashboard)
**What it does**: Fetch real-time campaign performance metrics
**Demonstrated in**: KPI cards → Charts → Campaign details
**API**: `GET /act_{account-id}/insights`, `GET /act_{account-id}/campaigns`

### 3. business_management (Pixel Management)
**What it does**: Manage Meta Pixels for conversion tracking
**Demonstrated in**: Pixel list → Details → Installation code → Creation
**API**: `GET /me/businesses`, `GET /{business-id}/adspixels`, `POST /{business-id}/adspixels`

### 4. pages_show_list (Facebook Pages)
**What it does**: List all Facebook Pages managed by the user
**Demonstrated in**: OAuth → Permission consent → Page list → Details
**API**: `GET /me/accounts`

### 5. pages_read_engagement (Page Analytics)
**What it does**: Read engagement metrics from Facebook Pages
**Demonstrated in**: Analytics dashboard → Posts → Trends → Charts
**API**: `GET /{page-id}/insights`, `GET /{page-id}/posts`

---

## Quick Start (3 Steps)

### Step 1: Choose Language
Use the **English** files (`*_en.srt`) for Meta submission as per their requirements.

### Step 2: Record Your Demo
Follow the timing in `TIMING_GUIDE.md` to record your app demo, synchronized with subtitle timing.

### Step 3: Burn Subtitles into Video
```bash
ffmpeg -i demo.mp4 -vf subtitles=ads_management_en.srt output.mp4
```

---

## Recording Requirements

### What to Show
- ✅ Complete Facebook OAuth login flow
- ✅ Permission consent screen (all 5 permissions visible)
- ✅ Each permission's functionality with real data
- ✅ API calls being executed (network tab or result display)
- ✅ End-to-end user experience

### Video Specs
- **Duration**: ≤ 5 minutes
- **Resolution**: ≥ 720p (1920x1080 recommended)
- **Frame Rate**: 24-30 FPS
- **Format**: MP4 (H.264 + AAC)
- **Subtitles**: Burned into video (English required)
- **Audio**: Not required (Meta doesn't review audio)

### What NOT to Show
- ❌ Real passwords or API keys
- ❌ Actual user data (use test accounts)
- ❌ Errors or failed API calls
- ❌ Blank screens or loading indefinitely

---

## Using the Subtitles

### As a Script During Recording
Each subtitle shows:
1. **What's happening**: Description of the action
2. **When it happens**: Exact timestamp in video
3. **What to show**: Screen content to display
4. **API calls**: Graph API endpoints being called

Example from `ads_management_en.srt`:
```
13
00:00:36,000 --> 00:00:39,000
API call: POST /act_{account-id}/campaigns

14
00:00:39,000 --> 00:00:42,000
The campaign has been successfully created in Meta.
```

### As Documentation for Meta
Meta reviewers will see the subtitles explaining:
- Purpose of each permission
- How it's used in your app
- Which APIs are called
- What user experience is provided

### For Your Team
Reference the timing guide to understand:
- Expected video structure
- Estimated duration for each scene
- Sync points with subtitles
- Recording order and flow

---

## Key Metrics to Display

### ads_read (Performance Data)
- ROAS: 3.45
- Spend: ₩1,234,567
- Conversions: 358
- CTR: 2.34%
- Impressions: 145,678
- Clicks: 3,421

### pages_read_engagement (Engagement Data)
- Fans: 15,234
- Impressions: 125,678
- Engaged Users: 8,934
- Total Engagement: 23,456
- Top metrics: Post likes, comments, shares

### pages_show_list (Page Info)
- Page names and categories
- Follower counts
- Page IDs
- Page status (Active/Inactive)

---

## Subtitle Format (SRT)

Standard SubRip format (plain text):

```
1
00:00:00,000 --> 00:00:03,000
Subtitle line 1

2
00:00:03,000 --> 00:00:06,000
Subtitle line 2
```

**Rules**:
- Sequence numbers: 1, 2, 3... (in order)
- Timestamps: HH:MM:SS,mmm format
- Text: 1-2 lines per subtitle
- Blank lines between subtitles (required)

---

## Tools You'll Need

### Recording
- **OBS Studio** (free, recommended) - `brew install --cask obs`
- **QuickTime Player** (macOS built-in) - File > New Screen Recording
- **ScreenFlow** (macOS, paid)
- **Playwright** (automated recording)

### Subtitle Synchronization
- **VLC Media Player** (verify subtitles)
- **FFmpeg** (burn subtitles) - `brew install ffmpeg`
- **DaVinci Resolve** (timeline editing)
- **Adobe Premiere** (professional editing)

### Validation
- **MediaInfo** (check video specs)
- **VLC** (playback test)
- **Any SRT validator** (subtitle format check)

---

## Timing Overview

```
Total: ~9 minutes (edit down to ≤5 minutes)

Scene | Content                | Duration
------|------------------------|----------
1     | App intro              | 0:30
2     | OAuth flow             | 1:00
3     | pages_show_list        | 0:30
4     | pages_read_engagement  | 2:15
5     | business_management    | 0:50
6     | ads_read               | 2:00
7     | ads_management         | 1:30
8     | Outro                  | 0:25
      | TOTAL                  | 9:00
```

**For 5-minute submission**: Reduce chart display times and combine some steps.

---

## Validation Checklist

Before uploading to Meta:

### Content
- [ ] All 5 permissions clearly demonstrated
- [ ] OAuth login flow complete start-to-finish
- [ ] Permission consent screen shows all 5 permissions
- [ ] No errors or failed API calls
- [ ] Real data displayed (not placeholder/mock)
- [ ] All screens mentioned in subtitles are shown

### Technical
- [ ] Video duration ≤ 5 minutes
- [ ] Resolution ≥ 720p (ideally 1920x1080)
- [ ] Frame rate 24-30 FPS
- [ ] MP4 format (H.264 + AAC)
- [ ] English subtitles burned into video
- [ ] No audio glitches or missing segments

### Security
- [ ] No real passwords visible
- [ ] No real API keys visible
- [ ] No personal information
- [ ] Test account used throughout

### Documentation
- [ ] Subtitles sync with video content
- [ ] All API calls clearly mentioned
- [ ] Each permission's purpose clear
- [ ] User value proposition obvious

---

## Next Steps

1. **Review** `SUBTITLE_QUICK_REFERENCE.md` for quick overview
2. **Read** `TIMING_GUIDE.md` for detailed scene timing
3. **Open** relevant `.srt` files as you record
4. **Follow** subtitle timing to synchronize actions
5. **Burn** subtitles into video with FFmpeg
6. **Verify** sync and quality before submission
7. **Submit** to Meta with all required documentation

---

## Documentation References

For more information, see:

- `docs/meta-app-review/META_APP_REVIEW_GUIDE.md` - Overall review process
- `docs/meta-app-review/SUBMISSION_NOTES.md` - Detailed API notes
- `docs/meta-app-review/RECORDING_INSTRUCTIONS.md` - Recording setup
- `docs/meta-app-review/QUICK_START.md` - Quick start guide

---

## Support Resources

### Meta Documentation
- [Meta App Review Process](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review)
- [Graph API Permissions](https://developers.facebook.com/docs/permissions)
- [Screencast Requirements](https://developers.facebook.com/docs/resp-plat-initiatives/individual-processes/app-review#screencast-requirements)

### Subtitle Tools
- [SRT Format Reference](https://en.wikipedia.org/wiki/SubRip)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [VLC User Guide](https://www.videolan.org/vlc/)

---

## File Sizes

All subtitle files are lightweight (plain text):
- Each `.srt` file: ~3-5 KB
- Documentation files: ~50-100 KB
- Total package: < 1 MB

Can be easily version controlled with git.

---

## Last Updated

Created: January 23, 2026
Location: `/Users/jm/batwo-maketting service-saas/docs/meta-app-review/subtitles/`

For the latest files, check the subtitles directory.
