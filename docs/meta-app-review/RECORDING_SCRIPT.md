# Meta App Review - Recording Script (Resubmission Phase 3.3)

**Version:** 1.0 (Production Ready)
**Created:** 2026-02-09
**Status:** Ready for Recording
**Purpose:** Address "Screencast doesn't show end-to-end experience" rejection
**Target Duration:** 7:30 - 8:30 total
**Format:** 1920x1080 @ 30fps, MP4, < 100MB
**Language:** Korean UI with English narration/subtitles

---

## Overview & Critical Success Factors

### Why This Script Will Succeed

This script addresses Meta's specific rejection reason by:

1. **End-to-End Workflows**: Each permission demonstrates complete user journeys (create → verify → confirm)
2. **60-90 Seconds Per Permission**: Each of the 5 permissions gets dedicated time with multiple actions
3. **Clear API Attribution**: OAuth consent screen shows ALL 5 permissions explicitly, API source badges visible throughout
4. **Natural Pacing**: No rushed clicking, deliberate waits for load states, smooth transitions
5. **Functional Demonstration**: Real data flow, not static mockups - users see actual app functionality
6. **Visual Clarity**: 1920x1080 ensures permission dialogs, API badges, and data tables are readable

### Previous Rejection Analysis

**What Failed Before:**
- Permission demonstrations were too brief (30-45 seconds)
- OAuth consent screen was unclear or cut off
- No visible indication of API data sources
- Incomplete workflows (showed creation but not confirmation)

**What This Script Fixes:**
- Structured timing ensures each permission gets proper screen time
- Scene 2 focuses entirely on OAuth consent with clear 5-permission view
- Scene 3-7 each include "API Indicators" sections
- Every action flows from start to natural completion
- Bonus Scene 8 shows advanced features (AI Chat) to demonstrate app value

---

## Pre-Recording Checklist

### Technical Setup (Complete Before Recording)

- [ ] **Development Server**: `npm run dev` running, no errors in console
- [ ] **Environment**: `META_MOCK_MODE=true` in `.env` (or real test Meta account)
- [ ] **Test User**: Logged into dashboard with test credentials
- [ ] **Resolution**: Browser window at exactly 1920x1080
- [ ] **Screen Recording**: OBS/ScreenFlow/QuickTime ready with:
  - [ ] 1920x1080 resolution
  - [ ] 30fps frame rate
  - [ ] System audio + microphone audio (separate tracks if possible)
- [ ] **Browser Configuration**:
  - [ ] Cache cleared (Cmd+Shift+R refresh before recording)
  - [ ] No browser extensions visible (ad blockers, etc.)
  - [ ] Bookmarks bar hidden
  - [ ] Developer tools closed
  - [ ] Dark mode or light mode consistent throughout
- [ ] **URL Parameters**: Know how to append `?showApiSource=true` for API badges
- [ ] **Preparation Content**:
  - [ ] Subtitles prepared (English, see `subtitles/` directory)
  - [ ] Narration script printed or copied to notes
  - [ ] Campaign/page test data pre-created for demos
  - [ ] Test Meta Pixel IDs ready to reference

### Content Prep Checklist

- [ ] **Meta Pages**: At least one test Facebook Page connected and accessible
- [ ] **Meta Pixel**: At least one test Meta Pixel available (or create one during demo)
- [ ] **Test Campaigns**: Create 1-2 inactive campaigns beforehand for Scene 7 demo
- [ ] **KPI Data**: Dashboard populated with sample data (use seed data if available)
- [ ] **AI Assistant**: Ensure chatbot is functional and has mock responses ready

### Environmental Checklist

- [ ] **Network**: Stable internet connection (test Meta API calls first)
- [ ] **Microphone**: Working and at good volume level
- [ ] **Lighting**: Consistent screen lighting, no glare
- [ ] **Interruptions**: Phone silent, Slack notifications off, Slack status "Do Not Disturb"
- [ ] **Recording Location**: Quiet room, minimal background noise
- [ ] **Time Allocation**: 15-20 minutes for full recording + retakes

---

## Recording Script - Detailed Scenes

### Scene 1: Introduction & Landing (0:00 - 0:30) [30 seconds]

**Objective**: Establish what Batwo is, set context for Meta permission usage

