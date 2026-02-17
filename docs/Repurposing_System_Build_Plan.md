# Content Repurposing + Translation System — Build Plan

## Context

Pillar 2 of Tsunami Unleashed. Distribution (Pillar 3) and Communication (Pillar 4) are complete. This system takes source content (sermons, teachings, articles — both text and video/audio) and transforms each piece into many derivatives (blog posts, social quotes, study guides, etc.), then translates them into Hindi, Bengali, and Maithili. The dashboard does **actual processing** — FFmpeg, ElevenLabs Scribe transcription, Claude AI text generation, FAL.AI image generation — not just tracking.

**User requirements:**
- Mixed source content (text + video/audio)
- Dashboard performs actual media processing
- All derivative formats in v1
- Translation languages: Hindi (hi), Bengali (bn), Maithili (mai)

## Architecture

Separate Next.js 14 app at `repurposing-dashboard/` on **port 3002** (Distribution=3000, Communication=3001). Same stack: Prisma + SQLite, SWR 30-second refresh, styled-jsx, x-api-key webhook auth. Integration via Google Drive + Pabbly Connect, no direct pillar-to-pillar calls.

### Processing Pipeline

```
Source arrives (Pabbly webhook or manual upload)
  → SourceContent record + ProcessingJob created
  → If audio/video: FFmpeg extract audio → ElevenLabs Scribe transcribe → store transcription
  → If text: store body directly
  → For each derivative type: Claude Haiku generates from transcription/text using templates
  → For each derivative × language: Claude Haiku translates (3-pass: AI draft → local review → theological)
  → Quote graphics: FAL.AI generates images from social quotes
  → Ready derivatives/translations fire Pabbly webhook → Distribution Dashboard
```

### Tools & Cost

| Tool | Purpose | Cost |
|---|---|---|
| FFmpeg (CLI) | Audio/video processing | Free |
| ElevenLabs Scribe | Transcription (96.7% accuracy, fewer hallucinations than Whisper, better Hindi/Bengali) | ~$0.007/min ($0.40/hr) |
| Claude Haiku | Derivative generation + translation | ~$0.25/$1.25 per 1M tokens |
| FAL.AI | Quote graphic image generation (FLUX/Recraft models, 600+ models available) | ~$0.01-$0.05/image |
| Google Drive API | File storage + inter-pillar exchange | Free |
| Pabbly Connect | Event routing | Already owned |

**No additional npm packages** — FFmpeg via `child_process.exec`, ElevenLabs/Claude/FAL.AI via `fetch`, Google Drive via service account + fetch.

## Database Schema (11 Models)

| # | Model | Purpose |
|---|---|---|
| 1 | **SourceContent** | Original content from Content Creation. Fields: contentId (cross-pillar), title, contentType, mediaType, transcription, status, durationSeconds |
| 2 | **Derivative** | Generated content pieces. Fields: contentId (own), parentContentId, derivativeType, body, language, sentToDistribution |
| 3 | **Translation** | Translated versions. Fields: contentId (own), parentContentId, targetLanguage, body, status (ai_draft→review_pending→reviewed→approved), reviewPass (1-3) |
| 4 | **ProcessingJob** | Async job queue. Fields: jobType (transcription/clip_extraction/derivative_generation/translation/batch_repurpose), status, progress (0-100), retryCount |
| 5 | **DerivativeTemplate** | Reusable AI prompts. Fields: derivativeType, systemPrompt, userPromptTemplate, maxTokens |
| 6 | **Alert** | Auto-generated failures/warnings (same pattern as Distribution/Communication) |
| 7 | **RepurposingMetric** | Daily rollups: sourcesIngested, derivativesGenerated, translationsCompleted, aiTokensUsed, scribeMinutes, imagesGenerated |
| 8 | **LanguageConfig** | Per-language settings: code, name, nativeName, isActive, hasLocalReviewer |
| 9 | **PabblyEvent** | Event log for debugging inbound/outbound Pabbly calls |
| 10 | **SystemSetting** | Key-value config store |
| 11 | **DerivativeQueue** | Batch processing queue for mass derivative+translation generation |

### Key Relationships
- SourceContent → many Derivatives → many Translations
- SourceContent → many ProcessingJobs
- Derivative.parentContentId links to SourceContent.contentId (cross-pillar tracking)
- Translation.parentContentId links to Derivative.contentId

## 8 Derivative Types

1. **blog_post** — Long-form article from sermon/teaching
2. **social_quote** — Short quotable excerpt for social media
3. **thread_summary** — Multi-part thread format (Twitter/X style)
4. **study_guide** — Questions and reflection points
5. **newsletter_excerpt** — Condensed summary for email newsletters
6. **audio_transcription** — Cleaned-up transcription from ElevenLabs Scribe
7. **video_clip_meta** — Timestamp-based clip boundaries for video segments
8. **quote_graphic** — AI-generated image with text overlay via FAL.AI (FLUX/Recraft models)

