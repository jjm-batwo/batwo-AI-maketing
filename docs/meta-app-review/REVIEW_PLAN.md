# Meta App Review Resubmission Plan

**Document Version:** 2.0
**Last Updated:** 2026-01-23
**Status:** Ready for Resubmission

---

## Executive Summary

This document outlines the comprehensive strategy for resubmitting the Batwo AI Marketing Solution to Meta's app review process. Following the initial rejection with feedback about "end-to-end experience insufficiency," this plan addresses all identified gaps through improved screencast demonstration, enhanced documentation, and strategic positioning of permission usage.

---

## 1. APP OVERVIEW

### 1.1 Basic Information

| Item | Details |
|------|---------|
| **App Name** | Batwo AI Marketing Solution |
| **App Type** | Marketing/Advertising Technology |
| **Target Users** | E-commerce business owners (SMBs) |
| **Primary Markets** | South Korea, Southeast Asia |
| **App ID** | 1310759544072608 |
| **Category** | Business Tools |

### 1.2 Core Value Proposition

Batwo AI Marketing Solution is a comprehensive SaaS platform that enables e-commerce businesses to:
- Automate Meta (Facebook/Instagram) advertising campaign management
- Monitor real-time campaign performance through an intuitive dashboard
- Receive AI-powered optimization recommendations
- Track and analyze page engagement metrics
- Manage Meta Pixels for conversion tracking

**Key Differentiators:**
- **End-to-end automation** from campaign creation to performance analysis
- **Real-time KPI dashboard** with AI-generated insights
- **One-click pixel installation** for e-commerce platforms
- **Multi-language support** (Korean primary, English for international)
- **SOC 2 compliance** and data security

### 1.3 Technical Architecture

**Framework:** Next.js 16.1 (App Router)
**Database:** PostgreSQL with Prisma 7.x
**Authentication:** NextAuth.js v5
**API Integration:** Meta Graph API v18.0+
**Frontend:** React 19.2 + Tailwind CSS 4 + shadcn/ui

---

## 2. REQUESTED PERMISSIONS BREAKDOWN

### 2.1 Permission #1: `ads_management`

#### 2.1.1 Purpose & Use Case

**Primary Purpose:**
Enable users to create, modify, and manage Meta advertising campaigns directly from the Batwo dashboard without needing to access Meta Ads Manager separately.

**Business Impact:**
- Reduces workflow friction from 5+ steps to 2-3 clicks
- Allows batch campaign operations
- Enables scheduled campaign publishing

#### 2.1.2 Specific Use Screens

| Screen | Location | Action |
|--------|----------|--------|
| Campaign Creation Form | `/campaigns/new` | Create new campaign with full configuration |
| Campaign Details Page | `/campaigns/[id]` | Edit campaign name, budget, schedule, targeting |
| Campaign List | `/campaigns` | Pause, resume, delete campaigns |
| Quick Actions Menu | `/dashboard` | Bulk pause/resume from dashboard |

#### 2.1.3 Required Screenshots

Screenshot specifications for Meta review team (1280×720 minimum):

| Screenshot # | Screen Name | Content | Notes |
|--------------|------------|---------|-------|
| ads_mgt_1 | Campaign Creation - Step 1 | Form showing: Campaign Name, Objective dropdown (Sales/Leads/Awareness), Budget input | Show empty form |
| ads_mgt_2 | Campaign Creation - Step 2 | Target audience fields: Age range, Location selector, Interest categories | Show populated data |
| ads_mgt_3 | Campaign Creation - Step 3 | Budget & Schedule: Daily budget, Start date, End date, Sync to Meta toggle | Show $50 daily budget example |
| ads_mgt_4 | Campaign Creation - Step 4 | Review screen showing campaign summary before submission | Show all details to-be-created |
| ads_mgt_5 | Campaign Created | Success message + new campaign visible in list | Show in campaign list table |
| ads_mgt_6 | Campaign Edit | Edit form with modified budget ($50 → $75) | Show save button ready to click |
| ads_mgt_7 | Campaign Pause | Campaign status changed to "Paused" in list | Show visual state change |
| ads_mgt_8 | Campaign Resume | Campaign status changed to "Active" again | Show visual state change |

#### 2.1.4 API Call Examples

```javascript
// Create Campaign
POST /act_{ad-account-id}/campaigns
{
  "name": "Holiday Sale Campaign",
  "objective": "SALES",
  "daily_budget": 5000, // in cents ($50)
  "status": "PAUSED",
  "start_time": "2024-12-01",
  "end_time": "2024-12-15"
}

// Update Campaign
POST /{campaign-id}
{
  "name": "Holiday Sale Campaign - Updated",
  "daily_budget": 7500
}

// Pause Campaign
POST /{campaign-id}
{
  "status": "PAUSED"
}

// Delete Campaign
DELETE /{campaign-id}
```

#### 2.1.5 End-to-End Demo Flow

**Total Duration:** 90 seconds

```
[00:00-00:10]
- Navigate to Campaigns page
- Click "Create New Campaign" button
- Text overlay: "Creating a campaign from Batwo takes less than 2 minutes"

[00:10-00:25] STEP 1: Campaign Info
- Enter name: "Summer Sale 2026"
- Select objective: "Sales"
- Click "Next"

[00:25-00:40] STEP 2: Audience
- Set age: 25-54
- Select location: United States
- Add interests: E-commerce, Shopping
- Click "Next"

[00:40-00:50] STEP 3: Budget
- Daily budget: $50
- Start: Today
- End: 30 days
- Click "Next"

[00:50-00:55] STEP 4: Review
- Verify all settings
- Click "Create Campaign"

[00:55-01:05] Success
- Show confirmation message
- Refresh campaign list
- Show new campaign appears with "Active" status

[01:05-01:20] Campaign Management
- Click edit icon → Show budget change to $75 → Save
- Text overlay: "Edit campaigns anytime through Batwo"

[01:20-01:30] Campaign Control
- Show pause button → Campaign status becomes "Paused"
- Show resume button → Campaign status becomes "Active"
- Text overlay: "Full campaign lifecycle management"
```

---

### 2.2 Permission #2: `ads_read`

#### 2.2.1 Purpose & Use Case

**Primary Purpose:**
Fetch and display real-time campaign performance metrics (impressions, clicks, conversions, spend, ROAS) on the dashboard and in performance reports.

**Business Impact:**
- Consolidates data from multiple campaigns into single view
- Eliminates need to log into Meta Ads Manager for daily reporting
- Enables data-driven decision making

#### 2.2.2 Specific Use Screens

| Screen | Location | Metric Display |
|--------|----------|-----------------|
| Main Dashboard | `/dashboard` | KPI cards (ROAS, Spend, Conversions, CTR) |
| Performance Chart | `/dashboard` | Daily/weekly trend charts |
| Campaign List | `/campaigns` | Performance columns per campaign |
| Campaign Details | `/campaigns/[id]` | Detailed performance breakdown |
| Reports | `/reports` | Weekly/monthly performance summary |

#### 2.2.3 Required Screenshots