**Pre-Scene Actions**:
1. Open fresh browser window at 1920x1080
2. Navigate to Batwo landing page (home page or `/`)
3. Wait for full load (2-3 seconds)

**On-Screen Actions**:

1. **Landing Page View** (0:00 - 0:10) [10s]
   - Show landing page with Batwo logo clearly visible
   - Let viewer see the value proposition
   - No interaction needed - let it load naturally

2. **Login Action** (0:10 - 0:20) [10s]
   - Click "Log In" or "Dashboard" button
   - Wait for login form to render
   - Enter test credentials (username: `test@batwo.app`, password: visible if you want, or use mock-auth)
   - Press Enter/click Submit

3. **Dashboard Arrival** (0:20 - 0:30) [10s]
   - Wait for dashboard to fully load (KPI cards render)
   - Let camera focus on main dashboard layout
   - Pause briefly to let viewer absorb the interface

**Narration (English - Read slowly, clear pronunciation)**:

> "This is Batwo, an AI-powered marketing solution for e-commerce businesses. Our platform helps manage Meta advertising campaigns with intelligent automation and AI assistance. To use Batwo, users need to connect their Meta accounts. Let me walk you through each permission we request and how we use them."

**Camera Positioning**:
- Keep entire screen visible
- No zooming or panning
- Natural browser UI showing URL bar

**Timing Notes**:
- This is the "hook" scene - establish credibility and context
- Move deliberately but naturally (not rushed)
- By end of scene, dashboard should be fully visible and responsive

---

### Scene 2: OAuth Connection & Permission Consent (0:30 - 1:45) [75 seconds]

**Objective**: Demonstrate the Meta OAuth flow and show all 5 permissions clearly

**Critical**: This addresses the "OAuth consent screen" feedback from previous rejection

**Pre-Scene Actions**:
1. While still on dashboard, open browser developer tools (F12)
2. Navigate to Settings page (`/settings/meta-connect`)
3. Prepare to click "Connect Meta Account" button

**On-Screen Actions**:

1. **Navigate to Settings** (0:30 - 0:40) [10s]
   - Click Settings icon in sidebar or navigation menu
   - Let page load
   - Show "Meta Connect" section clearly

2. **Initiate OAuth** (0:40 - 0:50) [10s]
   - Click "Connect Meta Account" or similar button
   - Show button click feedback (hover state, then click)
   - Wait for Meta OAuth redirect (will open new window or redirect)

3. **Meta OAuth Consent Screen** (0:50 - 1:35) [45s] **⭐ CRITICAL SECTION**
   - **PAUSE RECORDING HERE** if needed to let consent screen load
   - Once loaded, let camera focus on the permission list
   - Meta will show the 5 permissions with checkboxes
   - **DO NOT SKIP THIS** - let it display for 30+ seconds
   - Pan slowly across all 5 permissions if possible (or zoom in on permission list)
   - Read permission descriptions aloud
   - This single action justifies ~45 seconds of screen time

4. **Approve Permissions** (1:35 - 1:45) [10s]
   - Click "Continue" or "Allow" button
   - Wait for redirect back to Batwo
   - Show success message (e.g., "Meta account connected" or similar)

**Narration (English)**:

> "To connect a Meta account, Batwo initiates the standard Meta OAuth flow. The user sees a consent screen listing all five permissions we request. Each permission has a specific purpose in our application. First, pages_show_list allows us to retrieve the user's managed Facebook Pages. Second, pages_read_engagement gives us access to page engagement metrics. Third, business_management allows us to access Meta Pixels configured in the user's business account. Fourth, ads_read enables our dashboard to fetch campaign performance data. And fifth, ads_management lets users create and manage campaigns directly from Batwo. After approving all permissions, the user is returned to the app with full access."

**Camera Positioning**:
- **FULL SCREEN**: Show entire permission list
- If list is long, pan down slowly to show all 5 permissions
- Ensure text is readable at 1920x1080 (it should be)
- No zooming required if resolution is correct

**Visual Quality Requirements**:
- Permission text must be legible
- OAuth dialog must not be obscured
- Natural Meta branding visible
- Show this took ~45 seconds - not rushed

**Timing Notes**:
- This scene is longer than others because permission clarity is critical
- Allocate 45 seconds just to showing the consent screen
- Remaining 30 seconds for navigation and approval
- Meta reviewers NEED to see all 5 permissions clearly

