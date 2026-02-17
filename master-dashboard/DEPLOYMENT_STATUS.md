# Master Dashboard — Deployment Status

## Deployment Details

| Property | Value |
|----------|-------|
| **Dashboard** | Master Command Center |
| **Server** | Hetzner VPS 5.78.183.112 |
| **App Port** | 3004 |
| **nginx Port** | 3083 |
| **PM2 Name** | tsunami-master |
| **URL** | http://5.78.183.112:3083 |
| **Database** | None — pure aggregation layer |
| **Deployed** | 2026-02-17 |

## All Dashboards on Hetzner

| Pillar | Dashboard | App Port | nginx Port | PM2 Name | URL | Status |
|--------|-----------|----------|------------|----------|-----|--------|
| — | **Master Command Center** | 3004 | 3083 | tsunami-master | http://5.78.183.112:3083 | **Live** |
| 1 | Content Creation | 3003 | 3082 | tsunami-creation | http://5.78.183.112:3082 | **Live** |
| 2 | Repurposing | 3002 | 3080 | tsunami-repurposing | http://5.78.183.112:3080 | **Live** |
| 3 | Distribution | 3000 | 80 | tsunami-dashboard | http://5.78.183.112 | **Live** |
| 4 | Communication | 3001 | 3081 | tsunami-communication | http://5.78.183.112:3081 | **Live** |
| 5 | Administration | 3005 | 3084 | tsunami-admin | — | **Not Built** |
| 6 | Discipling | 3006 | 3085 | tsunami-discipling | — | **Not Built** |

## Pages (4)

| Route | Purpose |
|-------|---------|
| `/` | Home — system health bar, quick stats, pipeline flow, pillar overview grid, cross-pillar alerts |
| `/status` | Health check — API response times, up/down per pillar, endpoint directory |
| `/pipeline` | Pipeline visualization — 7-stage content flow across all 4 live pillars |
| `/settings` | System info — pillar config, architecture diagram, ports, integration standard |

## API Routes (3)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/aggregate/stats` | Fetch stats from all pillar APIs, return combined object |
| GET | `/api/aggregate/alerts` | Merge alerts from all pillars, sorted by severity |
| GET | `/api/health` | Lightweight ping — up/down + response time per pillar |

## Architecture

- **No database** — reads from pillar APIs via `fetch('http://localhost:300X/api/...')`
- **Server-side aggregation** — no CORS, no exposed internal URLs
- **`Promise.allSettled()`** — if one pillar is down, others still display
- **2-second timeout** per pillar fetch
- **30-second SWR refresh** on all pages
- **6 pillar slots** — 4 live, 2 placeholders pre-wired via `pillar-config.ts`

## Useful Commands

```bash
# SSH into server
ssh root@5.78.183.112

# PM2
pm2 status
pm2 logs tsunami-master
pm2 restart tsunami-master

# All dashboards
pm2 restart all

# nginx
nginx -t && systemctl restart nginx
```

## Integration

- **Reads from**: All 4 live pillar `/api/dashboard/stats` and `/api/dashboard/alerts` endpoints
- **No writes** — purely read-only aggregation layer
- **Pillar 5/6 activation**: Set `enabled: true` in `lib/pillar-config.ts` when dashboards are built
