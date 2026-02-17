# Content Creation Dashboard — Deployment Status

## Deployment Details

| Property | Value |
|----------|-------|
| **Dashboard** | Content Creation (Pillar 1) |
| **Server** | Hetzner VPS 5.78.183.112 |
| **App Port** | 3003 |
| **nginx Port** | 3082 |
| **PM2 Name** | tsunami-creation |
| **URL** | http://5.78.183.112:3082 |
| **API Key** | cc624c181641b37824976c47716800752fe84dae8f02f5a6ad2c7248e6ab6b8b |
| **Database** | SQLite (prisma/prod.db) |
| **Deployed** | 2026-02-17 |

## All Dashboards on Hetzner

| Pillar | Dashboard | App Port | nginx Port | PM2 Name | URL |
|--------|-----------|----------|------------|----------|-----|
| 1 | Content Creation | 3003 | 3082 | tsunami-creation | http://5.78.183.112:3082 |
| 2 | Repurposing | 3002 | 3080 | tsunami-repurposing | http://5.78.183.112:3080 |
| 3 | Distribution | 3000 | 80 | tsunami-dashboard | http://5.78.183.112 |
| 4 | Communication | 3001 | 3081 | tsunami-communication | http://5.78.183.112:3081 |

## Pages (11)

| Route | Purpose |
|-------|---------|
| `/` | Home dashboard — stats, pipeline, recent content, deadlines |
| `/content` | Content list — search, filter, create |
| `/content/[id]` | Content detail — edit, brief, files, tasks, reviews |
| `/calendar` | Production calendar — month navigation, deadlines |
| `/series` | Series list — progress bars, status filters |
| `/series/[id]` | Series detail — edit, content items |
| `/reviews` | Review queue — approve/revise/reject actions |
| `/library` | Content library — archive, downstream status |
| `/metrics` | Analytics — velocity chart, breakdowns |
| `/alerts` | Alert management — severity, read/resolve |
| `/settings` | Configuration — API keys, tags, events, system info |

## API Routes (26)

### Webhooks (x-api-key required)
- `POST /api/webhooks/content-from-drive`
- `POST /api/webhooks/repurposing-status`

### Content
- `GET/POST /api/content`
- `GET/PATCH /api/content/[id]`
- `POST /api/content/[id]/send-to-repurposing`
- `POST /api/content/[id]/submit-for-review`

### Series
- `GET/POST /api/series`
- `GET/PATCH /api/series/[id]`

### Reviews
- `GET/POST /api/reviews`
- `GET /api/reviews/[id]`

### Briefs
- `GET/POST /api/briefs`

### Files
- `GET/POST /api/files`
- `DELETE /api/files/[id]`

### Tasks
- `GET/POST /api/tasks`
- `PATCH/DELETE /api/tasks/[id]`

### Calendar
- `GET/POST /api/calendar`

### Tags
- `GET/POST /api/tags`

### System
- `GET /api/dashboard/stats`
- `GET /api/dashboard/alerts`
- `GET /api/metrics`
- `GET/PATCH /api/alerts/[id]`
- `GET/PATCH /api/settings`
- `GET /api/pabbly-events`

## Useful Commands

```bash
# SSH into server
ssh root@5.78.183.112

# PM2
pm2 status
pm2 logs tsunami-creation
pm2 restart tsunami-creation

# All dashboards
pm2 restart all

# nginx
nginx -t && systemctl restart nginx
```

## Content Lifecycle

```
planning → drafting → recording → editing → review → approved → finalized → sent_to_repurposing → archived
```

## Integration

- **Outbound**: Content Creation → Pabbly webhook → Repurposing Dashboard
- **Inbound**: Google Drive file notification → Content Creation webhook
- **Inbound**: Repurposing status update → Content Creation webhook
- **Auth**: All webhook endpoints require `x-api-key` header