**API Indicators**: N/A (this is OAuth, not API calls)

---

### Scene 3: pages_show_list - Display Managed Pages (1:45 - 2:50) [65 seconds]

**Objective**: Demonstrate retrieving and displaying Facebook Pages using `pages_show_list` permission

**Permission Being Demonstrated**: `pages_show_list`

**Pre-Scene Setup**:
- Have at least 1-2 test Facebook Pages prepared in your Meta test account
- Know the page names and IDs

**On-Screen Actions**:

1. **Navigate to Pages Management** (1:45 - 1:55) [10s]
   - From Settings or dashboard, click "Meta Pages" or "Manage Pages"
   - Navigate to URL like `/settings/meta-pages` or `/pages`
   - Wait for page to load

2. **Show Pages List Loading** (1:55 - 2:10) [15s]
   - Let the pages list render from Meta API
   - Show loading spinner if visible, then the populated list
   - List should show: Page Names, Page IDs, Profile Pictures, Status (connected/disconnected)
   - Wait for all pages to fully load - don't rush this

3. **Interact with Page List** (2:10 - 2:35) [25s]
   - **Action 1**: Hover over one page to show interaction states
   - **Action 2**: Click one page to select it or view details
   - **Action 3**: Show page details load (if applicable)
   - **Action 4**: If available, show "Copy Page ID" button functionality
   - **Action 5**: Demonstrate page is now "selected" or "active"

4. **Confirm Selection** (2:35 - 2:50) [15s]
   - Show confirmation that page selection persisted
   - If there's a "Save" button, click it
   - Show success notification or confirmation message
   - Natural pace - let the app respond between actions

**Narration (English)**:

> "The pages_show_list permission allows Batwo to retrieve the user's managed Facebook Pages from their Meta account. When the user navigates to the Pages management section, we query the Meta Graph API to list all pages they have access to. Each page is displayed with its name, ID, and profile picture. Users can select which page they want to use for their advertising campaigns. This foundational permission enables all downstream campaign features."

**API Indicators** (if using `?showApiSource=true`):
- Look for badge/indicator showing: "Data Source: Meta API - GET /me/accounts"
- Or similar endpoint reference
- If badge is visible, let camera focus on it for 3-5 seconds

**Camera Positioning**:
- Show list clearly
- Make sure page names and IDs are readable
- If possible, show one page being selected/highlighted

**Visual Quality**:
- No flickering when list loads
- Smooth transitions between states
- Clear typography on page names

**Timing Notes**:
- 15 seconds for list to load is generous - most APIs respond in <2 seconds
- Use remaining time to interact and explore the list
- This demonstrates the permission is live and functional

---

### Scene 4: pages_read_engagement - Display Engagement Analytics (2:50 - 4:00) [70 seconds]

**Objective**: Show page engagement metrics retrieved via `pages_read_engagement` permission

**Permission Being Demonstrated**: `pages_read_engagement`

**Pre-Scene Setup**:
- Ensure test page has sample engagement data (or use mock data)
- Know approximate metrics (likes, comments, shares, reach) you'll show

**On-Screen Actions**:

1. **Navigate to Engagement Section** (2:50 - 3:00) [10s]
   - Click on a page from the previous list (or go to dedicated engagement page)
   - Or navigate to URL like `/pages/{pageId}/engagement` or `/dashboard?page={pageId}`
   - Wait for page to load

2. **Show Engagement Metrics** (3:00 - 3:30) [30s]
   - Let viewer see all engagement data:
     - Total Reach
     - Total Impressions
     - Likes (page likes + post likes)
     - Comments
     - Shares
     - Clicks
     - Follower Growth (if available)
   - Pause on each metric for 3-5 seconds so viewer can read
   - If there's a visualization/chart, let it render

3. **Show Trend Data** (3:30 - 3:50) [20s]
   - If available, show engagement trends over time (7-day, 30-day, etc.)
   - Show a chart or graph with engagement over time
   - Point out trend direction (increasing/decreasing) by reading metric values
   - Let chart render and stabilize before moving on

4. **Highlight Insights** (3:50 - 4:00) [10s]
   - If the app has engagement insights or recommendations, show them
   - Or simply point out a high/low metric and pause there
   - Conclude that this data helps inform campaign decisions

**Narration (English)**:

