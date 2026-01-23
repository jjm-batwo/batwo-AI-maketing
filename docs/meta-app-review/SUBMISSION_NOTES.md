# Meta App Review Submission Notes

## App Information

**App Name:** Batwo AI Marketing Solution
**App ID:** 1310759544072608
**Category:** Marketing/Advertising Technology
**Platform:** Web Application (Next.js)

## App Description

Batwo AI Marketing Solution is a comprehensive marketing automation platform designed for e-commerce businesses. It enables users to manage their Meta (Facebook/Instagram) advertising campaigns, track real-time performance metrics, and receive AI-powered optimization recommendations.

### Key Features:
1. **Campaign Management** - Create, edit, pause, and manage Meta advertising campaigns
2. **Real-time Dashboard** - View campaign performance metrics (ROAS, CTR, conversions, spend)
3. **Page Analytics** - Monitor Facebook Page engagement metrics
4. **Pixel Management** - Set up and manage Meta Pixels for conversion tracking
5. **AI Insights** - Receive automated campaign optimization suggestions

---

## Requested Permissions and Use Cases

### 1. `pages_show_list`

**Purpose:** Display the list of Facebook Pages managed by the user so they can select which pages to connect with our platform.

**Use Case:**
- User navigates to Settings > Meta Pages Management
- App calls `GET /me/accounts` API to retrieve user's managed pages
- User sees a list of their pages with name, category, and follower count
- User can select a page to view detailed engagement analytics

**Screenshot Location:** `/settings/meta-pages`

---

### 2. `pages_read_engagement`

**Purpose:** Read engagement metrics (likes, comments, shares, impressions) from the user's Facebook Pages to display in our analytics dashboard.

**Use Case:**
- User selects a page from their page list
- App calls `GET /{page-id}/insights` API with the page access token
- Dashboard displays:
  - Total fans/followers
  - Page impressions (28-day period)
  - Engaged users
  - Post engagements
  - Recent posts with like/comment/share counts

**Screenshot Location:** `/settings/meta-pages` (after selecting a page)

---

### 3. `business_management`

**Purpose:** Manage business assets including Meta Pixels for conversion tracking setup on customer e-commerce websites.

**Use Case:**
- User navigates to Settings > Pixel Installation
- App calls `GET /me/businesses` to retrieve user's business accounts
- App calls `GET /{business-id}/adspixels` to list available pixels
- User can:
  - View existing pixels
  - Create a new pixel
  - Get pixel installation code for their website
  - Monitor pixel event matching rates

**Screenshot Location:** `/settings/pixel`

---

### 4. `ads_read`

**Purpose:** Read campaign performance data and insights to display in our real-time KPI dashboard and generate performance reports.

**Use Case:**
- User views the main Dashboard page
- App calls `GET /act_{ad-account-id}/insights` API
- Dashboard displays:
  - ROAS (Return on Ad Spend)
  - Total spend
  - Conversion count
  - CTR (Click-Through Rate)
  - Daily/weekly trend charts
- Campaign list shows individual campaign performance

**Screenshot Location:** `/dashboard`

---

### 5. `ads_management`

**Purpose:** Create, update, pause, and delete advertising campaigns on behalf of the user through our campaign management interface.

**Use Cases:**

**Campaign Creation:**
- User navigates to Campaigns > Create New Campaign
- User fills in campaign details (name, objective, budget, dates)
- User enables "Sync to Meta" option
- App calls `POST /act_{ad-account-id}/campaigns` API
- Campaign is created in Meta Ads Manager

**Campaign Status Management:**
- User can pause/resume campaigns from the campaign list
- App calls `POST /{campaign-id}` with status update
- Status change reflects in both our app and Meta Ads Manager

**Screenshot Location:** `/campaigns`, `/campaigns/new`

---

## Test Account Information

**Test Account Email:** [Provided separately for security]
**Test Account Password:** [Provided separately for security]

The test account has:
- Access to a test Facebook Page
- Access to a test Meta Business account
- Access to a test Ad Account with sample campaigns

---

## Screencast Guide

The screencast demonstrates the following end-to-end flows:

### Scene 1: App Introduction (0:00 - 0:30)
- Show login page
- Brief overview of app features

### Scene 2: Meta Account Connection (0:30 - 1:30)
- Navigate to Settings > Meta Account Connection
- Click "Connect Meta Account" button
- Complete Facebook OAuth flow
- Show permission consent screen (all 5 permissions visible)
- Return to app with successful connection

### Scene 3: pages_show_list Demo (1:30 - 2:15)
- Navigate to Settings > Meta Pages Management
- Show list of user's managed Facebook Pages
- Display page name, category, follower count

### Scene 4: pages_read_engagement Demo (2:15 - 3:00)
- Select a page from the list
- Show engagement metrics dashboard
- Display fans, impressions, engaged users
- Show recent posts with engagement data

### Scene 5: business_management Demo (3:00 - 3:45)
- Navigate to Settings > Pixel Installation
- Show list of Meta Pixels
- Demonstrate pixel code generation

### Scene 6: ads_read Demo (3:45 - 4:30)
- Navigate to Dashboard
- Show KPI cards (ROAS, Spend, Conversions, CTR)
- Show performance trend charts
- Show campaign performance table

### Scene 7: ads_management Demo (4:30 - 5:15)
- Navigate to Campaigns
- Click "Create New Campaign"
- Fill in campaign details
- Enable "Sync to Meta" option
- Submit and show created campaign
- Demonstrate pause/resume functionality

---

## Technical Implementation Notes

- **OAuth Flow:** Standard Facebook OAuth with user token
- **API Version:** Graph API v18.0
- **Token Management:** Long-lived tokens stored securely in database
- **Token Expiry:** 60 days with user re-authentication required upon expiry

This app does NOT use:
- System User tokens
- Server-to-server authentication without user login

All API calls are made with user-authorized tokens obtained through the standard Facebook Login OAuth flow.

---

## Privacy Policy & Terms

- **Privacy Policy:** https://batwo.ai/privacy
- **Terms of Service:** https://batwo.ai/terms

---

## Contact Information

**Developer:** Batwo Inc.
**Email:** support@batwo.ai
**Website:** https://batwo.ai

---

## Additional Notes

1. All UI elements are available in Korean (primary) with English tooltips/captions added for this review.

2. The app demonstrates practical business value for e-commerce merchants managing their Meta advertising.

3. Each permission is essential for the core functionality:
   - Without `pages_show_list`, users cannot select which pages to analyze
   - Without `pages_read_engagement`, page analytics would not be possible
   - Without `business_management`, pixel setup would require manual configuration
   - Without `ads_read`, the performance dashboard would have no data
   - Without `ads_management`, users would need to use Meta Ads Manager separately

4. We follow Meta's Platform Terms and ensure all user data is handled according to our privacy policy.
