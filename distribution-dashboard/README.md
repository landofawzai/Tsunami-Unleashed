# Distribution Dashboard

> **4-Tier Distribution Monitoring for Tsunami Unleashed**
> Real-time tracking of content distribution across RSS, external feeds, and social platforms

---

## Overview

The Distribution Dashboard is the central monitoring system for Tsunami Unleashed's 4-tier distribution architecture. It tracks content as it flows through the pipeline, monitors platform health, and provides insights into distribution effectiveness.

### Key Features

- ✅ **Real-time tracking** of content across all distribution tiers
- 📊 **Platform health monitoring** with automatic alerts
- 📈 **Daily metrics** with tier-specific breakdowns
- 🎯 **Tier 1 capacity tracking** (150-slot limit enforcement)
- 🔔 **Auto-generated alerts** for failures and warnings
- 🔄 **30-second auto-refresh** for live updates (coming in Session 2)

---

## Four-Tier Distribution Strategy

### Tier 1: RSS Vault (RSSground)
- **150 lifetime slots** (50 reserved for emerging languages)
- Depth content for serious disciples
- Persecution-resistant backbone
- **Tool**: RSSground

### Tier 2: External Feeds (Ghost/Cloudflare)
- **Unlimited capacity**
- Public-facing RSS distribution
- Platform-independent content delivery
- **Tools**: Ghost, Cloudflare Pages

### Tier 3: Platform-Native (Followr/Robomotion)
- **Unlimited capacity**
- Social media platforms (YouTube, Facebook, Instagram, etc.)
- Native platform posting via automation
- **Tools**: Followr (via Ubot Studio), Robomotion

### Tier 4: Satellite Syndication (IFTTT)
- **Deliberately excluded from dashboard** for fingerprint isolation
- Managed via encrypted spreadsheet (offline)
- Security-first approach for sensitive regions
- **Tool**: IFTTT applets

---

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Prisma ORM + SQLite
- **Styling**: CSS (will add Tailwind in Session 3)
- **Auto-refresh**: SWR (to be implemented in Session 2)
- **TypeScript**: Full type safety

---

## Database Schema

### 7 Core Models

1. **ContentItem** - Tracks content through distribution pipeline
2. **DistributionLog** - Audit trail for each platform post
3. **PlatformHealth** - Real-time platform status monitoring
4. **RssFeed** - Tier-specific RSS feed tracking
5. **TierCapacity** - Tier 1 slots vs Tier 2/3 unlimited
6. **Alert** - Auto-generated alerts for failures/warnings
7. **PipelineMetric** - Daily rollup with tier breakdowns

---

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and set your API_KEY
   ```

3. **Initialize database**
   ```bash
   npm run db:push
   ```

4. **Seed initial data**
   ```bash
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open dashboard**
   ```
   http://localhost:3000
   ```

---

## Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run db:push     # Push Prisma schema to database
npm run db:studio   # Open Prisma Studio (database GUI)
npm run db:seed     # Seed database with initial data
```

---

## Project Structure

```
distribution-dashboard/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home dashboard
│   └── globals.css        # Global styles
├── components/            # React components (upcoming)
├── lib/                   # Utility functions
│   └── prisma.ts         # Prisma client singleton
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database models
│   └── seed.js          # Database seed script
├── public/              # Static assets
├── .env                 # Environment variables (git-ignored)
├── .env.example         # Example environment file
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies
└── tsconfig.json        # TypeScript configuration
```

---

## Build Sessions Roadmap

✅ **Session 1**: Project scaffolding & database (COMPLETE)
- Next.js 14 setup
- Prisma schema with 7 models
- Database seeding
- Basic home page

✅ **Session 2**: Webhook API layer (COMPLETE)
- POST /api/webhooks/content-posted
- POST /api/webhooks/content-failed
- API key authentication
- Auto-completion logic
- Platform health monitoring
- Tier capacity tracking
- Alert generation
- Pipeline metrics updates

✅ **Session 3**: Dashboard layout & pipeline overview (COMPLETE)
- Real-time stats cards with trend indicators
- Tier capacity sidebar widget with visual progress bar
- SWR auto-refresh (30-second intervals)
- Responsive design with gradient background
- Reusable UI components (Card, StatCard, Badge)
- Dashboard API endpoints for real-time data
- Alert notifications display
- Content status breakdown

🔜 **Sessions 4-10**: Full dashboard features
- Content list & detail views
- Platform health page
- RSS feeds management
- Metrics & alerts
- Settings page
- Documentation
- Polish & deployment

---

## Integration with Pabbly Connect

The dashboard receives data via webhook endpoints triggered by Pabbly workflows.

### Webhook Endpoints

**POST /api/webhooks/content-posted**
- Records successful platform posts
- Auto-increments platformsCompleted
- Updates platform health status
- Triggers auto-completion when all platforms done
- Updates tier capacity and daily metrics

**POST /api/webhooks/content-failed**
- Records failed platform posts
- Creates alerts for failures
- Tracks failure counts (24h)
- Updates platform health to degraded/down
- Maintains pipeline metrics accuracy

**See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete webhook specs**

### Data Flow
1. Content is published (Pillar 1 or 2)
2. Pabbly workflow triggers distribution to platforms
3. Platform posts (success or failure)
4. Pabbly sends webhook to Distribution Dashboard
5. Dashboard updates ContentItem, DistributionLog, PlatformHealth
6. Auto-completion logic checks if all platforms complete
7. Metrics aggregated for daily rollup
8. Alerts generated for failures (≥5 in 24h)

---

## Design Principles

### Biblical Principles
- **M2L First**: Automation serves obedience, not metrics
- **CC0 Licensing**: All content public domain
- **Designed Loss**: 75% failure rate expected (Matthew 13)
- **Persecution-Resistant**: System continues if HQ disappears

### Technical Principles
- **Tier 4 Exclusion**: IFTTT deliberately untracked for security
- **RSS-First**: Platforms are mirrors; RSS is backbone
- **Auto-completion**: Items auto-complete when platformsCompleted = platformsTargeted
- **Tool Attribution**: Every post tagged with management tool

---

## License

**CC0-1.0** - Public Domain Dedication

This work has been dedicated to the public domain. To the extent possible under law, Tsunami Unleashed has waived all copyright and related or neighboring rights to this work.

---

## Support

For questions or issues:
1. Check the documentation in `/docs`
2. Review the build instructions: `docs/Claude_Code_Build_Instructions_v3.md`
3. Review strategic context: `docs/20260203_Ministry_Automation_Strategy_Updated.md`

---

**🌊 Reaching 1 billion people through automation | Multiplication over control**