> "With the pages_read_engagement permission, we can access detailed engagement metrics for the user's Facebook Pages. This includes reach, impressions, likes, comments, shares, and click data. Our dashboard displays these metrics in an easy-to-understand format with visual charts showing trends over time. The engagement analytics help users understand their audience better and make informed decisions about their content and advertising strategy."

**API Indicators** (if visible):
- Badge should show: "Data Source: Meta API - GET /{page-id}/insights"
- Or reference to insights endpoint
- Make sure badge is visible during metric display

**Camera Positioning**:
- Show metrics table/cards clearly
- If chart is present, show full chart area
- Make sure metric values are readable (numbers should be visible)

**Visual Quality**:
- Smooth chart rendering (no jank)
- Color contrast good for readability
- Proper spacing between metrics

**Timing Notes**:
- 30 seconds for metrics: that's 5-6 seconds per metric if showing 6-7 metrics
- 20 seconds for trend chart: enough time for chart to load and stabilize
- Total 70 seconds shows this is a substantial feature, not an afterthought

---

### Scene 5: business_management - Meta Pixel Management (4:00 - 5:15) [75 seconds]

**Objective**: Demonstrate Meta Pixel listing and selection using `business_management` permission

**Permission Being Demonstrated**: `business_management`

**Pre-Scene Setup**:
- Have at least 1-2 test Meta Pixels available in your Meta Business account
- Know pixel IDs and names
- Optionally prepare pixel configuration/tracking code

**On-Screen Actions**:

1. **Navigate to Pixel Settings** (4:00 - 4:10) [10s]
   - Click Settings → Pixels or navigate to `/settings/pixel`
   - Show sidebar/menu navigation
   - Wait for pixel settings page to load

2. **Show Pixels List Loading** (4:10 - 4:30) [20s]
   - Display list of available Meta Pixels from business account
   - Show each pixel with: Pixel Name, Pixel ID, Status (active/inactive), Created Date
   - Let list fully render
   - If there's a loading state, show it then the final data

3. **Interact with Pixel Selection** (4:30 - 5:00) [30s]
   - **Action 1**: Hover over or click on a pixel to select it
   - **Action 2**: Show pixel becomes highlighted/selected
   - **Action 3**: If available, click "View Details" to show pixel configuration
   - **Action 4**: Demonstrate you can copy pixel ID (if button exists)
   - **Action 5**: Show integration instructions/code snippet for pixel installation

4. **Confirm Selection** (5:00 - 5:15) [15s]
   - Show pixel selection persists
   - If there's a "Save" or "Install" button, click it
   - Show success message or confirmation
   - Show app recognizes pixel is now active/installed

**Narration (English)**:

> "The business_management permission grants us access to Meta Pixels configured in the user's business account. Pixels are essential for conversion tracking on e-commerce sites. In the Pixel management section, users can see all their available pixels, select one for their business, and get setup instructions. Batwo provides an easy-to-follow pixel installation workflow, including copy-paste code snippets for different platforms like Shopify and WooCommerce."

**API Indicators** (if visible):
- Badge: "Data Source: Meta API - GET /{business-id}/pixels"
- Or endpoint reference for pixel listing
- Show badge alongside pixel list for 5+ seconds

**Camera Positioning**:
- Show entire pixels list
- Make pixel names and IDs clearly visible
- If showing pixel configuration code, zoom in on code section slightly

**Visual Quality**:
- Crisp rendering of pixel data
- Good table/list layout
- Code snippet (if shown) is formatted and readable

**Timing Notes**:
- 20 seconds for list to load and render: generous time
- 30 seconds for interaction: plenty of time to interact with multiple pixels
- 15 seconds for confirmation: natural conclusion
- Total 75 seconds shows this is a complete, functional feature

---

### Scene 6: ads_read - KPI Dashboard & Performance Analytics (5:15 - 6:45) [90 seconds]

**Objective**: Demonstrate real-time campaign performance dashboard using `ads_read` permission

**Permission Being Demonstrated**: `ads_read`

**Pre-Scene Setup**:
- Dashboard should have sample campaign data populated
- Ensure KPI cards show realistic values (ROAS, Spend, Conversions, CTR)
- Optionally have 1-2 active campaigns to reference
- Prepare to navigate to dashboard with `?showApiSource=true` parameter

**On-Screen Actions**:

