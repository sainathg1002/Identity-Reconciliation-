# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Issue: npm install fails

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Install with legacy peer deps
npm install --legacy-peer-deps

# Or use npm ci for cleaner install
npm ci
```

#### Issue: Node version incompatibility

**Symptoms:**
```
The engine "node" is incompatible with this package
```

**Solutions:**
```bash
# Check required version
cat package.json | grep '"engines"'

# Check installed version
node --version

# Use nvm to switch versions
nvm install 18
nvm use 18

# Or install from nodejs.org
```

---

### Development Server Issues

#### Issue: Port 3000 already in use

**Symptoms:**
```
Error: listen EADDRINUSE :::3000
```

**Windows Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**Linux/Mac Solution:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

#### Issue: TypeScript compilation errors

**Symptoms:**
```
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Solutions:**
```bash
# Check TypeScript version
npx tsc --version

# Run type checking
npx tsc --noEmit

# Fix in IDE: use strict null checks
# Update code with proper null checks

# Or update tsconfig.json if needed
```

#### Issue: Hot reload not working

**Symptoms:**
- Changes to code don't reflect in running server

**Solutions:**
```bash
# Restart dev server
npm run dev

# Check ts-node-dev installation
npm list ts-node-dev

# Verify tsconfig.json exists and is valid
cat tsconfig.json

# Try rebuilding
npm run build
```

---

### Database Connection Issues

#### Issue: Cannot connect to database

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
```bash
# Check if PostgreSQL is running
# Windows: Check Services or use
pg_isready

# Linux/Mac: Use
brew services list
sudo systemctl status postgresql

# Verify connection string
echo $DATABASE_URL

# Test connection manually
psql "postgresql://identify_user:password@localhost:5432/identify_db"
```

#### Issue: Authentication failed

**Symptoms:**
```
error: password authentication failed for user "identify_user"
```

**Solutions:**
```bash
# Verify credentials in .env file
cat .env

# Reset user password in PostgreSQL
psql -U postgres
ALTER USER identify_user WITH PASSWORD 'newpassword';

# Update .env with new password
```

#### Issue: Database doesn't exist

**Symptoms:**
```
FATAL: database "identify_db" does not exist
```

**Solutions:**
```bash
# Create database
createdb -U identify_user identify_db

# Or via psql
psql -U postgres
CREATE DATABASE identify_db OWNER identify_user;

# Initialize schema
npm run db:init
```

#### Issue: Schema initialization fails

**Symptoms:**
```
Error: relation "contacts" already exists
```

**Solutions:**
```bash
# Check existing tables
psql -c "SELECT table_name FROM information_schema.tables"

# Drop old table if needed
psql -c "DROP TABLE IF EXISTS contacts CASCADE"

# Run initialization
npm run db:init

# Or manually run migration
psql "postgresql://identify_user:password@localhost:5432/identify_db" \
  -f migrations/001_create_contacts_table.sql
```

---

### API Request Issues

#### Issue: 400 Bad Request - Missing required fields

**Symptoms:**
```json
{
  "error": "At least one of email or phoneNumber must be provided"
}
```

**Solutions:**
```bash
# Ensure request includes email or phoneNumber
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'  # ✓ Valid

# Check request format
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{}'  # ✗ Invalid - missing both fields
```

#### Issue: 400 Bad Request - Invalid email format

**Symptoms:**
```json
{
  "error": "Invalid email format"
}
```

**Solutions:**
```bash
# Ensure email is properly formatted
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"valid@example.com"}'  # ✓ Valid

# Invalid formats
# "notanemail" ✗
# "@example.com" ✗
# "user@" ✗
# "user example@com" ✗
```

#### Issue: 500 Internal Server Error

**Symptoms:**
```json
{
  "error": "Internal server error"
}
```

**Solutions:**
```bash
# Check application logs
# For dev server: check terminal output

# Check database connectivity
npm run db:init

# Verify .env configuration
cat .env

# Check for TypeScript compilation errors
npm run build

# Restart service
npm run dev
```

#### Issue: 404 Not Found

**Symptoms:**
```json
{
  "error": "Endpoint not found"
}
```

**Solutions:**
```bash
# Verify correct endpoint
# Correct: http://localhost:3000/identify
# Wrong: http://localhost:3000/identify/user

# Check available endpoints
curl http://localhost:3000/health  # Should work

# List all routes in src/index.ts
```

---

### Data Issues

#### Issue: Contacts not being created

**Symptoms:**
- Request returns success but no data appears in database

**Solutions:**
```bash
# Check if contacts table exists
psql -c "SELECT * FROM contacts"

# If table doesn't exist
npm run db:init

# Verify application is writing to database
# Check database logs for errors
```

#### Issue: Consolidation not working correctly

**Symptoms:**
- Multiple primaries created instead of consolidation
- Wrong primary contact selected

**Solutions:**
```bash
# Check contact creation times
psql -c "SELECT id, email, link_precedence, created_at FROM contacts ORDER BY created_at"

# Verify linked_id is set correctly
psql -c "SELECT id, email, linked_id, link_precedence FROM contacts"

# Check consolidation logic output
# Add console.log statements in identifyController.ts
```

#### Issue: Duplicate emails/phones in response

**Symptoms:**
```json
{
  "emails": ["test@example.com", "test@example.com"],
  "phoneNumbers": ["1234567890", "1234567890"]
}
```

