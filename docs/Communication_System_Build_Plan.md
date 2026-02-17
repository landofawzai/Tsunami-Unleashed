# Communication System - Build Plan

## What This Is

An **outbound communication system** — the tool for reaching people with ministry updates, announcements, prayer requests, and targeted messages across every channel (email, social media, WhatsApp, Telegram, Signal, SMS).

This is NOT an inbound intake/triage system. This is about **speaking OUT**, not listening in.

## How It Differs From Distribution

| | Distribution (Built) | Communication (This Build) |
|---|---|---|
| **Sends** | Content (sermons, articles, videos) | Messages (updates, announcements, instructions) |
| **To** | Public platforms (anyone browsing) | Known people (field workers, supporters, seekers) |
| **Tracking** | "Did the post go live?" | "Did John in Nairobi get the message?" |
| **Relationship** | One-to-many broadcast | Targeted to segments/individuals |
| **Tone** | Published/formal content | Conversational, relational, operational |

Distribution pushes **content to platforms**. Communication sends **messages to people**.

## Architecture

- **Separate Next.js 14 app** at `communication-dashboard/` (pillar independence)
- Same stack as Distribution Dashboard: Prisma + SQLite, SWR, styled-jsx, x-api-key auth
- **Low/no-cost delivery tools** — no paid APIs (SendGrid, Twilio, WhatsApp Business API). Instead:
  - **Gmail** for email (sent slowly to respect rate limits, free)
  - **Ubot Studio** for WhatsApp, Telegram, Signal (mimics human interaction, unlimited license already owned)
  - **Followr/Robomotion** for social media (already in Distribution stack)
  - **Pabbly Connect** as orchestration layer (routes delivery requests to the right tool)
- Dashboard creates and schedules; Pabbly orchestrates; Ubot/Gmail execute; status returns via webhooks

### Input Methods (Two Paths)

1. **Dashboard composer** — for quick/urgent comms (prayer requests, urgent alerts, field notices). Type directly in browser, preview, send.
2. **Google Drive drop** — for planned communications (ministry updates, announcements). Drop doc in `Communication/Outbound/`, Pabbly picks it up, creates campaign as "pending_approval" in dashboard for review/approve/schedule.

### Delivery Flow

```
[Communication Dashboard] → creates campaign, picks audience, schedules
        ↓ (webhook trigger)
[Pabbly Connect] → routes to delivery tools
        ↓                          ↓                      ↓
[Gmail (slow drip)]    [Ubot Studio (WhatsApp,     [Followr/Robomotion
                        Telegram, Signal - mimics    (social media)]
                        human one-by-one)]
        ↓ (delivery callbacks via Pabbly)
[Communication Dashboard] → logs delivery status per recipient
```

**Cost model**: $0 additional — Gmail is free, Ubot Studio is already owned (unlimited license), Pabbly/Followr/Robomotion already in the stack.

**Rate limiting**: Because Gmail and Ubot send slowly (not bulk API), the system queues messages and sends sequentially. This is a feature, not a bug — it looks human, avoids spam filters, and costs nothing.

## Features (All in v1)

1. **Ministry updates** — broadcast what's happening to selected audiences
2. **Multi-channel delivery** — email, social media, WhatsApp, Telegram, Signal, SMS
3. **Field-level comms** — targeted messages to field workers about items of interest
4. **Audience segmentation** — field leaders, supporters, seekers, prayer partners, translators each get relevant messages
5. **Compose once, adapt per channel** — AI adapts one message: full email, short social post, SMS snippet, WhatsApp formatted
6. **Language-aware delivery** — send in recipient's preferred language (AI translation)
7. **Time-zone scheduling** — deliver at appropriate local times
8. **Automated sequences** — drip campaigns (onboarding new field workers, welcome series, seeker nurture)
9. **Prayer request broadcasts** — dedicated message type for prayer needs pushed to prayer partners
10. **Urgent/emergency alerts** — immediate broadcast bypassing normal scheduling (persecution, disasters, critical needs)
11. **Approval workflow** — draft → review → approve → send for sensitive communications
12. **Delivery tracking** — sent, delivered, opened, failed per recipient per channel
13. **Contact management** — people database with segments, channels, languages, regions

## Database Schema (13 Models)

### People
- **Contact** — Individual people (name, email, phone, WhatsApp, Telegram, Signal, region, language, timezone)
- **Segment** — Audience groups (field_leaders, supporters, seekers, prayer_partners, translators)
- **ContactSegment** — Many-to-many join

### Messages
- **Campaign** — A communication effort (title, body, type, status, priority, approval tracking)
- **CampaignVersion** — Channel-specific adaptation (email version, SMS version, WhatsApp version, etc.)