1. **Navigate to Dashboard with API Indicators** (5:15 - 5:25) [10s]
   - Click Dashboard in sidebar or navigate to `/dashboard?showApiSource=true`
   - URL parameter adds API source badges to data sections
   - Wait for dashboard to fully load

2. **Show KPI Cards** (5:25 - 5:55) [30s]
   - Display main KPI cards:
     - ROAS (Return on Ad Spend)
     - Total Spend (₩ or $)
     - Total Conversions
     - CTR (Click-Through Rate)
   - Let each card load and stabilize
   - Point out metrics with cursor (hover over cards)
   - Show metric values are readable
   - **Action**: Click on one KPI card to potentially show more detail or drill-down

3. **Show Performance Charts** (5:55 - 6:25) [30s]
   - Show campaign performance chart(s):
     - Daily spend trend over 30 days
     - Or daily conversions trend
     - Or daily ROAS trend
   - Let chart render with animation
   - If possible, show chart legend with multiple campaigns
   - Hover over chart to show tooltip data (date, value)
   - Demonstrate chart is interactive

4. **Show Active Campaigns Summary** (6:25 - 6:40) [15s]
   - Show list or summary of active campaigns
   - Display campaign name, status (active), current spend, conversions
   - If possible, click on one campaign to show drill-down detail
   - Show campaign-level performance metrics

5. **Highlight AI Insights** (6:40 - 6:45) [5s]
   - If dashboard has "Insights" section, show it briefly
   - Or show AI-generated recommendations
   - Conclude that this data helps inform campaign decisions

**Narration (English)**:

> "The ads_read permission is the foundation of our real-time KPI dashboard. We fetch campaign performance data directly from Meta's Ads API and display it in a clear, actionable format. Users see key metrics at a glance: ROAS, total spend, conversions, and click-through rates. The dashboard includes detailed performance charts showing trends over the past 30 days. Users can drill down into individual campaigns to see campaign-level performance metrics. Our AI also analyzes this data to provide automated insights and optimization suggestions, helping users understand what's working and what needs adjustment."

**API Indicators** (CRITICAL for this scene):
- Multiple API badges should be visible:
  - "Meta Ads API - GET /act_{account-id}/insights" (for account-level KPIs)
  - "Meta Ads API - GET /{campaign-id}/insights" (for campaign detail)
  - "Meta Ads API - GET /act_{account-id}/campaigns" (for campaign list)
- Focus camera on badges for 3-5 seconds each
- This demonstrates data is live from Meta API, not hardcoded

**Camera Positioning**:
- Show full dashboard layout
- Make metric cards readable
- Show charts are fully rendered and interactive
- Ensure no important data is cut off

**Visual Quality**:
- Smooth chart animations
- Clear typography on all metrics
- Good color contrast
- Responsive layout at 1920x1080

**Timing Notes**:
- 90 seconds is longest scene because ads_read is most visually rich
- 30 seconds for KPI cards ensures viewer can read all metrics
- 30 seconds for charts shows interactivity and data visualization quality
- 15 seconds for campaign summary shows drill-down capability
- Total 90 seconds demonstrates the depth of ads_read functionality

---

### Scene 7: ads_management - Campaign Lifecycle Management (6:45 - 8:10) [85 seconds]

**Objective**: Demonstrate complete campaign workflow: create, confirm, pause (using `ads_management` permission)

**Permission Being Demonstrated**: `ads_management`

**Critical**: This is the action scene - shows actual campaign manipulation, not just reading data

**Pre-Scene Setup**:
- Have campaign creation form ready to fill
- Know test values: Campaign name, objective, budget, targeting
- Optional: Pre-create 1-2 test campaigns for pausing demo

**On-Screen Actions**:

1. **Navigate to Campaign Creation** (6:45 - 6:55) [10s]
   - Click "Create Campaign" button
   - Or navigate to `/campaigns/new`
   - Show campaign creation form/wizard loading
   - Wait for form to fully render (all fields visible)

2. **Fill Campaign Form - Part 1** (6:55 - 7:15) [20s]
   - **Field 1**: Campaign Name
     - Click name field
     - Type: "신규 전환 캠페인" (New Conversion Campaign in Korean)
     - Or "Q1 Conversion Campaign" in English
   - **Field 2**: Campaign Objective
     - Click dropdown
     - Select: "Conversions" or "OUTCOME_SALES"
     - Show selection is applied
   - Show form fields clearly as you fill them

