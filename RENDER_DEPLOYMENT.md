# Render Deployment Guide

## Quick Deploy with render.yaml (Infrastructure as Code)

The `render.yaml` file provides automatic deployment configuration including:
- Web service setup with health checks
- PostgreSQL database provisioning
- Automatic database initialization via `preDeployCommand`
- Environment variable configuration
- Auto-deploy on git push to main

### Steps to Deploy with render.yaml

1. **Ensure render.yaml is committed to main branch:**
   ```bash
   git add render.yaml scripts/post-deploy.sh
   git commit -m "feat: add render.yaml for IaC deployment"
   git push origin main
   ```

2. **Go to Render Dashboard:** https://dashboard.render.com

3. **Click "New" → "Blueprint"**

4. **Paste your repository URL:**
   ```
   https://github.com/sainathg1002/Identity-Reconciliation-
   ```

5. **Render will detect render.yaml automatically**

6. **Review the configuration:**
   - Service name: identify-service
   - Build command: npm install && npm run build
   - Start command: npm start
   - Database: PostgreSQL 15 (starter plan)
   - Pre-deploy: npm run db:init (runs before app starts)

7. **Click "Create Blueprint"**

Render will:
- ✅ Create the Web Service
- ✅ Provision PostgreSQL database
- ✅ Run `npm run db:init` automatically
- ✅ Start the application
- ✅ Enable auto-deploy on future commits to main

---

## Manual Deployment (Without render.yaml)

If you prefer the traditional dashboard approach:

### 1. Create Web Service
- Go to https://dashboard.render.com → "New" → "Web Service"
- Select GitHub repository: `sainathg1002/Identity-Reconciliation-`
- Name: `identify-service`
- Region: `oregon` (or closest to you)
- Branch: `main`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- Instance: `Starter` plan
- Click "Create Web Service"

### 2. Create PostgreSQL Database
- Go to https://dashboard.render.com → "New" → "PostgreSQL"
- Database name: `identify-db`
- Region: `oregon` (same as web service)
- PostgreSQL version: `15`
- Plan: `Starter`
- Click "Create Database"
- Wait for database to be ready (5-10 minutes)

### 3. Connect Web Service to Database
- Copy the `DATABASE_URL` from the PostgreSQL database page
- Go to Web Service → "Environment" tab
- Add environment variable:
  ```
  DATABASE_URL = postgresql://user:password@host:port/dbname
  ```
- Add other variables:
  ```
  NODE_ENV = production
  PORT = 3000
  LOG_LEVEL = info
  ```
- Save → Render will auto-deploy

### 4. Initialize Database
- Go to Web Service → "Shell" tab
- Run:
  ```bash
  npm run db:init
  ```
- Confirm output shows table created
- Close shell

### 5. Test Service
- Health: `curl https://identify-service.onrender.com/health`
- API test:
  ```bash
  curl -X POST https://identify-service.onrender.com/identify \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","phoneNumber":"1234567890"}'
  ```

---

## Configuration Details

### render.yaml Structure

```yaml
services:
  - type: web
    name: identify-service              # Service name
    runtime: node                       # Node.js runtime
    plan: starter                       # Starter/Standard/Pro
    buildCommand: npm install && npm run build
    startCommand: npm start
    preDeployCommand: npm run db:init   # Runs before app start
    healthCheckPath: /health            # Render monitors this endpoint
    autoDeploy: true                    # Auto-deploy on git push

databases:
  - name: identify-db
    plan: starter
    postgresMajorVersion: 15
```

### What preDeployCommand Does

The `preDeployCommand: npm run db:init` in render.yaml:
1. ✅ Runs after successful build
2. ✅ Before the app starts
3. ✅ Executes `npm run db:init` which:
   - Connects to PostgreSQL
   - Runs migration from `migrations/001_create_contacts_table.sql`
   - Creates `contacts` table
   - Verifies schema

If this fails, the deployment fails (safety check). If it succeeds, the app starts.

---

## Post-Deploy Hook Script

The `scripts/post-deploy.sh` provides additional safety:
- Waits for database to be ready (retry logic)
- Runs `npm run db:init` with timeout protection
- Logs progress and errors
- Exits cleanly on success or failure

### When to Use Post-Deploy Hook
- If you need more control over database startup
- If you have timing issues with preDeployCommand
- To add custom logic before/after migration