### Delivery
- **Broadcast** — Scheduled delivery of a campaign to a segment via selected channels
- **DeliveryLog** — Per-recipient, per-channel delivery tracking (queued/sent/delivered/opened/failed)

### Automation
- **Sequence** — Automated drip campaign definition
- **SequenceStep** — Individual steps within a sequence (delay, content, channels)
- **SequenceEnrollment** — Contact's progress through a sequence

### System
- **Template** — Reusable message templates
- **Alert** — System notifications (delivery failures, sequence errors)
- **CommunicationMetric** — Daily rollup stats

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Prisma ORM + SQLite |
| Auto-Refresh | SWR (30-second polling) |
| Language | TypeScript |
| Styling | styled-jsx (scoped CSS) |
| Auth | x-api-key header on webhooks |
| AI Adaptation | Claude Haiku (channel + language) |
| Email | Gmail via Pabbly (free) |
| IM Channels | Ubot Studio (owned, unlimited) |
| Social Media | Followr/Robomotion (existing stack) |
| Orchestration | Pabbly Connect |
| Port | 3001 (avoids collision with Distribution on 3000) |

## Build Sessions

### Session 1: Project Scaffolding & Database ✅
- Next.js 14 project with TypeScript
- Prisma schema with all 13 models
- 41 contacts across 12 global regions
- 5 segments with assignments
- Sample campaigns, broadcasts, sequences, templates
- lib/prisma.ts, lib/auth.ts

### Session 2: AI Message Adapter & Channel Engine
- Channel adapter (adapt one message for email/SMS/WhatsApp/Telegram/Signal/social)
- Translation engine (AI-powered, per-language caching)
- Campaign version generator

### Session 3: Broadcast Engine & Delivery Pipeline
- Broadcast creation and execution
- Timezone-aware scheduling
- Pabbly webhook integration
- Delivery status callback webhook
- Google Drive intake webhook (Pabbly → campaign creation)

### Session 4: Dashboard Layout & Overview Page
- Navigation component
- Home dashboard with stats, recent campaigns, delivery health
- Reusable UI components (Badge, Card, StatCard)

### Session 5: Campaign Composer & Approval Workflow
- Campaign list with filters
- Composer with AI channel adaptation preview
- Approval workflow (draft → approve → schedule → send)

### Session 6: Contact Management & Segmentation
- Contact directory with search/filter
- Segment management
- Bulk import (CSV/JSON)

### Session 7: Scheduling & Broadcast Management
- Broadcast queue with timezone visualization
- Delivery monitoring (per-recipient logs)
- Immediate send capability

### Session 8: Automated Sequences (Drip Campaigns)
- Sequence builder with step timeline
- Auto-enrollment triggers
- Enrollment tracking and progression

### Session 9: Prayer Broadcasts, Urgent Alerts & Metrics
- Quick prayer request broadcaster
- Emergency alert with immediate delivery
- Communication metrics and analytics

### Session 10: Templates, Settings, Documentation & Polish
- Template library
- System configuration
- API documentation, user guide, deployment guide
- UI polish and production build

## Integration Points (Pabbly Connect)

| Workflow Name | Direction | Tool | Cost |
|---|---|---|---|
| `OUTBOUND-Communication-email` | Dashboard → Pabbly → Gmail | Gmail (slow drip) | Free |
| `OUTBOUND-Communication-whatsapp` | Dashboard → Pabbly → Ubot Studio | Ubot (one-by-one) | Free (owned) |
| `OUTBOUND-Communication-telegram` | Dashboard → Pabbly → Telegram Bot API | Free Bot API | Free |
| `OUTBOUND-Communication-signal` | Dashboard → Pabbly → Ubot Studio | Ubot (one-by-one) | Free (owned) |
| `OUTBOUND-Communication-sms` | Dashboard → Pabbly → Gmail carrier gateways | Email-to-SMS | Free |
| `OUTBOUND-Communication-social` | Dashboard → Pabbly → Followr/Robomotion | Existing stack | Free (owned) |
| `CALLBACK-delivery-status` | Pabbly → Dashboard webhook | — | — |
| `INTERNAL-Communication-sequence-tick` | Pabbly scheduled → Dashboard webhook | — | — |
| `INTAKE-Communication-from-drive` | Google Drive → Pabbly → Dashboard webhook | — | — |

**Total additional cost: $0**

## Google Drive Folder Structure

```
📁 Communication/
  📁 Outbound/        Drop docs here → Pabbly picks up → creates campaign
  📁 Templates/       Shared template files
  📁 Contacts/        Contact export/import staging
```