## Core Library Modules

| File | Purpose |
|---|---|
| `lib/prisma.ts` | Singleton Prisma client |
| `lib/auth.ts` | x-api-key webhook validation |
| `lib/transcription-engine.ts` | ElevenLabs Scribe API integration |
| `lib/media-processor.ts` | FFmpeg CLI operations |
| `lib/derivative-generator.ts` | Claude Haiku text generation |
| `lib/image-generator.ts` | FAL.AI image generation for quote graphics |
| `lib/translation-engine.ts` | 3-pass translation pipeline |
| `lib/job-processor.ts` | Async job queue engine |
| `lib/drive-integration.ts` | Google Drive read/write + .meta.json sidecars |
| `lib/pabbly-integration.ts` | Pabbly event routing |
| `lib/metrics-helpers.ts` | Daily metrics + alert generation |

## Dashboard Pages (12)

| Route | Purpose |
|---|---|
| `/` | Home — StatCards, pipeline flow, derivative breakdown, language progress, alerts |
| `/sources` | Source content list — filter by contentType, mediaType, status |
| `/sources/[id]` | Source detail — transcription viewer, derivative list, action buttons |
| `/derivatives` | Derivative browser — filter by type, language, status, distribution |
| `/derivatives/[id]` | Derivative detail — preview, edit, translate, send to distribution |
| `/translations` | Translation management — review queue, side-by-side view, approve/reject |
| `/translations/[id]` | Translation detail — side-by-side, reviewer notes, 3-pass indicator |
| `/jobs` | Processing queue — active with progress bars, queued, completed, failed |
| `/templates` | Template management — edit AI prompts, preview, usage stats |
| `/metrics` | Analytics — daily charts, language breakdown, AI/Scribe/FAL usage, distribution rates |
| `/alerts` | Alerts — same pattern as Distribution/Communication |
| `/settings` | Config — API keys, languages, default types, Pabbly URLs |

## API Routes (~35 total)

**Webhooks (x-api-key):**
- `POST /api/webhooks/source-content` — Receive new source from Pabbly
- `POST /api/webhooks/job-complete` — External processing callback
- `POST /api/webhooks/translation-reviewed` — Local reviewer feedback

**Sources:** GET/POST `/api/sources`, GET `/api/sources/[id]`, POST `/api/sources/[id]/repurpose`

**Derivatives:** GET/POST `/api/derivatives`, GET/PATCH `/api/derivatives/[id]`, POST `/api/derivatives/generate`, POST `/api/derivatives/[id]/send-to-distribution`

**Translations:** GET `/api/translations`, GET/PATCH `/api/translations/[id]`, POST `/api/translations/translate`, POST `/api/translations/[id]/review`, POST `/api/translations/[id]/approve`

**Jobs:** GET/POST `/api/jobs`, GET `/api/jobs/[id]`, POST `/api/jobs/[id]/retry`, POST `/api/jobs/[id]/cancel`, POST `/api/jobs/process-next`

**Templates:** GET/POST `/api/templates`, GET/PATCH `/api/templates/[id]`

**System:** GET `/api/dashboard/stats`, GET `/api/dashboard/alerts`, GET `/api/metrics`, GET/PATCH `/api/alerts/[id]`, GET/PATCH `/api/settings`, GET/POST `/api/languages`, PATCH `/api/languages/[id]`, GET `/api/pabbly-events`

## Pabbly Workflows

| Name | Direction | Purpose |
|---|---|---|
| `ROUTE-SourceContent-to-Repurposing` | Inbound | New file in `/Source Content/` triggers ingestion |
| `ROUTE-Derivatives-to-Distribution` | Outbound | Ready derivative → Distribution webhook |
| `ROUTE-Translations-to-Distribution` | Outbound | Approved translation → Distribution webhook |
| `INTERNAL-Repurposing-ProcessQueue` | Internal | Every 5 min → `/api/jobs/process-next` |
| `INTERNAL-Repurposing-DailyMetrics` | Internal | Daily rollup |

## 10 Build Sessions

### Session 1: Project Scaffolding + Database + Seed
### Session 2: Processing Engines (Transcription + Media + Jobs)
### Session 3: Derivative Generation + Translation + Image Engines
### Session 4: Dashboard Layout + Home Overview
### Session 5: Source Content Management
### Session 6: Derivative Browser
### Session 7: Translation Management
### Session 8: Processing Queue + Templates
### Session 9: Metrics + Alerts
### Session 10: Settings + Polish + Documentation
