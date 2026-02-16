#!/bin/bash
# Test Webhook Endpoints
# Run this script to test the webhook API endpoints

API_KEY="your-secure-api-key-here-change-in-production"
BASE_URL="http://localhost:3002"

echo "🌊 Testing Distribution Dashboard Webhooks"
echo "=========================================="
echo ""

# Test 1: Successful content post
echo "Test 1: POST /api/webhooks/content-posted (Success)"
echo "----------------------------------------------------"
curl -X POST "$BASE_URL/api/webhooks/content-posted" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "contentId": "test-content-001",
    "title": "Test Sermon: The Power of Faith",
    "contentType": "video",
    "tier": 3,
    "platform": "YouTube",
    "platformsTargeted": 5,
    "platformPostId": "yt-abc123",
    "postUrl": "https://youtube.com/watch?v=abc123",
    "managementTool": "Followr",
    "sourceUrl": "https://example.com/sermon.mp4",
    "metadata": {
      "duration": "45:30",
      "language": "en"
    },
    "responseTimeMs": 250
  }' | json_pp

echo -e "\n\n"

# Test 2: Another successful post (same content, different platform)
echo "Test 2: POST /api/webhooks/content-posted (Second Platform)"
echo "----------------------------------------------------"
curl -X POST "$BASE_URL/api/webhooks/content-posted" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "contentId": "test-content-001",
    "title": "Test Sermon: The Power of Faith",
    "contentType": "video",
    "tier": 3,
    "platform": "Facebook",
    "platformsTargeted": 5,
    "platformPostId": "fb-xyz789",
    "postUrl": "https://facebook.com/video/xyz789",
    "managementTool": "Followr",
    "responseTimeMs": 180
  }' | json_pp

echo -e "\n\n"

# Test 3: Failed content post
echo "Test 3: POST /api/webhooks/content-failed (Failure)"
echo "----------------------------------------------------"
curl -X POST "$BASE_URL/api/webhooks/content-failed" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "contentId": "test-content-002",
    "title": "Test Article: Walking in Faith",
    "contentType": "article",
    "tier": 2,
    "platform": "Ghost-Blog",
    "platformsTargeted": 1,
    "errorMessage": "API rate limit exceeded",
    "managementTool": "Ghost",
    "sourceUrl": "https://example.com/article.html",
    "metadata": {
      "wordCount": 1200
    },
    "responseTimeMs": 5000
  }' | json_pp

echo -e "\n\n"

# Test 4: Tier 1 RSS feed post
echo "Test 4: POST /api/webhooks/content-posted (Tier 1 RSS)"
echo "----------------------------------------------------"
curl -X POST "$BASE_URL/api/webhooks/content-posted" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "contentId": "test-content-003",
    "title": "Deep Dive: Romans 8",
    "contentType": "audio",
    "tier": 1,
    "platform": "RSS-English",
    "platformsTargeted": 1,
    "platformPostId": "rss-item-456",
    "postUrl": "https://rssground.com/tsunami-unleashed/items/456",
    "managementTool": "RSSground",
    "sourceUrl": "https://example.com/romans8.mp3",
    "metadata": {
      "duration": "62:15",
      "language": "en",
      "feedType": "depth-content"
    },
    "responseTimeMs": 120
  }' | json_pp

echo -e "\n\n"

# Test 5: Unauthorized request (no API key)
echo "Test 5: Unauthorized Request (No API Key)"
echo "----------------------------------------------------"
curl -X POST "$BASE_URL/api/webhooks/content-posted" \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "test-content-004",
    "title": "Should Fail",
    "contentType": "video",
    "tier": 3,
    "platform": "YouTube",
    "platformsTargeted": 1,
    "managementTool": "Followr"
  }' | json_pp

echo -e "\n\n"
echo "=========================================="
echo "✅ Webhook tests complete!"
echo ""
echo "Check the dashboard at: $BASE_URL"
echo ""
