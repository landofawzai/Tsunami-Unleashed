# Content Repurposing + Translation Dashboard

**Pillar 2 of Tsunami Unleashed** — Transform 1 source → 500+ derivatives → Hindi, Bengali, Maithili

## Overview

This dashboard is the content multiplication engine for Tsunami Unleashed. It takes source content (sermons, teachings, articles — both text and video/audio) and:

1. **Transcribes** audio/video via ElevenLabs Scribe (96.7% accuracy)
2. **Generates** 8 derivative types using Claude Haiku AI
3. **Creates** quote graphic images via FAL.AI (FLUX/Recraft models)
4. **Translates** into Hindi, Bengali, and Maithili with 3-pass review
5. **Distributes** approved content to Pillar 3 (Distribution Dashboard)

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Prisma ORM + SQLite |
| Port | 3002 |
| Auto-refresh | SWR (30-second intervals) |
| Styling | styled-jsx |
| Transcription | ElevenLabs Scribe API |
| AI Generation | Claude Haiku (Anthropic API) |
| Image Generation | FAL.AI REST API |
| Media Processing | FFmpeg (child_process.exec) |
| Orchestration | Pabbly Connect (webhooks) |
| File Storage | Google Drive API |

## Quick Start

```bash
# Install dependencies
npm install

# Initialize database
npx prisma db push
npx prisma db seed

# Development
npm run dev    # http://localhost:3002

# Production build
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL="file:./dev.db"
API_KEY="your-webhook-api-key"

# AI & Processing
ANTHROPIC_API_KEY="sk-ant-..."
ELEVENLABS_API_KEY="..."
FAL_API_KEY="..."

# Google Drive
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL="..."
GOOGLE_DRIVE_PRIVATE_KEY="..."
GOOGLE_DRIVE_FOLDER_ID="..."

# Pabbly Webhooks
PABBLY_WEBHOOK_DERIVATIVE_CREATED="..."
PABBLY_WEBHOOK_TRANSLATION_READY="..."

# Distribution Dashboard
DISTRIBUTION_WEBHOOK_URL="http://localhost:3000/api/webhooks/content"
DISTRIBUTION_API_KEY="..."
```

## Database (11 Models)

| Model | Purpose |
|-------|---------|
| **SourceContent** | Original content (sermons, teachings, articles) |
| **Derivative** | Generated content pieces (8 types) |
| **Translation** | Translated versions (3-pass review pipeline) |
| **ProcessingJob** | Async job queue with priority and retry |
| **DerivativeTemplate** | Reusable AI prompt templates |
| **Alert** | Auto-generated system alerts |
| **RepurposingMetric** | Daily analytics rollups |
| **LanguageConfig** | Per-language translation settings |
| **PabblyEvent** | Webhook event log for debugging |
| **SystemSetting** | Key-value configuration store |
| **DerivativeQueue** | Batch processing queue |

## 8 Derivative Types

1. **Blog Post** — Long-form article from sermon/teaching
2. **Social Quote** — Short quotable excerpt for social media
3. **Thread Summary** — Multi-part thread format (Twitter/X style)
4. **Study Guide** — Questions and reflection points
5. **Newsletter Excerpt** — Condensed summary for email
6. **Audio Transcription** — Cleaned-up transcription
7. **Video Clip Meta** — Timestamp-based clip boundaries
8. **Quote Graphic** — AI-generated image with text overlay (FAL.AI)

## Translation Pipeline (3-Pass)

```
AI Draft (Claude Haiku) → Local Speaker Review → Theological Review → Approved
```

- **Pass 1**: AI generates initial translation
- **Pass 2**: Local language speaker reviews and edits
- **Pass 3**: Theological accuracy verification
- **Languages**: Hindi (hi), Bengali (bn), Maithili (mai)

## Processing Pipeline

```
Source arrives (Pabbly webhook or manual)
  → If audio/video: FFmpeg extract → ElevenLabs Scribe transcribe
  → If text: store body directly
  → Claude Haiku generates derivatives using templates
  → For each derivative × language: translate (3-pass)
  → Approved content → Pabbly webhook → Distribution Dashboard
```