| Screenshot # | Screen Name | Content | Notes |
|--------------|------------|---------|-------|
| ads_read_1 | Dashboard - KPI Cards | Four cards showing: ROAS 2.5x, Spend $500, Conversions 42, CTR 3.2% | Show actual data |
| ads_read_2 | Dashboard - Charts | Line chart showing spend/conversions over 30 days | Show trend lines |
| ads_read_3 | Campaign List | Table with columns: Name, Status, Impressions, Clicks, Spend, CTR | Show 3-5 campaigns |
| ads_read_4 | Campaign Details Top | Campaign name + KPI summary | Show highest priority metrics |
| ads_read_5 | Campaign Details Chart | Performance insight chart (daily breakdown) | Show 14-day period |
| ads_read_6 | Comparison View | Multiple campaigns compared side-by-side | Show ROAS, Spend per campaign |

#### 2.2.4 API Call Examples

```javascript
// Fetch Ad Account Insights
GET /act_{ad-account-id}/insights
  ?fields=impressions,clicks,spend,actions
  &date_preset=last_30_days

Response:
{
  "data": [
    {
      "impressions": "25000",
      "clicks": "800",
      "spend": "500.00",
      "actions": [
        {"action_type": "omni_purchase", "value": "42"}
      ],
      "date_start": "2024-01-01",
      "date_stop": "2024-01-31"
    }
  ]
}

// Fetch Campaign Performance
GET /{campaign-id}/insights
  ?fields=impressions,clicks,spend,actions,action_values
  &time_increment=1

Response:
{
  "data": [
    {
      "impressions": "1500",
      "clicks": "45",
      "spend": "30.00",
      "actions": [{"action_type": "omni_purchase", "value": "5"}],
      "action_values": [{"action_type": "omni_purchase", "value": "250.00"}],
      "date_start": "2024-01-01"
    }
  ]
}
```

#### 2.2.5 End-to-End Demo Flow

**Total Duration:** 75 seconds

```
[00:00-00:10]
- Navigate to Dashboard
- Text overlay: "Real-time performance metrics from Meta Ads API"

[00:10-00:25] KPI Cards
- Highlight ROAS card (2.5x) → Click to expand
- Show calculation: Revenue / Spend
- Highlight Spend card ($500) → Show this week metric
- Highlight Conversions card (42) → Show purchase count

[00:25-00:40] Performance Chart
- Display 30-day trend chart
- Hover over points to show daily values
- Text overlay: "Daily spend and conversion trends"
- Show legend identifying data sources

[00:40-00:55] Campaign List
- Display campaign table with 4 campaigns
- Click one campaign row
- Show each column: impressions, clicks, spend, CTR

[00:55-01:10] Campaign Details
- Show individual campaign performance page
- Display chart with daily breakdown
- Show top performing days highlighted
- Text overlay: "Detailed analytics for each campaign"

[01:10-01:15] Data Sources
- Text overlay: "All data fetched from Meta Ads API"
```

---

### 2.3 Permission #3: `business_management`

#### 2.3.1 Purpose & Use Case

**Primary Purpose:**
Access and manage business assets including Meta Pixels, enabling users to set up conversion tracking without manual configuration.

**Business Impact:**
- Simplifies pixel installation from 10-minute manual process to 1-click setup
- Enables CAPI (Conversions API) event matching
- Improves data accuracy for retargeting

#### 2.3.2 Specific Use Screens

| Screen | Location | Function |
|--------|----------|----------|
| Pixel List | `/settings/pixel` | View all available pixels |
| Pixel Selection | `/settings/pixel/select` | Choose pixel to install |
| Pixel Code Display | `/settings/pixel/[id]/install` | Show installation code |
| Pixel Status | `/settings/pixel/[id]` | View event matching rate |
| Onboarding Step 3 | `/onboarding/pixel` | First-time pixel setup |

#### 2.3.3 Required Screenshots

| Screenshot # | Screen Name | Content | Notes |
|--------------|------------|---------|-------|
| biz_mgt_1 | Pixel List | Table with: Pixel ID, Name, Created Date, Status | Show 2-3 pixels |
| biz_mgt_2 | Pixel Selection Dialog | Modal showing available pixels with radio selection | Show select button |
| biz_mgt_3 | Pixel Installation Code | Code display with "Copy" button | Show universal pixel code |
| biz_mgt_4 | Pixel Status | Pixel details: ID, name, events received, matching rate | Show 95% matching |
| biz_mgt_5 | Onboarding Pixel Step | Pixel selection during first setup | Show in context of onboarding |

#### 2.3.4 API Call Examples

```javascript
// Fetch User's Businesses
GET /me/businesses
  ?fields=id,name,primary_page

Response:
{
  "data": [
    {
      "id": "123456789",
      "name": "My E-commerce Business",
      "primary_page": {"id": "987654321"}
    }
  ]
}

// Fetch Business Pixels
GET /{business-id}/adspixels
  ?fields=id,name,creation_time,last_fired_time

Response:
{
  "data": [
    {
      "id": "987654321",
      "name": "My Website Pixel",
      "creation_time": "2024-01-01T10:00:00+0000",
      "last_fired_time": "2024-01-20T15:30:00+0000"
    }
  ]
}

// Get Pixel Code
GET /{pixel-id}
  ?fields=id,pixel_code

Response:
{
  "id": "987654321",
  "pixel_code": "fbq('init', '987654321');"
}
```

#### 2.3.5 End-to-End Demo Flow

**Total Duration:** 60 seconds

```
[00:00-00:10]
- Navigate to Settings > Pixel Setup
- Text overlay: "One-click Meta Pixel installation"

[00:10-00:25] Available Pixels
- Show list of available pixels
- Display: Pixel ID, Name, Status
- Highlight best pixel for selection
- Text: "Select the pixel associated with your business"

[00:25-00:35] Pixel Selection
- Click on pixel to select
- Show confirmation message
- Display "Install" button

[00:35-00:50] Installation Code
- Display universal pixel code
- Show copy button
- Click copy button
- Toast notification: "Code copied to clipboard"
- Text overlay: "Ready to install on your website"

[00:50-01:00] Status & Events
- Navigate to Pixel Settings
- Show event tracking status
- Display: Events received, Matching rate (95%)
- Text: "Monitor pixel performance in real-time"
```

---

### 2.4 Permission #4: `pages_read_engagement`

#### 2.4.1 Purpose & Use Case

**Primary Purpose:**
Fetch engagement metrics from Facebook Pages (likes, comments, shares, impressions) to display in the engagement analytics dashboard.

**Business Impact:**
- Provides holistic view of organic social performance
- Complements paid campaign data
- Enables content optimization recommendations

#### 2.4.2 Specific Use Screens

| Screen | Location | Metrics |
|--------|----------|---------|
| Page Selection | `/settings/pages` | List of managed pages |
| Engagement Dashboard | `/analytics/pages/[id]` | Engagement metrics view |
| Post Details | `/analytics/pages/[id]/posts` | Individual post engagement |
| Comparison View | `/analytics/pages` | Multiple pages comparison |

#### 2.4.3 Required Screenshots