3. **Fill Campaign Form - Part 2** (7:15 - 7:35) [20s]
   - **Field 3**: Budget Configuration
     - If daily budget, enter: "₩50,000" (or equivalent in app currency)
     - Or specify budget type and amount
   - **Field 4**: Audience/Targeting (if required)
     - If simplified form, show where targeting would be configured
     - Or skip if not required for MVP
   - Let form validate as you go (no error states if possible)

4. **Submit Campaign** (7:35 - 7:50) [15s]
   - Scroll to bottom of form if needed
   - Click "Create Campaign" or "Submit" button
   - Wait for API call to process (show loading state)
   - Wait for success response/redirect
   - Show confirmation message: "Campaign created successfully" or similar

5. **Verify Campaign in List** (7:50 - 8:05) [15s]
   - After creation, show campaign list or dashboard
   - Show newly created campaign appears in the list
   - Campaign should show: Name (matching what you entered), Status (Active or Draft), Budget
   - Demonstrate campaign exists and is accessible

6. **Pause Campaign (Action Confirmation)** (8:05 - 8:10) [5s]
   - Click on campaign to open its detail/controls
   - Find "Pause" button or status toggle
   - Click Pause
   - Show status changes to "Paused" (if immediate)
   - This demonstrates full lifecycle: create → verify → manage

**Narration (English)**:

> "Finally, the ads_management permission enables full campaign lifecycle management. Users can create new campaigns directly in Batwo with just a few clicks. I'll create a new conversion campaign, specify the objective and daily budget. After submission, the campaign is created in Meta's system and appears immediately in our campaign list. Users can manage campaigns post-creation: pause active campaigns, resume paused campaigns, and edit campaign settings. This complete control over campaign lifecycle is essential for e-commerce businesses running dynamic marketing operations."

**API Indicators** (CRITICAL):
- When submitting form, show: "Meta Ads API - POST /act_{account-id}/campaigns"
- When pausing, show: "Meta Ads API - POST /{campaign-id}" or "PATCH /{campaign-id}"
- API badges should appear and be visible on screen for 5+ seconds each

**Camera Positioning**:
- Show entire form as you fill it
- Make field labels and your input clearly visible
- Show form validation (green checkmarks if applicable)
- Show success message is readable
- Show campaign appears in list after creation

**Visual Quality**:
- Form fields render cleanly
- Input text is visible as you type
- No form validation errors (unless demonstrating error handling)
- Success message is clear and prominent
- Campaign list updates immediately after creation

**Timing Notes**:
- 20 seconds per form section: natural filling speed, not rushed
- 15 seconds for submission + load: realistic API response time
- 15 seconds for verification: ensures campaign actually appears
- 5 seconds for pause action: quick demo of post-creation management
- Total 85 seconds shows this is a complete, functional feature

**Important**: This scene demonstrates the most powerful permission (ads_management). Show it confidently and completely. This is where Meta reviewers see the full value of the app.

---

### Scene 8: AI Chat Assistant - Bonus Feature (8:10 - 9:00) [50 seconds]

**Objective**: Demonstrate conversational AI interaction as advanced feature

**Permission**: Not tied to specific permission (uses data from ads_read/pages_read_engagement)

**Status**: BONUS SCENE - includes this only if you want to showcase advanced features. If short on time, you can skip to Scene 9 (outro).

**Pre-Scene Setup**:
- Chat assistant should be functional
- Have 1-2 pre-written questions ready
- Prepare for AI streaming response with mock data

**On-Screen Actions**:

1. **Open AI Chat Assistant** (8:10 - 8:20) [10s]
   - Click floating chat bubble or chat assistant button
   - Show chat interface open
   - Input field ready for user message
   - Wait for chat to fully load