**Solutions:**
```bash
# Check for duplicate records in database
psql -c "SELECT email, COUNT(*) FROM contacts GROUP BY email HAVING COUNT(*) > 1"

# Verify buildResponse function removes duplicates
# The function should use Set to deduplicate

# Check if linked contacts have same info
psql -c "SELECT * FROM contacts WHERE linked_id IS NOT NULL"
```

---

### Performance Issues

#### Issue: Slow API responses

**Symptoms:**
- /identify endpoint takes >1 second to respond

**Solutions:**
```bash
# Check database indexes
psql -c "SELECT * FROM pg_stat_user_indexes"

# Create missing indexes
psql -c "CREATE INDEX idx_contacts_email ON contacts(email)"
psql -c "CREATE INDEX idx_contacts_phone ON contacts(phone_number)"

# Check for slow queries
psql -c "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC"

# Monitor active connections
psql -c "SELECT count(*) FROM pg_stat_activity"
```

#### Issue: Memory usage increasing

**Symptoms:**
- Application memory grows over time
- Eventually crashes with out of memory error

**Solutions:**
```bash
# Check for connection leaks
# Verify pool.end() is called properly

# Monitor process memory
node --inspect dist/index.js
# Then use Chrome DevTools

# Check for event listener leaks
# Search for .on() without .off() in code
```

#### Issue: Database connection pool exhausted

**Symptoms:**
```
Error: Pool is exhausted
```

**Solutions:**
```bash
# Increase pool size in src/db.ts
const pool = new Pool({
  max: 20,  // Increase from default
  connectionString: process.env.DATABASE_URL
});

# Check for unclosed connections
psql -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state"

# Restart application to reset pool
```

---

### Deployment Issues

#### Issue: Service won't start on production server

**Symptoms:**
```
Error: Cannot find module 'src/index.ts'
```

**Solutions:**
```bash
# Ensure TypeScript is compiled
npm run build

# Check dist/ directory exists
ls -la dist/

# Start compiled version
node dist/index.js

# Or use production script
npm start
```

#### Issue: Docker build fails

**Symptoms:**
```
ERROR: failed to build Docker image
```

**Solutions:**
```bash
# Check Dockerfile syntax
docker build --no-cache .

# Check base image availability
docker pull node:18-alpine

# Check for missing files
# Verify migrations/ directory exists

# View full build output
docker build --progress=plain .
```

#### Issue: Environment variables not loaded

**Symptoms:**
```
Error: DATABASE_URL is not defined
```

**Solutions:**
```bash
# For systemd
# Verify EnvironmentFile in service file

# For Docker
# Check docker-compose.yml environment section

# For Heroku
heroku config -a app-name

# Manually set if needed
export DATABASE_URL=postgresql://...
node dist/index.js
```

---

### Testing Issues

#### Issue: Test script fails on Windows

**Symptoms:**
```
powershell : File cannot be loaded because running scripts is disabled
```

**Solutions:**
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run specific script
powershell -ExecutionPolicy Bypass -File test-identify.ps1
```

#### Issue: Tests hanging

**Symptoms:**
- Test script doesn't complete
- No output after starting

**Solutions:**
```bash
# Check if server is running
curl http://localhost:3000/health

# Kill any stuck processes
ps aux | grep node
kill -9 <PID>

# Run tests with timeout
timeout 60 .\test-identify.ps1
```

#### Issue: Database not clean between tests

**Symptoms:**
- Tests pass individually but fail when run together
- Data from previous tests affecting new tests

**Solutions:**
```bash
# Clear database between test runs
psql -c "TRUNCATE TABLE contacts RESTART IDENTITY CASCADE"

# Or reset in test script before starting
npm run db:init
```

---

### Logging and Debugging

#### Enable Debug Logging

```typescript
import { debuglog } from "util";
const debug = debuglog("identify");

debug("Processing request:", req.body);
```

Run with debugging:
```bash
NODE_DEBUG=identify npm run dev
```

#### Check Logs

```bash
# Application logs (dev)
# Check terminal output

# systemd logs
sudo journalctl -u identify-service -f

# Docker logs
docker-compose logs -f app

# File logs (if configured)
tail -f logs/app.log
```

#### Database Query Debugging

```typescript
// Log queries before executing
console.log("Query:", query);
console.log("Params:", params);
const result = await pool.query(query, params);
console.log("Result:", result.rows);
```

---

### Getting Help

If you can't find a solution:

1. **Check existing documentation:**
   - [API Documentation](./API.md)
   - [Development Guide](./DEVELOPMENT.md)
   - [Deployment Guide](./DEPLOYMENT.md)

2. **Search GitHub Issues:**
   - Similar issues might be already solved

3. **Create a GitHub Issue:**
   - Include error message
   - Include steps to reproduce
   - Include environment details (Node version, OS, PostgreSQL version)
   - Include relevant logs

4. **Check logs:**
   - Application logs
   - Database logs
   - Browser console (for fetch errors)

5. **Verify basics:**
   - Node.js is running
   - PostgreSQL is running
   - .env is configured
   - Database is initialized

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start with hot reload
npm run build           # Compile TypeScript
npm start               # Start from compiled JS

# Database
npm run db:init         # Initialize schema

# Testing
.\test-identify.ps1     # Run test suite

# Git
git status              # Check changes
git add .               # Stage all changes
git commit -m "msg"     # Commit changes
git push                # Push to GitHub
```

### Useful Utilities

```bash
# Check service health
curl http://localhost:3000/health

# Make API request
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Connect to database
psql "postgresql://identify_user:password@localhost:5432/identify_db"

# View logs
tail -f logs/app.log
```

---

For more help, check the [Contributing Guidelines](./CONTRIBUTING.md) or open a GitHub issue.
