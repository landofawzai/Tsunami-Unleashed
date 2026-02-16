# Distribution Dashboard API Documentation

> Webhook endpoints for Pabbly Connect integration

---

## Authentication

All webhook endpoints require API key authentication via the `x-api-key` header.

```http
x-api-key: your-secure-api-key
```

**Setup:** Set your API key in `.env`:
```env
API_KEY=your-secure-api-key-here
```

---

## Endpoints

### 1. Content Posted (Success)

**Endpoint:** `POST /api/webhooks/content-posted`

Called by Pabbly when content successfully posts to a platform.

#### Request Body

```json
{
  "contentId": "unique-content-identifier",
  "title": "Content Title",
  "contentType": "video|audio|article|image",
  "tier": 1|2|3,
  "platform": "YouTube",
  "platformsTargeted": 5,
  "platformPostId": "platform-native-id",
  "postUrl": "https://platform.com/post/123",
  "managementTool": "Followr|Pabbly|Robomotion|RSSground",
  "sourceUrl": "https://source.com/content",
  "metadata": {
    "key": "value"
  },
  "responseTimeMs": 250
}
```

#### Required Fields

- `contentId` (string) - Unique identifier that follows content across all tiers
- `title` (string) - Human-readable content title
- `contentType` (string) - Type of content (video, audio, article, image)
- `tier` (number) - Distribution tier (1, 2, or 3)
- `platform` (string) - Platform name (YouTube, Facebook, RSS-English, etc.)
- `managementTool` (string) - Tool that posted the content

#### Optional Fields

- `platformsTargeted` (number) - Total platforms planned for this content (default: 1)
- `platformPostId` (string) - Platform's native post/item ID
- `postUrl` (string) - Direct URL to the post
- `sourceUrl` (string) - Original content source URL
- `metadata` (object) - Additional custom data (stored as JSON)
- `responseTimeMs` (number) - API response time in milliseconds

#### Response (Success)

```json
{
  "success": true,
  "message": "Content posted successfully",
  "data": {
    "contentItemId": "cuid-abc123",
    "distributionLogId": "cuid-xyz789",
    "platformsCompleted": 3,
    "platformsTargeted": 5,
    "isCompleted": false
  }
}
```

#### Response (Error)

```json
{
  "error": "Missing required fields",
  "missingFields": ["platform", "managementTool"]
}
```

#### Example cURL

```bash
curl -X POST http://localhost:3002/api/webhooks/content-posted \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "contentId": "sermon-2024-02-15",
    "title": "The Power of Faith",
    "contentType": "video",
    "tier": 3,
    "platform": "YouTube",
    "platformsTargeted": 5,
    "platformPostId": "yt-abc123",
    "postUrl": "https://youtube.com/watch?v=abc123",
    "managementTool": "Followr"
  }'
```

---

### 2. Content Failed

**Endpoint:** `POST /api/webhooks/content-failed`

Called by Pabbly when content fails to post to a platform.

#### Request Body

```json
{
  "contentId": "unique-content-identifier",
  "title": "Content Title",
  "contentType": "video|audio|article|image",
  "tier": 1|2|3,
  "platform": "Facebook",
  "platformsTargeted": 5,
  "errorMessage": "API rate limit exceeded",
  "managementTool": "Followr|Pabbly|Robomotion|RSSground",
  "sourceUrl": "https://source.com/content",
  "metadata": {
    "key": "value"
  },
  "responseTimeMs": 5000
}
```

#### Required Fields

- `contentId` (string) - Unique identifier
- `title` (string) - Content title
- `contentType` (string) - Content type
- `tier` (number) - Distribution tier
- `platform` (string) - Platform name
- `managementTool` (string) - Tool that attempted to post
- `errorMessage` (string) - Error description

#### Response (Success)

```json
{
  "success": true,
  "message": "Failure logged successfully",
  "data": {
    "contentItemId": "cuid-abc123",
    "distributionLogId": "cuid-xyz789",
    "alertId": "cuid-alert123",
    "platformsCompleted": 2,
    "platformsTargeted": 5
  }
}
```

#### Example cURL

