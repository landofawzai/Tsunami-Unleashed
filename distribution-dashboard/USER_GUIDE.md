# Distribution Dashboard User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard Pages](#dashboard-pages)
4. [Common Tasks](#common-tasks)
5. [Understanding the Data](#understanding-the-data)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

The Distribution Dashboard is your central monitoring system for Tsunami Unleashed's content distribution across 4 tiers. It provides real-time tracking, platform health monitoring, and performance analytics.

### What You Can Do

- **Monitor** content distribution across all platforms
- **Track** platform health and performance
- **View** RSS feed statistics and subscriber counts
- **Analyze** distribution metrics and success rates
- **Review** system alerts and warnings
- **Configure** webhook endpoints for Pabbly Connect

---

## Getting Started

### Accessing the Dashboard

1. Open your web browser
2. Navigate to `http://localhost:3000` (development) or your production URL
3. The dashboard automatically refreshes every 30 seconds

### Dashboard Layout

The dashboard consists of:
- **Top Navigation**: Quick links to all pages
- **Main Content**: Page-specific data and visualizations
- **Footer**: Back to dashboard link on sub-pages

---

## Dashboard Pages

### 1. Home Dashboard (`/`)

**Purpose**: Overview of your entire distribution system

**Key Metrics**:
- **Total Content**: All content items in the system
- **Active Content**: Currently distributing
- **Today's Posts**: Posts published today
- **Success Rate**: Percentage of successful posts

**Features**:
- Real-time statistics with trend indicators (↑ ↓)
- Tier breakdown showing distribution across Tier 1/2/3
- Tier capacity widget (Tier 1 slot usage)
- Recent alerts feed
- Quick navigation to detailed pages

**What to Watch**:
- **Tier 1 slots**: Keep above 20 available (50 reserved for emerging languages)
- **Success rate**: Should stay above 75% (designed loss: 25%)
- **Critical alerts**: Address immediately

---

### 2. Content Page (`/content`)

**Purpose**: Manage and track individual content items

**Features**:
- Paginated list of all content (20 per page)
- Filter by status: Pending, In Progress, Completed, Failed
- Filter by tier: 1, 2, 3
- View platforms completed vs targeted
- See content type and creation date

**Content Lifecycle**:
1. **Pending**: Content created, not yet distributed
2. **In Progress**: Being distributed to platforms
3. **Completed**: All platforms successfully posted
4. **Failed**: One or more platforms failed

**How to Use**:
1. Select filters (status/tier) to narrow results
2. Review content progress (X/Y platforms completed)
3. Click through pages to view all content
4. Monitor creation dates for distribution timing

---

### 3. Platforms Page (`/platforms`)

**Purpose**: Monitor health of all distribution platforms

**Platforms by Tier**:
- **Tier 1**: RSS Vault (RSSground) - depth content
- **Tier 2**: External Feeds (Ghost/Cloudflare) - unlimited capacity
- **Tier 3**: Platform-Native (Followr/Robomotion) - social media

**Platform Status**:
- 🟢 **Healthy**: 0-1 failures in 24 hours
- 🟡 **Degraded**: 2-4 failures in 24 hours
- 🔴 **Down**: 5+ failures in 24 hours

**Health Indicators**:
- Total platforms count
- Healthy platforms count
- Degraded platforms count
- Down platforms count

**What to Do**:
- **Degraded**: Monitor closely, investigate if pattern continues
- **Down**: Immediate action required - check credentials, API limits, platform status

---

### 4. RSS Feeds Page (`/feeds`)

**Purpose**: Monitor RSS feed distribution and performance

**Feed Information**:
- Feed name and URL
- Language code (en, es, zh, etc.)
- Management tool (RSSground, Ghost)
- Subscriber count
- Active/inactive status

**Statistics**:
- Total feeds count
- Tier 1 feeds count (limited to 150 slots)
- Tier 2 feeds count (unlimited)
- Active feeds count

**Best Practices**:
- Prioritize high-subscriber feeds in Tier 1
- Use Tier 2 for experimental/new language feeds
- Monitor subscriber growth over time
- Ensure all feeds remain active

---

### 5. Metrics Page (`/metrics`)

**Purpose**: Analyze historical distribution performance

**Date Range Options**:
- Last 7 days
- Last 14 days
- Last 30 days
- Last 90 days

**Summary Statistics**:
- Total posts across all days
- Successful posts count
- Failed posts count
- Average success rate

**Tier Breakdown**:
- Posts per tier over selected period
- Visual comparison of tier usage

**Daily Metrics Table**:
- Date
- Total posts
- Successful posts (green)
- Failed posts (red)
- Success rate percentage
- Per-tier post counts (T1, T2, T3)

**How to Use**:
1. Select date range based on analysis need
2. Review summary for overall trends
3. Examine daily table for specific patterns
4. Identify days with unusual failure rates
5. Correlate with platform health issues

**Success Rate Guidelines**:
- **90%+**: Excellent performance
- **75-89%**: Expected range (designed loss 25%)
- **60-74%**: Monitor closely, investigate causes
- **<60%**: Urgent attention required

---

### 6. Alerts Page (`/alerts`)

**Purpose**: Review and manage system alerts

**Alert Severity**:
- 🔴 **Critical**: Immediate action required (platform down, system error)
- 🟡 **Warning**: Monitor situation (high failure rate, capacity warning)
- 🔵 **Info**: General information (new content added, metrics updated)

**Alert Categories**:
- **Platform Down**: 5+ failures in 24 hours
- **High Failure Rate**: 2-4 failures in 24 hours
- **Capacity Warning**: Tier 1 slots < 20
- **System**: Dashboard or API issues

**Filters**:
- Severity: Critical, Warning, Info
- Category: Platform-specific filters
- Status: Unread only, Read only, All

**Alert Indicators**:
- Unread alerts have yellow background
- Left border color matches severity
- Timestamp shows when alert was created

**Alert Management**:
1. Review unread alerts daily
2. Address critical alerts immediately
3. Investigate warnings before they become critical
4. Use filters to find specific alert types
5. Mark alerts as read (future feature)

---

### 7. Settings Page (`/settings`)

**Purpose**: Configure system and view webhook endpoints

**System Information**:
- Dashboard version
- Environment (development/production)
- Database connection status
- API key configuration status

**Webhook Endpoints**:
- Content Posted URL (success webhook)
- Content Failed URL (error webhook)
- Copy-to-clipboard buttons
- Authentication instructions

**Tier Capacity**:
- Visual progress bars for each tier
- Used vs available slots
- Reserved slots (Tier 1: 50 for emerging languages)
- Color-coded warnings:
  - 🟢 Green: >50 slots available
  - 🟡 Yellow: 20-50 slots available
  - 🔴 Red: <20 slots available

**Documentation Links**:
- API Documentation
- GitHub Repository

---

## Common Tasks

### Task 1: Check Daily Distribution Status

1. Open Dashboard home page
2. Review "Today's Posts" count
3. Check success rate percentage
4. Review trend indicators (up/down arrows)
5. Scan recent alerts for issues

**Frequency**: Daily, morning routine

---

### Task 2: Investigate Platform Failures

1. Go to Alerts page (`/alerts`)
2. Filter by Severity: Critical
3. Identify affected platform
4. Go to Platforms page (`/platforms`)
5. Locate platform and check failure count
6. Determine action:
   - **API credentials expired**: Update in tool
   - **Platform down**: Wait for recovery
   - **Rate limit**: Adjust distribution schedule

**Frequency**: When critical alerts appear

---

### Task 3: Monitor Tier 1 Capacity

1. Dashboard home shows Tier 1 widget in sidebar
2. Check slots used vs available
3. If < 20 available:
   - Review Tier 1 feeds (only keep high-value)
   - Move experimental content to Tier 2
   - Reserve 50 slots for emerging languages

**Frequency**: Weekly or when capacity warning alert appears

---

### Task 4: Analyze Weekly Performance

1. Go to Metrics page (`/metrics`)
2. Select "Last 7 days"
3. Review summary statistics
4. Compare daily success rates
5. Identify patterns:
   - Which days have higher failures?
   - Which tiers perform best?
   - Are failures trending up or down?

**Frequency**: Weekly, Monday morning

---

### Task 5: Set Up Pabbly Webhooks

1. Go to Settings page (`/settings`)
2. Copy "Content Posted" webhook URL
3. In Pabbly Connect:
   - Add webhook action after successful post
   - Paste URL
   - Add header: `x-api-key: your-key`
   - Map fields from previous steps
4. Repeat for "Content Failed" webhook
5. Test workflow to verify dashboard updates

**Frequency**: One-time setup per platform

---

## Understanding the Data

### Content Lifecycle

```
Pending → In Progress → Completed
                ↓
            Failed
```

- **Pending**: Webhook received, content registered
- **In Progress**: At least 1 platform posted, more remaining
- **Completed**: platformsCompleted >= platformsTargeted
- **Failed**: One or more platforms failed (doesn't block completion)

### Auto-Completion Logic

Content automatically completes when:
```
platformsCompleted >= platformsTargeted
```

Example:
- Target: 5 platforms
- Completed: 3 successful + 2 failed = 5 total
- Status: **Completed** (even with 2 failures)

This reflects the "designed loss" principle (Matthew 13: some seed falls on rocky ground).

### Platform Health Calculation

Platform status based on failures in last 24 hours:
- **0-1 failures**: Healthy 🟢
- **2-4 failures**: Degraded 🟡
- **5+ failures**: Down 🔴

Failure count resets every 24 hours.

### Success Rate Formula

```
successRate = (successfulPosts / totalPosts) * 100
```

Calculated daily and rolled up for date ranges.

Expected range: 75-90% (designed loss: 10-25%)

---

## Troubleshooting

### Issue: Dashboard Not Updating

**Symptoms**: Numbers don't change, content stuck in progress

**Solutions**:
1. Check auto-refresh is enabled (30-second SWR)
2. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
3. Verify Pabbly workflows are running
4. Check webhook authentication (Settings page)

---

### Issue: Content Shows Wrong Tier

**Symptoms**: Content appears in wrong tier section

**Solutions**:
1. Check webhook payload in Pabbly
2. Verify `tier` field is 1, 2, or 3 (number, not string)
3. Review content distribution routing logic

---

### Issue: Tier 1 Capacity Full

**Symptoms**: Tier 1 shows 0 available slots, new content fails

**Solutions**:
1. Audit current Tier 1 feeds
2. Move low-priority feeds to Tier 2
3. Remove inactive feeds
4. Respect 50-slot reserve for emerging languages
5. Consider increasing total slots (requires manual database update)

---

### Issue: Platform Shows "Down" But Works

**Symptoms**: Platform marked down, but manual posts succeed

**Solutions**:
1. Check if failures occurred in last 24 hours
2. Wait for 24-hour window to expire (status auto-updates)
3. Review DistributionLog for actual error messages
4. Verify webhook is sending failures correctly

---

### Issue: Webhook Returns 401 Unauthorized

**Symptoms**: Pabbly reports 401 error, content not logged

**Solutions**:
1. Verify API key in `.env` file
2. Check `x-api-key` header in Pabbly webhook
3. Ensure header name is exact: `x-api-key` (lowercase)
4. Confirm API key matches between `.env` and Pabbly

---

### Issue: Alerts Not Appearing

**Symptoms**: No alerts despite platform failures

**Solutions**:
1. Verify alert generation logic (5+ failures triggers alert)
2. Check Alerts page with "All" filter
3. Review database: `npm run db:studio` → Alert table
4. Confirm webhook is calling `/content-failed` endpoint

---

## Best Practices

### Daily Routine

1. **Morning Review** (5 minutes):
   - Check dashboard home
   - Review unread alerts
   - Verify Tier 1 capacity

2. **End of Day** (3 minutes):
   - Review today's post count
   - Address any critical alerts
   - Plan for next day

### Weekly Analysis

1. **Metrics Review** (15 minutes):
   - Analyze 7-day performance
   - Identify failure patterns
   - Document improvements

2. **Platform Audit** (10 minutes):
   - Review all platform health
   - Update credentials if needed
   - Test degraded platforms

### Monthly Planning

1. **Capacity Planning**:
   - Review Tier 1 usage trends
   - Plan for new languages
   - Optimize feed allocation

2. **Performance Reporting**:
   - Generate 30-day metrics
   - Share with team
   - Document decisions

---

## Support

### Need Help?

1. **Documentation**:
   - README.md (overview)
   - API_DOCUMENTATION.md (webhooks)
   - DEPLOYMENT.md (hosting)

2. **Build Instructions**:
   - `docs/Claude_Code_Build_Instructions_v3.md`

3. **Strategic Context**:
   - `docs/20260203_Ministry_Automation_Strategy_Updated.md`

4. **Database**:
   - Open Prisma Studio: `npm run db:studio`
   - View raw data directly

---

**🌊 Reaching 1 billion people through automation | Multiplication over control**
