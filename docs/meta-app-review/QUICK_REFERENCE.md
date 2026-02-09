# Recording Script - Quick Reference

**File Location:** `/docs/meta-app-review/RECORDING_SCRIPT.md`

## At a Glance

| Item | Details |
|------|---------|
| **Total Duration** | 8:40 - 9:30 |
| **Resolution** | 1920x1080 @ 30fps |
| **Format** | MP4, H.264, < 100MB |
| **Narration** | English (clear, slow pace) |
| **Scenes** | 9 (Scene 8 is optional bonus) |

## Timing Breakdown

```
Scene 1: Introduction          0:00 - 0:30  (30s)
Scene 2: OAuth ⭐ CRITICAL    0:30 - 1:45  (75s)
Scene 3: pages_show_list      1:45 - 2:50  (65s)
Scene 4: pages_read_engagement 2:50 - 4:00 (70s)
Scene 5: business_management   4:00 - 5:15 (75s)
Scene 6: ads_read             5:15 - 6:45  (90s)
Scene 7: ads_management       6:45 - 8:10  (85s)
Scene 8: AI Chat (BONUS)      8:10 - 9:00  (50s)
Scene 9: Summary              9:00 - 9:30  (30s)
                               TOTAL: 9:30
```

**Without Scene 8: 8:40 total** (recommended)

## 5 Meta Permissions Demonstrated

| Permission | Scene | Duration | Key Demo |
|------------|-------|----------|----------|
| `pages_show_list` | 3 | 65s | Display Facebook Pages list |
| `pages_read_engagement` | 4 | 70s | Show engagement metrics |
| `business_management` | 5 | 75s | Meta Pixel management |
| `ads_read` | 6 | 90s | KPI dashboard & charts |
| `ads_management` | 7 | 85s | Create & pause campaigns |

## Critical Success Points

1. **Scene 2 (OAuth)** - 45 seconds showing ALL 5 permissions in consent screen
2. **Natural Pacing** - Don't rush; let pages load and actions complete naturally
3. **API Indicators** - Use `?showApiSource=true` parameter to show API badges
4. **Complete Workflows** - Every action: start → action → result (no incomplete tasks)
5. **Test First** - Run through entire workflow manually before recording

## Pre-Recording Essentials

- [ ] `npm run dev` running
- [ ] `META_MOCK_MODE=true` in .env
- [ ] Browser at 1920x1080
- [ ] Test user logged in
- [ ] Test data created (pages, pixels, campaigns)
- [ ] Microphone tested
- [ ] Cache cleared

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| OAuth screen not showing | Check app ID in env vars, try fresh browser window |
| API data not loading | Verify Meta tokens valid, check browser console |
| Recording too long | Skip Scene 8 (AI Chat bonus) |
| Recording too short | Slow down pacing naturally, add more interactions |
| Permission list unclear | Ensure 1920x1080 zoom at 100%, pan slowly |

## Post-Recording Checklist

- [ ] 1920x1080 resolution confirmed
- [ ] 8:00 - 9:30 duration
- [ ] 30fps, no stuttering
- [ ] Clear audio, good narration levels
- [ ] All scenes present and complete
- [ ] No system notifications visible
- [ ] No personal data exposed
- [ ] File < 100MB, MP4 format

## Key Narration Points

**Scene 1:** "This is Batwo, an AI-powered marketing solution..."

**Scene 2:** "The user sees a consent screen listing all five permissions we request..."

**Scene 3:** "pages_show_list allows Batwo to retrieve managed Facebook Pages..."

**Scene 4:** "pages_read_engagement allows us to access detailed engagement metrics..."

**Scene 5:** "business_management grants us access to Meta Pixels..."

**Scene 6:** "ads_read is the foundation of our real-time KPI dashboard..."

**Scene 7:** "ads_management enables full campaign lifecycle management..."

**Scene 8:** "As a bonus feature, Batwo includes an AI Chat Assistant..." (OPTIONAL)

**Scene 9:** "To summarize, Batwo successfully integrates with Meta..."

## Related Documents

- **Full Script:** `RECORDING_SCRIPT.md` (807 lines, comprehensive)
- **Approval Guide:** `GUARANTEED_APPROVAL_GUIDE.md` (success criteria)
- **Recording Setup:** `RECORDING_INSTRUCTIONS.md` (camera/audio setup)
- **Subtitles:** `subtitles/` directory (pre-written English subs)

## Meta Submission Tips

1. **Test Credentials:** Provide to Meta separately (not in video)
2. **Description:** Use template from script
3. **Video Title:** "Batwo App Demo - Full Feature Walkthrough"
4. **File Naming:** Follow Meta convention: `batwo-demo-resubmission.mp4`
5. **Upload:** Use Meta App Review portal

---

**Created:** 2026-02-09
**Status:** Production Ready
**Last Updated:** 2026-02-09