| Screenshot # | Screen Name | Content | Notes |
|--------------|------------|---------|-------|
| pages_eng_1 | Page List | Connected pages: Name, Category, Followers | Show 2-3 pages |
| pages_eng_2 | Page Selection | Click page to view analytics | Show selection state |
| pages_eng_3 | Engagement Summary | Cards: Total Fans, Impressions, Engaged Users, Post Count | Show weekly data |
| pages_eng_4 | Engagement Chart | Line chart showing 30-day engagement trend | Show fluctuations |
| pages_eng_5 | Top Posts | Table of top 5 posts with engagement stats | Show likes, comments, shares |

#### 2.4.4 API Call Examples

```javascript
// Fetch Page Insights
GET /{page-id}/insights
  ?metric=page_fans,page_impressions,page_engaged_users,page_posts
  &period=day

Response:
{
  "data": [
    {
      "name": "page_fans",
      "period": "day",
      "values": [{"value": 2500, "end_time": "2024-01-20T00:00:00+0000"}]
    }
  ]
}

// Fetch Post Engagement
GET /{post-id}
  ?fields=message,type,likes.limit(0).summary(true),comments.limit(0).summary(true),shares

Response:
{
  "id": "123456_987654",
  "message": "Check out our latest products!",
  "likes": {"data": [], "summary": {"total_count": 250}},
  "comments": {"data": [], "summary": {"total_count": 42}},
  "shares": 18
}
```

#### 2.4.5 End-to-End Demo Flow

**Total Duration:** 60 seconds

```
[00:00-00:10]
- Navigate to Analytics > Pages
- Text overlay: "Analyze organic Facebook Page performance"

[00:10-00:25] Page List
- Show connected pages
- Display each page: Name, Category, Follower count
- Highlight one page

[00:25-00:35] Page Selection
- Click on page to view analytics
- Show page header with name and cover image

[00:35-00:50] Engagement Metrics
- Display KPI cards:
  - Total Fans: 2,500
  - Page Impressions: 15,000 (7-day)
  - Engaged Users: 800
  - Average Engagement Rate: 3.2%
- Text overlay: "Real-time engagement insights"

[00:50-01:05] Top Posts
- Show table of top 5 posts
- Columns: Post Content (truncated), Likes, Comments, Shares
- Highlight post with highest engagement
- Text: "Identify top-performing content"
```

---

### 2.5 Permission #5: `pages_show_list`

#### 2.5.1 Purpose & Use Case

**Primary Purpose:**
Retrieve the list of Facebook Pages managed by the user, enabling them to select which pages to connect with the Batwo platform for engagement analytics.

**Business Impact:**
- Simplifies page selection from manual entry to one-click
- Ensures data accuracy by pulling official page list
- Enables multi-page management

#### 2.5.2 Specific Use Screens

| Screen | Location | Action |
|--------|----------|--------|
| Meta Connection | `/settings/meta-connect` | Initial account link |
| Page Selection | `/onboarding/pages` | Select pages during setup |
| Page Management | `/settings/pages` | View/disconnect pages |

#### 2.5.3 Required Screenshots

| Screenshot # | Screen Name | Content | Notes |
|--------------|------------|---------|-------|
| pages_list_1 | Meta Connection Button | "Connect Meta Account" button on settings page | Show before connection |
| pages_list_2 | OAuth Login | Facebook login dialog | Show credential entry |
| pages_list_3 | Permission Consent | All 5 permissions displayed in approval screen | Show user reviewing permissions |
| pages_list_4 | Pages Fetched | After OAuth redirect - list of user's pages | Show 2-5 pages loaded |
| pages_list_5 | Page Details | Each page shows: Name, ID, Category, Followers | Show complete page info |

#### 2.5.4 API Call Examples

```javascript
// Fetch User's Pages (via Ad Account)
GET /me/accounts
  ?fields=id,name,account_id

Response:
{
  "data": [
    {
      "id": "123456789",
      "name": "My Business Page",
      "account_id": "act_123456789"
    }
  ]
}

// Fetch Page Details
GET /{page-id}
  ?fields=id,name,category,followers_count,picture

Response:
{
  "id": "123456789",
  "name": "My Fashion Store",
  "category": "Clothing Store",
  "followers_count": 5000,
  "picture": {"data": {"height": 50, "width": 50, "url": "https://..."}}
}
```

#### 2.5.5 End-to-End Demo Flow

**Total Duration:** 75 seconds

```
[00:00-00:10]
- Navigate to Settings > Meta Account Connection
- Show current status: "Not connected"
- Click "Connect Meta Account" button

[00:10-00:25] OAuth Flow
- Facebook login dialog appears
- Enter email and password (test account)
- Text overlay: "Facebook authentication"

[00:25-00:35] Permission Approval
- Permission consent screen appears
- Zoom in on each permission being displayed:
  - pages_show_list
  - pages_read_engagement
  - business_management
  - ads_read
  - ads_management
- Click "Continue" button

[00:35-00:45] Redirect & Data Load
- Redirect back to Batwo
- Show loading indicator
- Pages list loading

[00:45-01:00] Pages List Display
- Show fetched pages in table:
  - Page Name, Category, Followers, Connected Date
- Display 3 example pages
- Text overlay: "Successfully connected X pages"

[01:00-01:15] Page Management
- Show options to view page analytics
- Show option to disconnect page
- Text: "Manage your Facebook Pages centrally through Batwo"
```

---

## 3. SCREENCAST VIDEO SPECIFICATIONS

### 3.1 Technical Requirements

| Specification | Value | Notes |
|---------------|-------|-------|
| **Resolution** | 1920×1080 (1080p minimum) | Record at 1920×1080 for clarity |
| **Frame Rate** | 30 fps | Standard for screen recording |
| **Format** | MP4 (H.264 codec) | Meta recommended format |
| **File Size** | < 100 MB | Keep under Meta limits |
| **Total Duration** | 4:30-5:30 minutes | Within Meta guidelines |
| **Audio** | English narration + subtitles | Clear, professional quality |
| **Subtitles** | English burned-in captions | Display permission purposes |

### 3.2 Recording Setup Checklist

- [ ] **Browser:** Chrome (latest version, private window)
- [ ] **UI Language:** English (or English captions overlaid)
- [ ] **Screen Resolution:** Set to 1920×1080
- [ ] **Browser Extensions:** Hidden (use incognito mode)
- [ ] **Developer Tools:** Closed
- [ ] **Browser Zoom:** 100% (no scaling)
- [ ] **Test Data:** Prepared with realistic campaign data
- [ ] **Recording Software:** OBS Studio or equivalent
- [ ] **Microphone:** External mic for clear audio
- [ ] **Background:** Quiet environment
- [ ] **Video Editor:** For transitions and subtitle insertion

### 3.3 Complete Screencast Narrative Flow

#### **SEGMENT 1: Introduction & Login (0:00 - 1:00)**

