# Vercel Deployment Guide

## Prerequisites

- GitHub account (you already have this)
- Vercel account (free tier is fine)
- Latest code pushed to GitHub (already done ✅)

---

## Step-by-Step Deployment

### Step 1: Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

---

### Step 2: Import Your Project

1. Once logged in, click **"Add New..."** → **"Project"**
2. You'll see a list of your GitHub repositories
3. Find **"Tsunami-Unleashed"** and click **"Import"**

---

### Step 3: Configure Project Settings

On the import screen, configure these settings:

#### Project Settings:
- **Framework Preset**: Next.js (should auto-detect)
- **Root Directory**: `distribution-dashboard` ⚠️ **IMPORTANT**
- **Build Command**: `npm run build` (default is fine)
- **Output Directory**: `.next` (default is fine)
- **Install Command**: `npm install` (default is fine)

#### Environment Variables:

Click **"Environment Variables"** and add these:

**Required:**
```
DATABASE_URL=file:./prod.db
API_KEY=<generate-a-secure-random-string>
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```

**To generate a secure API key**, use one of these:
```bash
# Option 1: OpenSSL
openssl rand -hex 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Online
# Visit: https://www.random.org/strings/ (32 chars, alphanumeric)
```

⚠️ **Note**: You'll need to update `NEXT_PUBLIC_BASE_URL` after deployment with your actual Vercel URL.

---

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for the build to complete (takes 2-3 minutes)
3. You'll see a success screen with your deployment URL

Your dashboard will be live at:
```
https://your-project-name.vercel.app
```

---

### Step 5: Update Environment Variable

After first deployment:

1. Go to your project in Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Find `NEXT_PUBLIC_BASE_URL`
4. Update it with your actual Vercel URL (e.g., `https://tsunami-unleashed.vercel.app`)
5. Click **"Save"**
6. Go to **"Deployments"** tab
7. Click the **"..."** menu on the latest deployment
8. Click **"Redeploy"** (this applies the updated environment variable)

---

### Step 6: Initialize Database

After deployment, you need to initialize the database:

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Functions"**
3. Note: Vercel Functions have limitations with SQLite

⚠️ **Important SQLite Limitation on Vercel:**

Vercel's serverless functions have **ephemeral storage**, meaning:
- Database writes are lost between requests
- SQLite works for **read-only** after initial seed
- Not suitable for production with write operations

**For production with database writes, you have 2 options:**

#### Option A: Use PostgreSQL (Recommended)

Vercel offers free PostgreSQL via Vercel Postgres:

1. In Vercel dashboard, go to **"Storage"** → **"Create Database"**
2. Choose **"Postgres"**
3. Follow setup wizard
4. Update `DATABASE_URL` in environment variables
5. Update Prisma schema to use PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

6. Run migrations: `npx prisma migrate deploy`

#### Option B: Deploy to VPS Instead

If you want to keep SQLite, deploy to a VPS:
- DigitalOcean ($6/month)
- Linode ($5/month)
- AWS EC2 (free tier for 1 year)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for VPS deployment instructions.

---

## Vercel Deployment Verification

After deployment, test these URLs:

### Pages
- `https://your-project.vercel.app/` - Dashboard home
- `https://your-project.vercel.app/content` - Content list
- `https://your-project.vercel.app/platforms` - Platform health
- `https://your-project.vercel.app/feeds` - RSS feeds
- `https://your-project.vercel.app/metrics` - Metrics
- `https://your-project.vercel.app/alerts` - Alerts
- `https://your-project.vercel.app/settings` - Settings

### API Endpoints
Test with curl or Postman:

```bash
# Test stats endpoint
curl https://your-project.vercel.app/api/dashboard/stats

# Test capacity endpoint
curl https://your-project.vercel.app/api/dashboard/capacity

# Test webhook (replace YOUR_API_KEY)
curl -X POST https://your-project.vercel.app/api/webhooks/content-posted \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "contentId": "test-001",
    "title": "Test Content",
    "contentType": "video",
    "tier": 3,
    "platform": "YouTube",
    "platformsTargeted": 1,
    "managementTool": "Followr"
  }'
```

---

## Continuous Deployment

Vercel automatically redeploys when you push to GitHub:

1. Make changes locally
2. Commit: `git add . && git commit -m "your message"`
3. Push: `git push origin master`
4. Vercel automatically deploys within 2-3 minutes

---

## Custom Domain (Optional)

To use your own domain:

1. In Vercel dashboard, go to **"Settings"** → **"Domains"**
2. Click **"Add"**
3. Enter your domain (e.g., `dashboard.tsunamiunleashed.org`)
4. Follow DNS configuration instructions
5. Vercel automatically provisions SSL certificate

---

## Monitoring & Logs

### View Logs
1. Go to your project in Vercel
2. Click **"Deployments"**
3. Click on a deployment
4. View **"Build Logs"** and **"Function Logs"**

### Analytics
1. Go to **"Analytics"** tab
2. View page views, unique visitors, top pages
3. Monitor performance metrics

---

## Environment-Specific Variables

You can set different variables for Production vs Preview:

1. Go to **"Settings"** → **"Environment Variables"**
2. When adding a variable, choose:
   - **Production**: Live site
   - **Preview**: Pull request deployments
   - **Development**: Local development

---

## Troubleshooting

### Build Fails

**Error: "Cannot find module './682.js'"**
- Solution: Clear cache and redeploy
- In Vercel: Deployments → ... → "Redeploy" (check "Clear cache")

**Error: "Module not found: Can't resolve 'X'"**
- Solution: Ensure all dependencies in `package.json`
- Check import paths use `@/` for absolute imports

### Database Issues

**Error: "Unable to open database file"**
- This is expected with SQLite on Vercel serverless
- Switch to PostgreSQL (see Option A above)

### API Returns 401

**Error: "Unauthorized: Invalid or missing API key"**
- Check `API_KEY` environment variable is set
- Verify `x-api-key` header in webhook requests
- Ensure API key matches between Vercel and Pabbly

---

## Cost

Vercel **Free Tier** includes:
- Unlimited deployments
- 100GB bandwidth/month
- Automatic HTTPS
- Unlimited team members
- Preview deployments for PRs

**Pro Tier** ($20/month):
- 1TB bandwidth
- Advanced analytics
- Password protection
- More function execution time

For Tsunami Unleashed's expected traffic, **Free Tier should be sufficient** initially.

---

## Next Steps After Deployment

1. ✅ **Verify all pages load** without errors
2. ✅ **Test API endpoints** with curl
3. ✅ **Configure Pabbly webhooks** with production URLs
4. ✅ **Set up monitoring** (check daily)
5. ✅ **Test with real content** (start small)

---

## Support

For Vercel-specific issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

For dashboard issues:
- Check [USER_GUIDE.md](./USER_GUIDE.md)
- Review [DEPLOYMENT.md](./DEPLOYMENT.md)
- Check logs in Vercel dashboard

---

**🌊 Tsunami Unleashed | Distribution Dashboard | Deployed with Vercel**