Enable it by adding to render.yaml:
```yaml
postDeployCommand: bash scripts/post-deploy.sh
```

---

## Environment Variables Reference

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production mode (disable debug logs) |
| `PORT` | `3000` | Service port (Render assigns this) |
| `LOG_LEVEL` | `info` | Logging verbosity (debug/info/warn/error) |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |

**DATABASE_URL Format:**
```
postgresql://username:password@hostname:5432/database_name
```

---

## Auto-Deploy Configuration

With `render.yaml`, auto-deploy is enabled by default:
- Push to `main` branch → Render automatically deploys
- Disable in dashboard if needed (Service → Settings → Auto-Deploy)

### Manual Trigger
- Service dashboard → "Trigger Deploy" button
- Or use Render CLI: `render deploy --service=identify-service`

---

## Monitoring & Logs

### View Application Logs
- Service dashboard → "Logs" tab
- Shows real-time app output and errors
- Filter by date/level

### View Database Logs
- Database dashboard → "Logs" tab
- Shows connection attempts and queries

### Health Checks
- Service automatically pings `/health` every 30 seconds
- If unhealthy, Render tries to restart
- Configure in render.yaml: `healthCheckInterval: 30`

---

## Troubleshooting

### Database Connection Failed
**Problem:** `Error: Failed to connect to database`

**Solution:**
1. Verify `DATABASE_URL` is set in Environment
2. Check PostgreSQL instance is running (dashboard → Database → Status)
3. Ensure web service region matches database region
4. Wait 2-3 minutes after database creation before deploying app

### preDeployCommand Failed
**Problem:** Deployment fails during `npm run db:init`

**Solution:**
1. Check logs for specific error
2. Run manually in Shell to debug: `npm run db:init`
3. Verify database is accessible: `psql $DATABASE_URL`
4. Check migrations folder exists and is readable

### Table Already Exists
**Problem:** `Error: relation "contacts" already exists`

**Solution:**
- Safe — can ignore. Means schema is already initialized.
- To reset: `psql $DATABASE_URL -c "DROP TABLE IF EXISTS contacts CASCADE"`

### Service Won't Start
**Problem:** Port 3000 error or service crashes immediately

**Solution:**
1. Check logs for error messages
2. Verify `npm run build` completes successfully
3. Test locally: `npm install && npm run build && npm start`
4. Check for missing environment variables

### Slow Cold Starts
**Problem:** First request after idle takes 30+ seconds

**Solution:**
- Normal on Starter plan (server hibernates)
- Upgrade to Standard plan for always-on
- Use monitoring/alerts to keep warm

---

## Cost & Scaling

### Current Configuration
- Web Service: Starter (Free or $7/month after free tier)
- Database: Starter ($15/month)
- **Total:** ~$15-22/month (or free with trial)

### Scale Up Later
- Upgrade Service to Standard ($12/month) for more resources
- Upgrade Database to Standard ($25/month+) for better performance
- Enable auto-scaling if needed

---

## Next Steps

1. **Commit render.yaml to main:**
   ```bash
   git add render.yaml scripts/post-deploy.sh
   git commit -m "docs: add render.yaml for IaC deployment"
   git push origin main
   ```

2. **Use Blueprint Deploy:**
   - Go to https://dashboard.render.com
   - Click "New" → "Blueprint"
   - Paste repo URL
   - Confirm configuration
   - Click "Create Blueprint"

3. **Verify Deployment:**
   - Wait for build to complete (3-5 minutes)
   - Check logs for `npm run db:init` output
   - Test `/health` and `/identify` endpoints

4. **Enable Auto-Deploy (optional):**
   - Service → Settings → Auto-Deploy: ON
   - Now every `git push` to main triggers a new deployment

---

## Support & Docs

- [Render Blueprint Reference](https://render.com/docs/blueprint-spec)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Node.js on Render](https://render.com/docs/deploy-node)

---

## Summary

✅ **render.yaml** = Infrastructure as Code for automatic deployment  
✅ **preDeployCommand** = Auto-runs `npm run db:init` before app starts  
✅ **post-deploy.sh** = Optional safety script for DB initialization  
✅ **Auto-deploy** = Every git push to main triggers new deployment  
✅ **Health checks** = Render monitors `/health` endpoint  
✅ **Zero downtime** = Blue-green deployments with database backups  

Your service is ready for production! 🚀