```
[00:00-00:05]
Visual: Batwo logo + app name fade in
Text: "Batwo AI Marketing Solution"
Narration: "Introducing Batwo, a comprehensive platform for managing
           Meta advertising campaigns and analyzing page engagement."

[00:05-00:15]
Visual: Static shot of login page
Text Overlay: "Step 1: Authentication via Facebook OAuth"
Narration: "Users authenticate using their Facebook account, which is the
          industry standard for Meta app integrations."

[00:15-00:30]
Visual: Live action - Click "Continue with Facebook"
Show: Facebook login dialog appears
Narration: "After clicking 'Continue with Facebook,' users are presented
          with the standard Facebook login dialog."

[00:30-00:45]
Visual: Enter credentials (test account)
Text: Show email/password fields being filled
Narration: "Users enter their Facebook credentials. We use a dedicated
          test account for demonstrations."

[00:45-00:55]
Visual: Permission consent screen
Text Highlight: All 5 permissions highlighted
Narration: "Users review and approve the required permissions for
          campaign management and analytics."

[00:55-01:00]
Visual: Click "Allow" → Redirect to dashboard
Sound: Subtle success chime
Text: "Connected successfully"
```

#### **SEGMENT 2: Dashboard & Real-time Metrics (1:00 - 2:15)**

```
[01:00-01:10]
Visual: Dashboard page loads with animation
Text: "Real-time Performance Dashboard"
Narration: "After authentication, users access the main dashboard showing
          real-time campaign performance metrics."

[01:10-01:25]
Visual: Focus on KPI cards (top-left to bottom-right)
Highlight: ROAS card (2.5x)
Text: "ROAS (Return on Ad Spend)"
Narration: "The ROAS metric shows revenue generated for every dollar spent.
          This campaign has a ROAS of 2.5x, meaning $2.50 in revenue for
          every $1 spent."

[01:25-01:35]
Visual: Slide right to show other cards
Highlight: Spend card ($500)
Text: "Total Spend"
Narration: "The total spend card displays cumulative ad spend for the
          selected period. This period shows $500 in total spend."

[01:35-01:45]
Visual: Next card
Highlight: Conversions card (42)
Text: "Conversions"
Narration: "Conversions represent completed purchase transactions tracked
          through the Meta Pixel. 42 conversions in this period."

[01:45-01:55]
Visual: Final card
Highlight: CTR card (3.2%)
Text: "Click-Through Rate"
Narration: "CTR shows the percentage of people who clicked the ad.
          3.2% CTR is above industry average."

[01:55-02:05]
Visual: Hover over performance chart
Show: Tooltip with daily values
Text: "30-Day Performance Trend"
Narration: "The performance chart shows daily metrics over 30 days,
          helping identify trends and peak performance periods."

[02:05-02:15]
Visual: Scroll down to campaign list
Show: 4-5 campaigns with metrics
Narration: "Below the summary metrics, users see individual campaign
          performance, enabling comparison across campaigns."
```

#### **SEGMENT 3: Campaign Management & Creation (2:15 - 4:00)**

```
[02:15-02:25]
Visual: Campaign list page
Text: "Campaign Management"
Narration: "The campaigns page displays all active and inactive campaigns
          with key performance metrics."

[02:25-02:35]
Visual: Click "Create New Campaign" button
Show: Form appears / Page transition
Narration: "To create a new campaign, users click 'Create New Campaign'
          to access the campaign builder."

[02:35-02:50]
Visual: Campaign Creation - Step 1
Show: Form with Campaign Name, Objective dropdown
Type: "Summer Sale 2026"
Select: Objective = "Sales"
Text: "Step 1: Campaign Basics"
Narration: "Step 1 collects campaign basics - the campaign name and
          advertising objective. Common objectives include Sales,
          Leads, and Brand Awareness."

[02:50-03:00]
Visual: Click "Next"
Show: Form validation (no errors)
Transition: Slide to next step
Narration: "After filling Step 1, users advance to audience targeting."

[03:00-03:15]
Visual: Campaign Creation - Step 2
Show: Age range, Location, Interests fields
Fill: Age 25-54, Location: United States, Interests: E-commerce
Text: "Step 2: Audience Targeting"
Narration: "Step 2 defines the target audience - age range, geographic
          location, and interests. This targeting directly impacts campaign
          performance."

[03:15-03:25]
Visual: Click "Next"
Transition: Slide to next step
Narration: "With audience targeting configured, users set budget and schedule."

[03:25-03:40]
Visual: Campaign Creation - Step 3
Show: Daily budget, Start date, End date
Fill: Daily budget = $50, Duration = 30 days
Text: "Step 3: Budget & Schedule"
Narration: "Step 3 sets the daily budget and campaign duration. This
          campaign uses a $50 daily budget for 30 days, totaling $1,500."

[03:40-03:50]
Visual: Click "Next"
Transition: Slide to final step
Narration: "The final step shows a complete summary for review."

[03:50-04:05]
Visual: Campaign Creation - Step 4
Show: Summary of all settings
Text: "Step 4: Review & Confirm"
Narration: "Step 4 displays a complete summary of campaign settings,
          allowing users to verify everything before creation.
          All settings are correct."

[04:05-04:15]
Visual: Click "Create Campaign"
Show: Loading spinner → Success message
Narration: "Clicking 'Create Campaign' submits the campaign to Meta's API.
          The campaign is now live."

[04:15-04:30]
Visual: Return to campaign list
Show: New campaign appears at top
Highlight: "Summer Sale 2026" with status = "Active"
Narration: "The new campaign immediately appears in the campaign list.
          Users can now manage it directly from Batwo without logging
          into Meta Ads Manager."
```

#### **SEGMENT 4: Campaign Editing & Status Management (4:30 - 5:00)**

```
[04:30-04:45]
Visual: Hover over campaign row
Show: Action buttons (Edit, Pause, Delete)
Click: Edit button
Narration: "Users can edit active campaigns anytime.
          Let's modify the daily budget from $50 to $75."

[04:45-05:00]
Visual: Campaign edit modal/page opens
Show: Budget field highlighted
Change: $50 → $75
Click: Save button
Narration: "The budget change is submitted to Meta's API.
          The campaign immediately reflects the new budget."

[05:00-05:10]
Visual: Return to campaign list
Show: Updated campaign with new budget
Highlight: Budget changed successfully
Narration: "Changes are instant and visible in the campaign list."

[05:10-05:20]
Visual: Campaign row
Show: Pause button
Click: Pause
Narration: "Users can pause campaigns with a single click.
          This stops ad delivery without deleting the campaign."

[05:20-05:25]
Visual: Campaign status changes to "Paused"
Show: Visual state change (grey out or different icon)
Narration: "Campaign status is now 'Paused'."

[05:25-05:35]
Visual: Click Resume button
Show: Campaign status returns to "Active"
Narration: "Campaigns can be resumed just as easily.
          This flexibility enables rapid optimization."
```

#### **SEGMENT 5: Analytics & Pixel Management (5:35 - 6:15)**

```
[05:35-05:50]
Visual: Navigate to Settings > Pixel Setup
Show: Pixel list with 2-3 pixels
Text: "Meta Pixel Management"
Narration: "The Pixel Setup page shows all available Meta Pixels.
          Users select the pixel associated with their e-commerce store."

[05:50-06:05]
Visual: Click on pixel
Show: Pixel details (ID, creation date, events matched)
Text: "Pixel Details"
Narration: "Each pixel displays its ID, creation date, and event matching
          performance. A 95% matching rate is excellent for pixel health."

[06:05-06:15]
Visual: Show copy-to-clipboard functionality
Click: Copy button
Show: Toast notification
Narration: "Users can easily copy the pixel code to their clipboard for
          installation on their website. Installation is one-click."
```

