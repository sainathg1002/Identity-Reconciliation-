# Render Deployment - No Shell Access Alternative

If Render Shell requires subscription, use one of these methods:

## Method 1: Auto-Deploy (Recommended)
**How it works:** The `postDeployCommand` in `render.yaml` automatically runs after each deploy.

**Steps:**
1. Push code to GitHub main branch (already done ✅)
2. Trigger manual deploy in Render dashboard:
   - Service → "Trigger Deploy" button
3. Wait for build → logs show database initialization
4. Service auto-initializes database schema
5. Test `/identify` endpoint ✅

**File:** `scripts/render-post-deploy.sh` (bash script that runs automatically)

---

## Method 2: Render CLI (Free - No Subscription)
**Prerequisites:** Install Render CLI
```bash
npm install -g render-cli
# or
brew install render-cli
```

**Initialize via CLI:**
```bash
# Login
render login

# Get your service ID from dashboard URL
# https://dashboard.render.com/services/srv-xxxxx

# Run initialization command
render exec <service-id> bash scripts/render-post-deploy.sh
```

**Get Service ID:**
- Go to https://dashboard.render.com
- Click identify-service
- Copy ID from URL or settings

---

## Method 3: Manual SQL via Render PostgreSQL Interface (No Extra Cost)
**Prerequisites:** psql client installed locally
```bash
# Windows
choco install postgresql  # or download from postgresql.org

# macOS
brew install postgresql

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql-client
```

**Steps:**
1. Get PostgreSQL connection string:
   - Render dashboard → identify-db → Connection string
   - Copy the full `postgresql://user:pass@host:port/dbname`

2. Run initialization SQL:
   ```bash
   psql "YOUR_DATABASE_URL" -f scripts/manual-render-init.sql
   ```

3. Verify:
   ```bash
   psql "YOUR_DATABASE_URL" -c "SELECT * FROM contacts LIMIT 1;"
   ```

---

## Method 4: Programmatic Deploy (Node.js)
Create a simple Node script to initialize when service starts:

```bash
# Edit src/index.ts to auto-initialize on startup
npm run dev
# Service will create table if it doesn't exist
```

The migration runs in `scripts/init-db.js` which is idempotent (safe to run multiple times).

---

## Method 5: Use GitHub Actions (Advanced)
Create `.github/workflows/render-deploy.yml`:

```yaml
name: Deploy to Render
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Render
        run: |
          curl -X POST https://api.render.com/deploy/srv-${{ secrets.RENDER_SERVICE_ID }} \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"
```

---

## Currently Recommended Approach

**Use Method 1 (Auto-Deploy via postDeployCommand):**

1. **Files already in repo:**
   - ✅ `render.yaml` - defines postDeployCommand
   - ✅ `scripts/render-post-deploy.sh` - bash initialization script
   - ✅ `migrations/001_create_contacts_table.sql` - SQL schema

2. **Trigger deploy:**
   - Render dashboard → identify-service → "Trigger Deploy"
   - OR push new commit to main branch
   - Script runs automatically after build
   - Database initializes without Shell access

3. **Verify:**
   ```powershell
   curl https://identity-reconciliation-ixvq.onrender.com/health
   curl -X POST https://identity-reconciliation-ixvq.onrender.com/identify `
     -H "Content-Type: application/json" `
     -d '{"email":"test@example.com"}'
   ```

---

## Troubleshooting

**If postDeployCommand fails:**
1. Check logs: Render dashboard → Service → Logs
2. Error will show why bash script failed
3. Common issues:
   - Database not ready yet (retry logic handles this)
   - PostgreSQL client not available (unlikely on Render)
   - Migration file missing (should not happen)

**If you see "relation contacts already exists":**
- This is safe! Means table already created
- Schema is ready for API requests

**To manually reset database:**
```bash
psql "YOUR_DATABASE_URL" -c "DROP TABLE IF EXISTS contacts CASCADE;"
# Then re-run deploy
```

---

## Cost Impact
✅ **Zero additional cost** - All methods above use Render's free tier features

| Method | Cost | Speed | Reliability |
|--------|------|-------|-------------|
| Auto-Deploy (postDeployCommand) | Free | 2-3 min | ⭐⭐⭐⭐⭐ |
| Render CLI | Free | 1-2 min | ⭐⭐⭐⭐ |
| Manual psql | Free | Instant | ⭐⭐⭐⭐ |
| GitHub Actions | Free | 5-10 min | ⭐⭐⭐⭐ |
| Shell | **Paid** | Instant | ⭐⭐⭐⭐⭐ |

---

## Next Steps

**Option A (Easiest - No Install Required):**
1. Go to Render dashboard → identify-service
2. Click "Trigger Deploy"
3. Wait 3 minutes
4. Test `/identify` endpoint
5. Done! ✅

**Option B (CLI - ~2 minutes):**
1. Install Render CLI: `render-cli`
2. Run: `render exec <service-id> bash scripts/render-post-deploy.sh`
3. Done! ✅

**I recommend Option A** - Just trigger a deploy, the script runs automatically.