## Dashboard Pages (12)

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Pipeline overview, stats, language progress |
| Sources | `/sources` | Source content list with filters |
| Source Detail | `/sources/[id]` | Transcription viewer, derivatives, jobs |
| Derivatives | `/derivatives` | Browse by type, status, distribution |
| Derivative Detail | `/derivatives/[id]` | Edit, translate, send to distribution |
| Translations | `/translations` | Review queue with language filters |
| Translation Detail | `/translations/[id]` | Side-by-side 3-pass review |
| Jobs | `/jobs` | Processing queue with progress bars |
| Templates | `/templates` | AI prompt template editor |
| Metrics | `/metrics` | Charts, costs, language breakdown |
| Alerts | `/alerts` | System alert management |
| Settings | `/settings` | API keys, languages, Pabbly events |

## API Routes (33)

### Webhooks (require x-api-key header)
- `POST /api/webhooks/source-content` — Receive new source from Pabbly
- `POST /api/webhooks/job-complete` — External processing callback
- `POST /api/webhooks/translation-reviewed` — Local reviewer feedback

### Sources
- `GET /api/sources` — List with search, contentType, mediaType, status filters
- `POST /api/sources` — Create source manually
- `GET /api/sources/[id]` — Detail with derivatives and jobs
- `POST /api/sources/[id]/repurpose` — Trigger batch derivative generation

### Derivatives
- `GET /api/derivatives` — List with type, status, distribution filters
- `POST /api/derivatives/generate` — Trigger generation from source
- `GET /api/derivatives/[id]` — Detail with translations
- `PATCH /api/derivatives/[id]` — Update body/status
- `POST /api/derivatives/[id]/send-to-distribution` — Upload to Drive + fire Pabbly

### Translations
- `GET /api/translations` — List with language, status, pass filters
- `POST /api/translations/translate` — Trigger translation (single/batch)
- `GET /api/translations/[id]` — Detail with derivative
- `PATCH /api/translations/[id]` — Update body/status/notes
- `POST /api/translations/[id]/review` — Submit review (approve/reject/edit)
- `POST /api/translations/[id]/approve` — Final approval

### Jobs
- `GET /api/jobs` — List with status, type filters
- `POST /api/jobs` — Create manual job
- `GET /api/jobs/[id]` — Job detail
- `POST /api/jobs/[id]/retry` — Retry failed job
- `POST /api/jobs/[id]/cancel` — Cancel queued job
- `POST /api/jobs/process-next` — Trigger next queued job

### Templates
- `GET /api/templates` — List with type filter
- `POST /api/templates` — Create template
- `GET /api/templates/[id]` — Template detail
- `PATCH /api/templates/[id]` — Update template

### System
- `GET /api/dashboard/stats` — Overview statistics
- `GET /api/dashboard/alerts` — Recent unread alerts
- `GET /api/metrics` — Daily rollup metrics (configurable period)
- `GET /api/alerts/[id]` — Alert detail
- `PATCH /api/alerts/[id]` — Mark read/resolved
- `GET /api/settings` — System settings
- `PATCH /api/settings` — Update settings
- `GET /api/languages` — Language configurations
- `POST /api/languages` — Add language
- `PATCH /api/languages/[id]` — Update language config
- `GET /api/pabbly-events` — Webhook event log

## Pabbly Workflows

| Workflow | Direction | Purpose |
|----------|-----------|---------|
| `ROUTE-SourceContent-to-Repurposing` | Inbound | New file triggers ingestion |
| `ROUTE-Derivatives-to-Distribution` | Outbound | Ready derivative → Distribution |
| `ROUTE-Translations-to-Distribution` | Outbound | Approved translation → Distribution |
| `INTERNAL-Repurposing-ProcessQueue` | Internal | Every 5 min → process-next |
| `INTERNAL-Repurposing-DailyMetrics` | Internal | Daily rollup |

## Integration

This dashboard integrates with other Tsunami Unleashed pillars via Google Drive (shared filesystem) and Pabbly Connect (event routing). No direct pillar-to-pillar API calls.

- **Pillar 1 → Pillar 2**: Source content arrives via Pabbly webhook
- **Pillar 2 → Pillar 3**: Derivatives/translations sent via Pabbly to Distribution Dashboard

## Cost Estimates

| Service | Cost | Notes |
|---------|------|-------|
| ElevenLabs Scribe | ~$0.007/min | ~$0.40/hour of audio |
| Claude Haiku | ~$0.25/$1.25 per 1M tokens | Input/output |
| FAL.AI | ~$0.01–$0.05/image | FLUX/Recraft models |

## License

CC0-1.0 (Public Domain) — All content designed for maximum reproduction.