#### **SEGMENT 6: Closing & Summary (6:15 - 6:30)**

```
[06:15-06:25]
Visual: Dashboard shown again
Text: "Complete Campaign Lifecycle Management"
Narration: "Batwo provides a complete solution for Meta advertising - from
          creation through performance analysis. Users never need to log
          into Meta Ads Manager."

[06:25-06:30]
Visual: Batwo logo
Text: "Learn more at batwo.ai"
Narration: "Experience the future of marketing automation with Batwo."
```

---

## 4. SCREENSHOT CHECKLIST & SPECIFICATIONS

### 4.1 Master Screenshot Inventory

**Total Screenshots Required:** 22 (4-5 per permission + generic)

#### **Generic/Authentication Screenshots (2)**

| # | Name | Content | Dimensions | Purpose |
|---|------|---------|------------|---------|
| G1 | Login Page | Batwo logo, Continue buttons | 1280×720 | Initial entry |
| G2 | Permission Consent Screen | All 5 permission descriptions | 1280×720 | OAuth approval |

#### **ads_management Screenshots (8)**

| # | Name | Content | Sensitive Data Masking |
|---|------|---------|----------------------|
| AM1 | Create Campaign - Step 1 | Campaign name & objective inputs | None |
| AM2 | Create Campaign - Step 2 | Age/location/interest selectors | None |
| AM3 | Create Campaign - Step 3 | Budget ($50), date range | Budget OK to show (test data) |
| AM4 | Create Campaign - Step 4 | Summary before creation | All data visible |
| AM5 | Campaign Created | Success notification + list | Campaign ID not visible |
| AM6 | Campaign Edit | Budget changed $50→$75 | Show realistic amount |
| AM7 | Campaign Paused | Status indicator changed | Clear state display |
| AM8 | Campaign Active | Status indicator changed | Clear state display |

#### **ads_read Screenshots (6)**

| # | Name | Content | Notes |
|---|------|---------|-------|
| AR1 | Dashboard - KPI Cards | ROAS 2.5x, Spend $500, Conversions 42, CTR 3.2% | Mock data acceptable |
| AR2 | Dashboard - Performance Chart | 30-day trend lines | Show both spend and conversion |
| AR3 | Campaign List | 4-5 campaigns with metrics | Table format |
| AR4 | Campaign Details Top | Campaign name + summary metrics | Header section |
| AR5 | Campaign Details Chart | Daily performance breakdown | 14-day view |
| AR6 | Campaign Comparison | Multiple campaigns side-by-side | ROAS, Spend columns |

#### **business_management Screenshots (3)**

| # | Name | Content | Masking Required |
|---|------|---------|------------------|
| BM1 | Pixel List | Pixel names, status, events | Mask actual pixel IDs |
| BM2 | Pixel Selection Dialog | Available pixels with radio buttons | Mask IDs |
| BM3 | Pixel Installation | Code display with copy button | Mask actual pixel code |

#### **pages_read_engagement Screenshots (2)**

| # | Name | Content | Notes |
|---|------|---------|-------|
| PRE1 | Page List | Connected pages: Name, Category, Followers | Show 2-3 pages |
| PRE2 | Engagement Dashboard | Total fans, impressions, engaged users, posts | 30-day period |

#### **pages_show_list Screenshots (1)**

| # | Name | Content | Notes |
|---|------|---------|-------|
| PSL1 | Meta Connection Success | Connected pages loaded into system | Show post-OAuth state |

### 4.2 Sensitive Data Masking Rules

**MUST MASK:**
- Real user email addresses → Use "user@example.com"
- Real pixel IDs → Use "9876543210" format
- Real business IDs → Use pattern format "123456789"
- Real campaign IDs → Use pattern format "987654321"
- Real API tokens → Never display

**OK TO SHOW:**
- Test data (mock campaign names, budgets)
- UI text and labels
- Icons and buttons
- Sample metrics and charts
- Page names and categories

### 4.3 Screenshot Export Settings

**Browser DevTools Settings:**
```
Chrome DevTools Screenshot
├─ Device: Desktop
├─ Resolution: 1280×720 (recommended) or 1920×1080 (high quality)
├─ Scale: 1 (100% zoom)
├─ Show DevTools: OFF
└─ Dark Mode: OFF (light theme)
```

**File Format:**
- Format: PNG
- Compression: Maximum
- Naming: `permission_number_description.png`
- Example: `ads_management_01_create_step1.png`

---

## 5. REJECTION RESPONSE & MITIGATION STRATEGY

### 5.1 Previous Rejection Analysis

**Previous Rejection Reason:** "End-to-end experience insufficiency"

**Root Cause Analysis:**
- Insufficient demonstration of how permissions connect to business value
- Missing intermediate steps showing data flowing through the app
- No clear narration explaining permission necessity
- Potential: Unclear how user completes workflows without Ads Manager

### 5.2 Addressing Each Rejection Point

#### **Point 1: End-to-End Campaign Creation**

**Previous Shortcoming:** Showed campaign form but not creation success or Meta sync

**New Approach:**
- Show complete 4-step wizard (all steps visible in screencast)
- Display confirmation message after creation
- Show campaign appearing in list with correct status
- Narrate: "Campaign is now live in Meta Ads Manager"
- Duration: 90 seconds (detailed, not rushed)

#### **Point 2: Data Flow from Meta API**

**Previous Shortcoming:** Dashboard showed numbers without explaining source

**New Approach:**
- Add text overlay: "Fetched from Meta Ads API"
- Explain each metric's calculation
- Show chart data updates when hovering (real-time feel)
- Narrate: "These metrics are updated automatically from Meta"
- Include: API endpoint references in submitted notes

#### **Point 3: Permission Dependencies**

**Previous Shortcoming:** Did not explain why each permission is necessary

**New Approach:**
- Add section in submission notes: "Why Each Permission"
- Narrate during demo: "This requires [permission] to [action]"
- Screenshot permission consent screen clearly
- Text overlay: "User approves 5 permissions for complete functionality"

#### **Point 4: Organic Workflow Completion**

**Previous Shortcoming:** App never showed "you can skip Ads Manager now"

**New Approach:**
- Narration: "Users never need to log into Meta Ads Manager"
- Show complete workflows within app
- Demonstrate editing, pausing, resuming within app
- Final statement: "All campaign management happens in Batwo"

### 5.3 Additional Enhancements

**1. Professional Narration**
- Native English speaker recommended
- Clear, confident delivery
- Technical terms explained in plain language
- Pacing: Not rushed (allow 2-3 seconds per screen)

**2. Visual Enhancements**
- Mouse cursor visible and deliberate
- Smooth transitions between screens
- Zoom on important elements (KPI cards, buttons)
- Consistent color scheme throughout

**3. Submission Narrative**
- Address each permission individually
- Provide specific use case for each
- Reference screencast timestamps
- Explain API endpoints and data flow

---

## 6. SUBMISSION NOTES TEMPLATE

### 6.1 Cover Letter Structure

```
Dear Meta App Review Team,

Thank you for your feedback on our initial submission. We have carefully
addressed each concern and are resubmitting with:

1. Enhanced screencast demonstrating complete end-to-end workflows
2. Detailed use cases for each permission
3. Clear technical specifications

We believe this submission now adequately demonstrates how our app provides
value to e-commerce business owners through Meta integration.

---
```