```bash
curl -X POST http://localhost:3002/api/webhooks/content-failed \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "contentId": "sermon-2024-02-15",
    "title": "The Power of Faith",
    "contentType": "video",
    "tier": 3,
    "platform": "Facebook",
    "platformsTargeted": 5,
    "errorMessage": "API authentication failed",
    "managementTool": "Followr"
  }'
```

---

## Automatic Behaviors

### 1. Auto-Completion

When `platformsCompleted >= platformsTargeted`, the ContentItem automatically transitions to `completed` status and sets `completedAt` timestamp.

### 2. Tier Capacity Tracking

- **Tier 1**: Increments `usedSlots`, decrements `availableSlots`
- **Tier 2/3**: Unlimited, doesn't affect capacity
- **Alert**: Generates warning when Tier 1 < 20 slots remaining

### 3. Platform Health Monitoring

- Updates `lastSuccessfulPost` or `lastFailedPost`
- Increments `failureCount24h` on failure
- Sets status: `healthy`, `degraded`, or `down`
- Generates alert if failures >= 5 in 24 hours

### 4. Pipeline Metrics

- Updates daily rollup for the current date
- Increments tier-specific counters (tier1Posts, tier2Posts, tier3Posts)
- Recalculates success rate percentage

### 5. Alert Generation

**Alerts are auto-created for:**
- Platform failures (5+ in 24h)
- Tier 1 capacity warnings (< 20 slots)
- Individual post failures (via content-failed endpoint)

---

## Integration with Pabbly Connect

### Workflow Setup

1. **Trigger:** Content published (from Pillar 1 or 2)
2. **Action:** Post to platform (via Followr, Robomotion, etc.)
3. **Router:**
   - **Success Path** → Webhook: `content-posted`
   - **Failure Path** → Webhook: `content-failed`

### Example Pabbly Workflow

```
Trigger: Google Drive File Added
  ↓
Action: Parse metadata (.meta.json sidecar)
  ↓
Router: Platform type
  ├─ YouTube → Followr API
  ├─ Rumble → Robomotion
  └─ RSS → RSSground
       ↓
Router: Success/Failure
  ├─ Success → Webhook: content-posted
  └─ Failure → Webhook: content-failed
```

### Webhook Headers in Pabbly

Set these headers in Pabbly's webhook action:

- **Content-Type:** `application/json`
- **x-api-key:** `your-secure-api-key` (use Pabbly's environment variables)

---

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | Success | Webhook processed successfully |
| 400 | Bad Request | Missing required fields - check request body |
| 401 | Unauthorized | Invalid or missing x-api-key header |
| 500 | Internal Server Error | Server-side error - check logs |

---

## Rate Limiting

Currently no rate limiting. Future implementations may add:
- 1000 requests/minute per API key
- Burst allowance of 100 requests/second

---

## Testing

Use the provided test script to verify webhooks:

```bash
# Unix/Mac/Linux
bash test-webhooks.sh

# Windows (Git Bash)
bash test-webhooks.sh

# Windows (PowerShell) - create PowerShell version
# See test-webhooks.ps1
```

Or use cURL directly:

```bash
curl -X POST http://localhost:3002/api/webhooks/content-posted \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secure-api-key-here-change-in-production" \
  -d @- <<EOF
{
  "contentId": "test-001",
  "title": "Test Content",
  "contentType": "video",
  "tier": 3,
  "platform": "YouTube",
  "platformsTargeted": 1,
  "managementTool": "Followr"
}
EOF
```

---

## Security Best Practices

1. **API Key Storage**
   - Never commit `.env` file to git
   - Use Pabbly's environment variables feature
   - Rotate keys quarterly

2. **HTTPS Only**
   - Production webhooks MUST use HTTPS
   - Use SSL/TLS certificates (Let's Encrypt)

3. **Request Validation**
   - All endpoints validate required fields
   - Type checking enforced via TypeScript

4. **Audit Trail**
   - All webhook calls logged in DistributionLog
   - Includes timestamp, platform, status, and metadata

---

## Support

For issues or questions:
1. Check logs: `npm run dev` output
2. View database: `npm run db:studio`
3. Review documentation: `README.md`
4. Check build instructions: `docs/Claude_Code_Build_Instructions_v3.md`

---

**🌊 Tsunami Unleashed Distribution Dashboard | Build Session 2 Complete**
