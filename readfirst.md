# Tsunami Unleashed — Session Handoff

## Project
Ministry automation system — 6-pillar architecture to reach 1 billion people globally.

## Tech Stack
- Next.js 14 (App Router) + React 18 + TypeScript
- Prisma ORM + SQLite
- SWR (30s auto-refresh)
- Deployed on Hetzner VPS via PM2 + nginx

## Current Branch
`master`

## Recent Commits
- a4a7b1d fix(translate): show original text on desktop and fix mobile toggle
- 3d9689d feat(repurposing): add mobile-first translator portal with auth
- 2dd21dc fix(master-dashboard): make all pages mobile-responsive
- f24308e fix(master-dashboard): extract pillar metrics instead of rendering raw objects
- cf7dff7 feat(master-dashboard): Session 4 — deployment script + status docs
- ec2686b feat(master-dashboard): Session 3 — pipeline visualization + settings page
- f231d4c feat(master-dashboard): Session 2 — home dashboard + status page
- 181e2a0 feat(master-dashboard): Session 1 — scaffolding + aggregation API
- cad61d1 feat(content-creation): Session 10 — deployment to Hetzner
- fd9b90a docs(communication): record successful Hetzner production deployment

## Uncommitted Work (about to be committed)
- `communication-dashboard/lib/pabbly-integration.ts` — Added direct Telegram Bot API support; Telegram channel now bypasses Pabbly and calls the Telegram API directly from the dashboard

## What's Been Built

### Dashboards (all deployed to Hetzner)
| Dashboard | Port | Status |
|-----------|------|--------|
| Master Dashboard | 3080 | Deployed |
| Content Creation | 3082 | Deployed |
| Communication | 3081 | Deployed |
| Translator Portal | 3083 | Deployed |

### Communication Dashboard — Channel Status
| Channel | Integration | Status |
|---------|------------|--------|
| Email | Pabbly → Gmail | Wired, needs production test |
| Telegram | Direct Bot API | Wired and tested |
| WhatsApp | Pabbly (placeholder) | Not configured |
| Signal | Pabbly (placeholder) | Not configured |
| SMS | Pabbly (placeholder) | Not configured |
| Social Media | Pabbly (placeholder) | Not configured |

## Key Files
- `communication-dashboard/lib/pabbly-integration.ts` — Delivery routing (Pabbly + direct APIs)
- `communication-dashboard/lib/broadcast-engine.ts` — Broadcast execution
- `communication-dashboard/lib/sequence-engine.ts` — Drip campaign automation
- `communication-dashboard/lib/channel-adapter.ts` — AI channel adaptation (requires ANTHROPIC_API_KEY)
- `communication-dashboard/lib/translator.ts` — AI translation (requires ANTHROPIC_API_KEY)
- `communication-dashboard/.env` — All config keys and webhook URLs

## Known Issues
- Anthropic API key and Telegram bot token were exposed in a Claude Code chat session — rotate both
- Pabbly's native Telegram Bot action failed (parse mode issues) — bypassed with direct API
- Sequence pause/resume logic is incomplete
- Settings page backend is limited

## Session Instructions
- `.env` is not tracked by git — secrets stay local
- Telegram now uses `TELEGRAM_BOT_TOKEN` env var (not `PABBLY_WEBHOOK_TELEGRAM`)
- Channels with `PASTE-` placeholder URLs are silently skipped (pipeline continues)