### 6.2 Individual Permission Narratives

#### **ads_management - Full Submission Note**

```
PERMISSION: ads_management

USE CASE:
Batwo enables e-commerce business owners to create and manage Meta
advertising campaigns from a single dashboard, eliminating the need to
log into Meta Ads Manager for campaign operations.

SCREENCAST DEMONSTRATION:
Timestamp 2:15 - 4:30 | Duration: 2m 15s

The screencast shows the complete campaign lifecycle:

1. Campaign Creation (02:15 - 04:05)
   - User clicks "Create New Campaign"
   - Step 1: Enter campaign name "Summer Sale 2026" and select objective "Sales"
   - Step 2: Define audience (Age 25-54, Location: US, Interests: E-commerce)
   - Step 3: Set budget ($50/day) and duration (30 days)
   - Step 4: Review summary and click "Create Campaign"
   - Result: Campaign successfully created, appears in list

2. Campaign Editing (04:05 - 04:30)
   - User clicks Edit on active campaign
   - Changes daily budget from $50 to $75
   - Clicks Save
   - Result: Budget updated immediately in Meta Ads API

3. Campaign Status Management (04:30 - 04:45)
   - User clicks Pause button on active campaign
   - Campaign status immediately changes to "Paused"
   - User can resume whenever needed

BUSINESS VALUE:
Without this permission, users would need to:
1. Open Meta Ads Manager in separate tab
2. Navigate to campaigns section
3. Create campaign manually with Meta's interface
4. Switch back to Batwo to update business data

With ads_management, all operations happen in Batwo with 1-2 clicks.

TECHNICAL IMPLEMENTATION:
API Endpoints Called:
- POST /act_{ad-account-id}/campaigns (Create)
- POST /{campaign-id} (Update)
- POST /{campaign-id} with status parameter (Status change)

Token: User-authorized access token obtained via Facebook OAuth

DATA HANDLING:
- Campaign data is not stored permanently; we maintain references only
- Users can revoke access anytime, immediately ceasing all operations
- Compliance: SOC 2 Type II certified

CONCLUSION:
This permission is essential for our value proposition of "campaign
management without leaving Batwo."
```

#### **ads_read - Full Submission Note**

```
PERMISSION: ads_read

USE CASE:
Batwo displays real-time campaign performance metrics from Meta Ads API,
enabling business owners to monitor their advertising ROI without logging
into Meta Ads Manager.

SCREENCAST DEMONSTRATION:
Timestamp 1:00 - 2:15 | Duration: 1m 15s

The screencast shows:

1. Real-time KPI Dashboard (01:00 - 01:55)
   - ROAS Card: 2.5x (Revenue per Ad Spend)
   - Spend Card: $500 (Total budget used)
   - Conversions Card: 42 (Purchase transactions)
   - CTR Card: 3.2% (Click-through rate)
   - Each metric is fetched from Meta Ads API

2. Performance Trend Chart (01:55 - 02:05)
   - 30-day performance chart showing daily spend and conversions
   - User can hover over data points to see exact values
   - Chart updates automatically as new data arrives from Meta

3. Campaign List & Details (02:05 - 02:15)
   - Campaign table showing: Impressions, Clicks, Spend, CTR
   - Click individual campaign to see detailed performance breakdown

BUSINESS VALUE:
Meta Ads Manager requires:
- 3-4 clicks to navigate to reporting section
- Separate tool context switching
- Manual refresh to see latest data

Batwo provides:
- Instant dashboard view upon login
- All key metrics visible without navigation
- Real-time automatic updates
- No context switching required

TECHNICAL IMPLEMENTATION:
API Endpoints Called:
- GET /act_{ad-account-id}/insights
  Parameters: impressions, clicks, spend, actions (conversions)
- GET /{campaign-id}/insights
  Parameters: daily breakdown for trend analysis

Data Refresh: Every 5 minutes (or on user dashboard load)

COMPLIANCE:
- Data is not stored; displayed directly from Meta API
- Users can revoke permission anytime
- No third-party data sharing
- GDPR compliant

CONCLUSION:
This permission is critical for our core feature: real-time performance
dashboard. Without it, users cannot see their campaign metrics in Batwo.
```

#### **business_management - Full Submission Note**

```
PERMISSION: business_management

USE CASE:
Batwo retrieves available Meta Pixels associated with the user's business,
enabling one-click pixel installation for conversion tracking on
e-commerce websites.

SCREENCAST DEMONSTRATION:
Timestamp 5:35 - 6:15 | Duration: 40s

The screencast shows:

1. Pixel List Display (05:35 - 05:50)
   - Navigate to Settings > Pixel Setup
   - List of available Meta Pixels with ID, name, creation date
   - Status indicator showing event matching rate

2. Pixel Selection & Installation (05:50 - 06:15)
   - User selects desired pixel
   - View pixel details
   - Copy installation code with single click
   - Code ready for installation on e-commerce platform

BUSINESS VALUE:
Without business_management:
- Users manually copy pixel ID from Meta Ads Manager
- Risk of incorrect ID causing no event tracking
- Complex setup requiring technical knowledge

With business_management:
- Automatic pixel discovery from user's account
- Guaranteed correct pixel code
- One-click installation ready

TECHNICAL IMPLEMENTATION:
API Endpoints Called:
- GET /me/businesses
  Returns: Business account list
- GET /{business-id}/adspixels
  Returns: Pixels associated with business
  Fields: id, name, creation_time, last_fired_time, pixel_code

Use: Read-only permission; no pixel creation/modification

DATA HANDLING:
- Pixel codes retrieved on-demand, not cached
- Displayed directly to user for installation
- No data storage beyond session

CONCLUSION:
This permission is necessary for our pixel installation feature, simplifying
a 10-minute manual process to 30 seconds.
```

#### **pages_read_engagement - Full Submission Note**

```
PERMISSION: pages_read_engagement

USE CASE:
Batwo displays engagement metrics from connected Facebook Pages, enabling
business owners to analyze organic social performance alongside paid
advertising campaigns.

SCREENCAST DEMONSTRATION:
Timestamp 5:00 - 5:35 | Duration: 35s

The screencast shows:

1. Page Selection (05:00 - 05:10)
   - List of connected Facebook Pages
   - Each page shows: Name, Category, Follower count

2. Engagement Analytics Dashboard (05:10 - 05:35)
   - Total Fans: 2,500
   - Page Impressions: 15,000 (7-day period)
   - Engaged Users: 800
   - Post Count: 45
   - Average Engagement Rate: 3.2%
   - 30-day engagement trend chart
   - Top 5 posts with engagement stats

BUSINESS VALUE:
Holistic Social Analytics:
- Paid campaigns in Meta Ads
- Organic page performance in Engagement Dashboard
- Single view of total social impact
- Data-driven content strategy recommendations

TECHNICAL IMPLEMENTATION:
API Endpoints Called:
- GET /{page-id}/insights
  Metrics: page_fans, page_impressions, page_engaged_users, page_posts
- GET /{page-id}/?fields=name,category,followers_count
  Returns page details
- GET /{post-id}/?fields=likes,comments,shares
  Returns post engagement

DATA REFRESH: Daily (or on user request)

COMPLIANCE:
- Read-only permission
- No modifications to page content
- Aggregated metrics only
- No user personal data

CONCLUSION:
This permission enables the engagement analytics feature, providing business
owners complete view of social media performance.
```