2. **Ask Performance Question in Korean** (8:20 - 8:35) [15s]
   - Click in message input field
   - Type: "이번 주 캠페인 성과 어때?" (How's this week's campaign performance?)
   - Or ask about: "가장 좋은 광고는?" (What's the best ad?)
   - Press Enter to submit
   - Show message appears in chat

3. **Show AI Response with Data Card** (8:35 - 8:55) [20s]
   - AI response streams in (show text streaming if available)
   - Response includes performance data card with:
     - Total Spend (this week)
     - Total Conversions (this week)
     - ROAS (this week)
     - Trend indicator (up/down)
   - Data card is interactive (clickable)
   - Show suggested follow-up questions below response

4. **Show Follow-Up Question Suggestion** (8:55 - 9:00) [5s]
   - Point to suggested follow-up questions
   - Demonstrate conversational flow
   - Chat is ready for next interaction

**Narration (English)**:

> "As a bonus feature, Batwo includes an AI Chat Assistant that lets users ask questions about their campaign performance in natural language. Users can ask in English or Korean, and the AI provides real-time analysis with data-backed insights. The chat interface displays performance metrics in easy-to-read cards, making it simple for e-commerce business owners to understand their marketing performance without digging through dashboards."

**API Indicators**:
- Chat may pull data from previous API calls (no new API needed)
- Show that data card references Meta API data

**Camera Positioning**:
- Show chat interface clearly
- Make text input and AI response both visible
- Show data card is readable
- Demonstrate conversational nature

**Visual Quality**:
- Text renders smoothly (streaming effect if possible)
- Chat messages align properly
- Data card is formatted and readable
- Chat interface is responsive

**Timing Notes**:
- 50 seconds is generous for bonus feature
- This can be shortened or skipped if running long
- If you skip this scene, Scene 9 moves to 8:10

**Decision**: Include this scene if:
- Your total recording is running short (< 8:00 after Scene 7)
- You want to showcase advanced features
- AI assistant is fully functional

Skip this scene if:
- You're at 8:00+ after Scene 7
- You want to focus only on permission demonstrations
- AI assistant is incomplete or unreliable

---

### Scene 9: Summary & Permissions Confirmation (9:00 - 9:30) [30 seconds] OR (8:10 - 8:40) [30s if skipping Scene 8]

**Objective**: Recap all 5 permissions and confirm they're all active

**Pre-Scene Setup**:
- Navigate to Settings → Permissions or a summary page that shows all permissions as "Granted"
- Or show the 5 permissions listed with checkmarks

**On-Screen Actions**:

1. **Show Permissions Summary Page** (0:00 - 0:15) [15s]
   - Navigate to a page showing: "Connected Permissions" or "Meta Account Status"
   - If such page doesn't exist, show the Settings page where user connected Meta
   - Display checkmarks or "Granted" status next to each permission:
     - ✓ pages_show_list
     - ✓ pages_read_engagement
     - ✓ business_management
     - ✓ ads_read
     - ✓ ads_management
   - Let viewer read all 5 checkmarks

2. **Read Permission List Aloud** (0:15 - 0:25) [10s]
   - Slowly read each permission name
   - Confirm each is granted
   - This reinforces the 5 permissions for Meta reviewers

3. **Close/Conclusion** (0:25 - 0:30) [5s]
   - Brief statement that all permissions are active
   - Natural end to the video

**Narration (English)**:

> "To summarize, Batwo successfully integrates with Meta by requesting five specific permissions. Pages_show_list allows users to view their managed Facebook Pages. Pages_read_engagement provides access to page engagement metrics. Business_management enables Meta Pixel configuration. Ads_read powers our KPI dashboard with real-time campaign performance data. And ads_management gives users full control to create and modify campaigns. All five permissions are granted and actively used in the application, providing a complete solution for e-commerce businesses to manage their Meta advertising."

**Camera Positioning**:
- Show permissions list clearly
- Ensure all 5 are visible or can be scrolled to visibility
- Make checkmarks/status obvious

**Visual Quality**:
- Clean permissions display
- High readability

**Timing Notes**:
- This is a brief recap/conclusion
- 30 seconds is sufficient
- Keep it natural, not rushed

---

## Total Recording Duration

### If Including Scene 8 (AI Chat Bonus):
- Scene 1: 0:30 seconds
- Scene 2: 1:15 seconds (ends at 1:45)
- Scene 3: 1:05 seconds (ends at 2:50)
- Scene 4: 1:10 seconds (ends at 4:00)
- Scene 5: 1:15 seconds (ends at 5:15)
- Scene 6: 1:30 seconds (ends at 6:45)
- Scene 7: 1:25 seconds (ends at 8:10)
- Scene 8: 0:50 seconds (ends at 9:00)
- Scene 9: 0:30 seconds (ends at 9:30)

**TOTAL: 9:30** ✓ Within acceptable range (7:30 - 10:00)

### If Skipping Scene 8:
- Scenes 1-7: 8:10 total
- Scene 9: 0:30 seconds (ends at 8:40)

**TOTAL: 8:40** ✓ Perfect range (7:30 - 9:00)

---

## Post-Recording - Quality Checklist

### Video Quality Verification

- [ ] **Resolution**: Confirm 1920x1080 (check video properties)
- [ ] **Duration**: Between 8:00 and 9:30 minutes
- [ ] **Frame Rate**: 30fps (no stuttering when watched back)
- [ ] **File Format**: MP4 with H.264 codec
- [ ] **File Size**: Under 100MB
- [ ] **Audio Quality**: Clear narration, no distortion, good levels

### Content Verification

- [ ] **Scene 1**: Landing page visible, login successful
- [ ] **Scene 2**: OAuth consent screen shows ALL 5 permissions clearly
- [ ] **Scene 3**: Pages list loaded and functional
- [ ] **Scene 4**: Engagement metrics displayed and readable
- [ ] **Scene 5**: Pixels list loaded and functional
- [ ] **Scene 6**: Dashboard KPIs and charts rendered
- [ ] **Scene 7**: Campaign created, verified in list, paused
- [ ] **Scene 8** (if included): Chat assistant responsive, data card displays
- [ ] **Scene 9**: Permissions summary showing all 5 as granted

### Technical Verification

- [ ] **No Overlays**: Remove screen recording software watermarks/logos
- [ ] **No Cursors**: Hide pointer if visible (mouse should be barely noticeable)
- [ ] **No Notifications**: No system notifications, chat popups, email badges visible
- [ ] **No Browser Extensions**: No extension icons visible in toolbar
- [ ] **No Personal Data**: No real email addresses, phone numbers, or sensitive info visible
- [ ] **Natural Transitions**: No jump cuts (should be one continuous recording)

### Narration Verification

- [ ] **Timing**: Narration matches on-screen actions (not ahead/behind)
- [ ] **Audio Levels**: Narration is louder than background sound
- [ ] **Pronunciation**: All words pronounced clearly (especially Korean names)
- [ ] **Pacing**: Narration reads at natural speed, not rushed
- [ ] **Completeness**: All scenes have corresponding narration

---

## Editing & Upload Checklist

### Video Editing (if needed)

If you recorded multiple takes or need to edit:

- [ ] **Cuts**: Remove any mistakes or long pauses (keep natural flow)
- [ ] **Transitions**: Use simple fades or cuts, no fancy transitions
- [ ] **Subtitle/Captions**: Add English subtitles (see `subtitles/` directory for pre-written content)
- [ ] **Audio**: Ensure narration is synced with video
- [ ] **Music** (Optional): Subtle background music is OK (but narration must be primary audio)

### Export Settings

- [ ] **Codec**: H.264 (most compatible)
- [ ] **Bitrate**: 5-8 Mbps for 1920x1080 @ 30fps (will keep file < 100MB for ~9 min)
- [ ] **Container**: MP4 (.mp4 extension)
- [ ] **Audio**: AAC codec, 128 kbps, Stereo

### Meta Submission Preparation

- [ ] **Video Title**: "Batwo App Demo - Full Feature Walkthrough"
- [ ] **Description**: Prepare text explaining each scene
- [ ] **Test Credentials**: Prepare test account info to provide to Meta (separate from video)
- [ ] **Screenshot Thumbnails**: Optional - 1-2 screenshots of key screens

**Video Description Template**:

This screencast demonstrates the complete Batwo application workflow with all five Meta permissions.

---

## Final Notes

1. **Slow Down**: This script intentionally gives generous time for each action. Don't rush. Meta reviewers need time to see everything.

2. **Natural Interaction**: Click at natural speed. Pause for page loads. Let the app feel real, not scripted.

3. **OAuth is Critical**: Scene 2 (OAuth consent) is the most important. Allocate 45 seconds just for that screen. This single scene directly addresses the previous rejection.

4. **Complete Workflows**: Every scene should show a complete user action (start → action → result). Never show incomplete tasks.

5. **Test Before Recording**: Run through the entire app workflow manually before hitting record. Fix any bugs.

6. **Save Multiple Versions**: Record in 2-3 takes if possible. Keep all versions so you can edit the best scenes together if needed.

Good luck with your resubmission!