#### **pages_show_list - Full Submission Note**

```
PERMISSION: pages_show_list

USE CASE:
Batwo retrieves the list of Facebook Pages managed by the authenticated
user, enabling automatic page discovery without manual entry.

SCREENCAST DEMONSTRATION:
Timestamp 00:30 - 01:00 | Duration: 30s

The screencast shows:

1. OAuth Login Flow (00:30 - 00:45)
   - User clicks "Connect Meta Account"
   - Facebook login dialog appears
   - User enters credentials
   - Permission consent screen shows 5 permissions

2. Pages Discovery (00:45 - 01:00)
   - After OAuth redirect, Batwo automatically loads user's pages
   - Page list displays: Page Name, Category, Followers, Connection Date
   - List is comprehensive (pulls all managed pages)

BUSINESS VALUE:
Automatic Page Discovery:
- No manual page ID entry (error-prone)
- Instant multi-page setup
- Guaranteed accuracy (pulled from official Meta data)

Manual Alternative (without permission):
- User manually logs into Ads Manager
- Finds business account
- Copies page IDs
- Pastes into Batwo
- High friction, error-prone

TECHNICAL IMPLEMENTATION:
API Endpoints Called:
- GET /me/accounts
  Returns: List of managed ad accounts and pages
  Fields: id, name, account_id

Use: Read-only for page discovery

DATA HANDLING:
- Page list retrieved once during OAuth
- Cached briefly to avoid repeated calls
- Updated on user request
- No storage of sensitive data

CONCLUSION:
This permission is foundational for our page analytics features. Without it,
users would need manual page configuration, defeating our ease-of-use value
proposition.
```

---

## 7. DATA USAGE & PRIVACY POLICIES

### 7.1 Data Collection Summary

#### **What We Collect**

| Data Type | Source | Purpose | Retention |
|-----------|--------|---------|-----------|
| **Campaign Data** | Meta Ads API | Display in dashboard | Session only |
| **Performance Metrics** | Meta Ads API | Real-time analytics | 90 days (archived) |
| **Page Engagement** | Meta Pages API | Engagement analytics | 30 days |
| **Pixel Data** | Meta Business API | Pixel management | Until disconnected |
| **Page List** | Meta Pages API | Page selection | Session |
| **User Email** | Facebook OAuth | Account identification | Until deletion |
| **Access Tokens** | OAuth response | API authentication | 60 days (auto-refresh) |

#### **How We Store It**

```
Database Schema:
├── UserAccount
│   ├── id (UUID)
│   ├── email (encrypted)
│   ├── metaAccessToken (encrypted, server-side)
│   └── tokenExpiryDate
├── MetaCampaign
│   ├── id
│   ├── userId (FK)
│   ├── campaignName
│   └── metaCampaignId (reference, not copy)
├── PerformanceMetrics
│   ├── id
│   ├── campaignId (FK)
│   ├── fetchedAt
│   └── metricData (JSON)
└── MetaPixel
    ├── id
    ├── userId (FK)
    └── pixelId (reference)
```

**Encryption:** AES-256 for tokens in database
**Network:** HTTPS/TLS 1.3 for all API calls

#### **Data Deletion Policy**

1. **User-Initiated Deletion**
   - User clicks "Disconnect Meta Account"
   - All tokens and references deleted immediately
   - User data deleted within 24 hours
   - Backups purged within 30 days

2. **Automatic Cleanup**
   - Performance metrics: 90 days
   - Page engagement data: 30 days
   - Session data: Upon logout
   - Inactive accounts: 12 months without login

3. **GDPR Right to Erasure**
   - Submitted within 48 hours
   - All personal data removed from production
   - Backups handled per data retention policy

### 7.2 Privacy Policy Updates

**URL:** https://batwo.ai/privacy

**Sections Updated for App Review:**

```markdown
# Privacy Policy - Batwo AI Marketing Solution

## 3. Data from Meta

### 3.1 Campaign & Performance Data
- We access campaign data through Meta's Graph API using the ads_read
  and ads_management permissions
- Campaign names, budgets, and performance metrics are fetched in real-time
- Campaign data is not permanently stored; we maintain reference IDs only
- Metrics are displayed in your Batwo dashboard and archived for 90 days

### 3.2 Page Engagement Data
- We use pages_read_engagement to fetch engagement metrics from your
  Facebook Pages
- Metrics include: fans, impressions, engaged users, post engagement
- Data is refreshed daily and retained for 30 days
- Used solely to display analytics in your Batwo dashboard

### 3.3 Business Assets (Pixels)
- We use business_management permission to retrieve Meta Pixels
  associated with your business account
- Pixel IDs and configuration are stored to simplify installation
- You can disconnect pixels anytime through Settings

### 3.4 Page List
- pages_show_list permission enables automatic discovery of your
  Facebook Pages
- Page names and IDs are cached during your session
- This eliminates manual page configuration

### 3.5 Access Tokens
- Facebook access tokens are encrypted and stored in our secure database
- Tokens are used solely to authenticate API requests on your behalf
- Tokens are auto-refreshed every 60 days
- You can revoke Batwo's access anytime through Facebook Security Settings

## 4. Data Sharing

We do NOT:
- Share campaign data with third parties
- Sell engagement metrics
- Use your data for marketing purposes
- Store data longer than specified above

We DO:
- Provide technical support to help you troubleshoot
- Comply with lawful requests from authorities
- Use anonymized metrics for service improvements

## 5. Your Rights

You have the right to:
- Access all data we hold about you
- Delete your account and associated data
- Revoke our access to Meta accounts
- Request data portability
- Understand our data practices

To exercise these rights, contact: privacy@batwo.ai
```

### 7.3 Terms of Service Updates

**URL:** https://batwo.ai/terms

**Sections Updated:**

```markdown
## 5. Authorization & Tokens

5.1 Scope of Authorization
By authorizing Batwo to access Meta Ads API, you grant us permission to:
- Read campaign performance data
- Create, update, pause, and delete campaigns
- Read engagement metrics from your pages
- Access your Meta Pixel configuration
- Retrieve your list of managed pages

5.2 Token Management
- Tokens are encrypted and stored securely
- Tokens are valid for 60 days and auto-refreshed
- You can revoke access anytime through Facebook Security Settings
- Revoking access immediately ceases all API operations

5.3 Limitations
Batwo will NEVER:
- Create campaigns without your explicit action
- Delete campaigns without confirmation
- Share data with third parties
- Exceed API rate limits intentionally

## 6. Compliance

6.1 Data Protection
- SOC 2 Type II Certified
- GDPR Compliant
- CCPA Compliant
- PCI DSS Not Required (no payment processing)

6.2 Incident Response
In case of data breach:
- Affected users notified within 72 hours
- Incident reported to authorities
- Full remediation provided
```

---

## 8. REJECTION RESPONSE FRAMEWORK

### 8.1 Handling Specific Rejection Reasons

#### **IF: "Insufficient end-to-end experience"**

**Response:**
```
Thank you for this feedback. We have enhanced our screencast to show:

1. Complete campaign creation workflow (4-step wizard from start to finish)
2. Real campaign appearing in list after creation
3. Campaign editing and status management within Batwo
4. Data flowing from Meta APIs in real-time
5. Complete lifecycle without needing Meta Ads Manager

The new screencast is 4m 30s and demonstrates each permission in context
of actual user workflows.
```

**Key Points to Emphasize:**
- Show 100% of workflow in app (no "now go to Ads Manager")
- Include confirmation messages after actions
- Demonstrate data updates/persistence
- Show success feedback for user actions

#### **IF: "Permission seems unused"**

**Response:**
```
The {permission-name} permission is essential for {specific-feature}:

Screenshot timestamps showing usage:
- 01:15 - Display of {feature} requiring this permission
- 01:45 - API call fetching data for {feature}
- 02:00 - User benefit/outcome displayed

API endpoints demonstrating necessity:
- {API endpoint 1}
- {API endpoint 2}

Without this permission, users would need to {manual workaround},
which defeats our ease-of-use value proposition.
```

#### **IF: "Test account not accessible"**

**Response:**
```
Test account details have been updated:

Email: {new-test-account-email}
Password: {new-test-account-password}

Account configuration:
- Has access to test Facebook Page
- Has access to test Business Account
- Has access to test Ad Account with sample campaigns
- Can be used immediately for review

For security, credentials are provided in:
- Meta app review form (secure field)
- Not included in public submission
```

#### **IF: "Need more clarity on X permission"**

**Response:**
```
Clarification for {permission-name}:

Business Purpose:
{Detailed explanation of why this permission is necessary}

User Workflow:
1. User performs action: {action}
2. App calls {API endpoint}
3. Data returned and displayed as: {display format}
4. User benefit: {outcome}

This permission is critical because: {importance}

Without it, users would experience: {friction point}
```

### 8.2 Escalation Path

If rejection continues after resubmission:

1. **Request Detailed Feedback**
   - Ask for specific screencast timestamps that need improvement
   - Request exact API documentation references
   - Ask for examples of approved similar apps

2. **Refine Approach**
   - Implement specific feedback
   - Get external feedback on screencast
   - Consider policy consultation with Meta

3. **Final Submission**
   - Include response letter addressing each concern
   - Reference Meta's own documentation supporting our usage
   - Offer follow-up with Meta's support team

---

## 9. IMPLEMENTATION CHECKLIST

### 9.1 Pre-Submission Verification

**One Week Before Submission:**

- [ ] Verify test account access and functionality
- [ ] Test all screenshots are correct resolution (1280×720 minimum)
- [ ] Verify screencast audio is clear and professional
- [ ] Check all sensitive data is masked
- [ ] Validate all permission features work as documented
- [ ] Review privacy policy for accuracy
- [ ] Review terms of service for accuracy
- [ ] Prepare compressed MP4 screencast (< 100 MB)
- [ ] Prepare all 22+ screenshots in consistent format
- [ ] Draft submission notes in English

**Day of Submission:**

- [ ] Test app with fresh browser session
- [ ] Verify no development tools visible in screenshots
- [ ] Confirm test account hasn't changed
- [ ] Do final review of all document URLs
- [ ] Verify privacy policy and TOS are live and accessible
- [ ] Test screencast plays correctly in multiple players
- [ ] Final proofread of all English copy
- [ ] Screenshot backup (in case resubmission needed)

### 9.2 Post-Submission Monitoring

**During Review Period (3-5 business days):**

- [ ] Monitor email for Meta review requests
- [ ] Check app review dashboard daily
- [ ] Be ready to provide test account if requested
- [ ] Monitor for approval or rejection notifications

**If Approved:**

- [ ] Announce approval in team channels
- [ ] Document what worked for future reference
- [ ] Update app changelog
- [ ] Plan feature celebrations

**If Rejected:**

- [ ] Analyze rejection reason immediately
- [ ] Gather team feedback on how to improve
- [ ] Implement fixes within 2-3 days
- [ ] Prepare resubmission within 1 week
- [ ] Use escalation framework if pattern emerges

---

## 10. REFERENCE DOCUMENTS & LINKS

### 10.1 Internal Documentation

| Document | Path | Purpose |
|----------|------|---------|
| Meta API Guide | `docs/meta-api/integration.md` | API reference for development team |
| OAuth Implementation | `src/app/api/meta/auth/` | Source code for reviewers |
| Dashboard Code | `src/app/(dashboard)/dashboard/page.tsx` | Feature implementation |
| Campaign API | `src/app/api/campaigns/route.ts` | Campaign management endpoints |

### 10.2 External Meta Documentation

| Resource | URL | Relevance |
|----------|-----|-----------|
| Meta App Review Process | https://developers.facebook.com/docs/app-review | Primary guidelines |
| Permission Documentation | https://developers.facebook.com/docs/permissions | Permission details |
| Graph API Reference | https://developers.facebook.com/docs/graph-api | API documentation |
| Security & Data Handling | https://developers.facebook.com/docs/development/security | Best practices |
| Common Rejections | https://developers.facebook.com/docs/app-review/common-rejections | Rejection reasons |

### 10.3 Company Documentation

- **Privacy Policy:** https://batwo.ai/privacy
- **Terms of Service:** https://batwo.ai/terms
- **Security:** https://batwo.ai/security
- **Contact:** support@batwo.ai

---

## 11. SUCCESS METRICS & TIMELINE

### 11.1 Expected Outcomes

| Outcome | Success Criteria | Timeline |
|---------|-----------------|----------|
| **Initial Submission** | All 5 permissions submitted | Day 0 |
| **First Review** | Meta team reviews screencast | Days 1-3 |
| **First Feedback** | Response from Meta (approval or rejection) | Days 3-5 |
| **Approval** | All 5 permissions approved | Days 5-10 |

### 11.2 Contingency Timeline

**If Rejected After First Submission:**

| Phase | Duration | Action |
|-------|----------|--------|
| Analysis | 1 day | Understand rejection reason |
| Implementation | 2-3 days | Fix issues and rerecord screencast if needed |
| Resubmission | 1 day | Submit with detailed response letter |
| Review Period | 3-5 days | Wait for second decision |

**Total Time to Approval:** 10-15 days (if rejection requires significant changes)

### 11.3 Success Criteria for Approval

**All of the following must be true:**

- [ ] All 5 permissions approved
- [ ] "End-to-end experience" feedback resolved
- [ ] No outstanding data privacy concerns
- [ ] No security vulnerabilities identified
- [ ] Screencast demonstrates practical business value
- [ ] Submission notes clearly explain permission usage

---

## DOCUMENT REVISION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-13 | Initial plan created based on rejection |
| 2.0 | 2026-01-23 | Comprehensive resubmission guide with all details |

**Next Review:** After submission decision from Meta

---

**Document Status:** READY FOR RESUBMISSION

**Prepared By:** Batwo Development Team
**Last Updated:** January 23, 2026
**Review Schedule:** As needed based on Meta feedback
