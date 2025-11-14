# Deployment Guide

## Prerequisites

- Node.js v16+ installed
- PostgreSQL 12+ database
- npm or yarn package manager
- Git for version control

## Environment Setup

### 1. Production Environment Variables

Create a `.env` file with production values:

```env
# Database
DATABASE_URL=postgresql://prod_user:strong_password@prod-db-host:5432/identify_prod

# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
```

**Security Best Practices:**
- Use strong, randomly generated passwords
- Store `.env` in a secure location (not in git)
- Use environment-specific database users with limited privileges
- Rotate credentials regularly

### 2. Database Setup

```bash
# Connect to your PostgreSQL server
psql -h db-host -U postgres

# Create database
CREATE DATABASE identify_prod;

# Create application user
CREATE USER identify_user WITH PASSWORD 'strong_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE identify_prod TO identify_user;
ALTER DATABASE identify_prod OWNER TO identify_user;

# Exit and connect as new user
\q
```

Initialize the schema:
```bash
npm run db:init
```

## Deployment Methods

### Option 1: Traditional Server Deployment

#### Using systemd (Linux)

Create `/etc/systemd/system/identify-service.service`:
```ini
[Unit]
Description=Identify Service - Contact Consolidation API
After=network.target postgresql.service
StartLimitIntervalSec=0

[Service]
Type=simple
User=app_user
WorkingDirectory=/opt/identify-service
EnvironmentFile=/opt/identify-service/.env
ExecStart=/usr/bin/node /opt/identify-service/dist/index.js
Restart=always
RestartSec=10
SyslogIdentifier=identify-service
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Deploy:
```bash
# Clone repository
cd /opt
git clone https://github.com/sainathg1002/Identity-Reconciliation-.git identify-service
cd identify-service

# Install dependencies
npm ci --only=production

# Build TypeScript
npm run build

# Create .env file with production variables
nano .env

# Initialize database
npm run db:init

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable identify-service
sudo systemctl start identify-service

# Check status
sudo systemctl status identify-service
```

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY migrations ./migrations
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Create `docker-compose.yml`:
```yaml
version: "3.8"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: identify_prod
      POSTGRES_USER: identify_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U identify_user -d identify_prod"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://identify_user:${DB_PASSWORD}@db:5432/identify_prod
      PORT: 3000
      NODE_ENV: production
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
```

Deploy with Docker:
```bash
docker-compose up -d
```

### Option 3: Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create Heroku app
heroku create identify-service-prod

# Set environment variables
heroku config:set NODE_ENV=production -a identify-service-prod
heroku config:set DATABASE_URL=postgresql://... -a identify-service-prod

# Add PostgreSQL addon (optional)
heroku addons:create heroku-postgresql:standard-0 -a identify-service-prod

# Deploy from Git
git push heroku main

# Initialize database
heroku run npm run db:init -a identify-service-prod

# View logs
heroku logs --tail -a identify-service-prod
```

### Option 4: AWS Deployment

#### Using EC2 + RDS

1. **Create RDS PostgreSQL Instance:**
   - Engine: PostgreSQL 15
   - Instance class: db.t3.micro (or larger)
   - Multi-AZ: Yes (for production)
   - Backup: 30 days

2. **Create EC2 Instance:**
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.micro (or larger)
   - VPC: Same as RDS
   - Security group: Allow port 3000, 443, 22

3. **Deploy Application:**
   ```bash
   # SSH into EC2
   ssh -i key.pem ubuntu@ec2-instance

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Clone repository
   git clone https://github.com/sainathg1002/Identity-Reconciliation-.git
   cd Identity-Reconciliation-

   # Install dependencies
   npm ci --only=production
   npm run build

   # Create .env with RDS connection
   echo "DATABASE_URL=postgresql://..." > .env

   # Initialize database
   npm run db:init

   # Install PM2 for process management
   sudo npm install -g pm2
   pm2 start dist/index.js --name "identify-service"
   pm2 startup
   pm2 save
   ```

## Post-Deployment Checklist

- [ ] Health endpoint returns `200 OK`
- [ ] Database connection successful
- [ ] Sample request returns correct response
- [ ] Error handling working (test with invalid input)
- [ ] Logs configured and accessible
- [ ] Backup strategy in place
- [ ] Monitoring/alerting configured
- [ ] SSL/TLS certificate installed
- [ ] Rate limiting configured (if needed)
- [ ] CORS configured appropriately

## Monitoring

### Health Checks

```bash
# Basic health check
curl http://localhost:3000/health

# Monitor with interval
watch -n 5 curl -s http://localhost:3000/health | jq
```

### Logging

View application logs:
```bash
# systemd
sudo journalctl -u identify-service -f

# Docker
docker-compose logs -f app

# Heroku
heroku logs --tail

# AWS CloudWatch
aws logs tail /aws/ec2/identify-service --follow
```

### Database Monitoring

```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# View slow queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC;

# Check disk usage
SELECT pg_size_pretty(pg_database_size('identify_prod'));
```

## Scaling

### Horizontal Scaling (Multiple Instances)

1. Use load balancer (AWS ALB, Nginx, HAProxy)
2. Deploy app to multiple servers
3. Share PostgreSQL database across instances
4. Use connection pooling

### Vertical Scaling (Larger Instance)

Increase server resources:
- CPU cores
- RAM
- Network bandwidth
- Disk I/O

### Database Optimization

```sql
-- Create indexes for frequent queries
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone_number);
CREATE INDEX idx_contacts_linked_id ON contacts(linked_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM contacts WHERE email = 'test@example.com';
```

## Backup & Recovery

### PostgreSQL Backup

```bash
# Full database backup
pg_dump -h db-host -U identify_user identify_prod > backup.sql

# Compressed backup
pg_dump -h db-host -U identify_user identify_prod | gzip > backup.sql.gz

# Restore from backup
psql -h db-host -U identify_user identify_prod < backup.sql
```

### Automated Backups

Configure daily backups:
```bash
# Add to crontab
0 2 * * * pg_dump -h db-host -U identify_user identify_prod | gzip > /backups/identify_$(date +\%Y\%m\%d).sql.gz
```

## Updating Deployment

```bash
# Pull latest code
git pull origin main

# Install any new dependencies
npm ci

# Build TypeScript
npm run build

# Run migrations (if any)
npm run db:init

# Restart service
sudo systemctl restart identify-service
# OR
docker-compose restart app
```

## Troubleshooting

**Application won't start:**
```bash
# Check Node version
node --version

# Check dependencies
npm ls

# Run in foreground to see errors
node dist/index.js
```

**Database connection fails:**
```bash
# Test connection
psql -h db-host -U identify_user -d identify_prod -c "SELECT 1"

# Check connection string
echo $DATABASE_URL
```

**Memory leaks:**
```bash
# Monitor memory usage
pm2 monit

# Get heapdump
node --max-old-space-size=4096 dist/index.js
```

**High latency:**
```bash
# Check database query performance
EXPLAIN ANALYZE SELECT * FROM contacts ...;

# Check application metrics
pm2 show identify-service
```

## Security Hardening

1. **HTTPS/TLS:**
   ```bash
   # Use nginx reverse proxy with SSL
   # Or cloudflare for SSL termination
   ```

2. **Authentication/Authorization:**
   - Add API key validation if needed
   - Implement rate limiting
   - Use CORS appropriately

3. **Database Security:**
   - Use strong passwords
   - Create minimal privilege user
   - Enable SSL for database connections
   - Encrypt sensitive data at rest

4. **Application Security:**
   - Keep dependencies updated: `npm audit fix`
   - Use security headers
   - Validate all inputs
   - Use parameterized queries (already implemented)

5. **Infrastructure Security:**
   - Use VPC for network isolation
   - Configure firewalls
   - Enable logging and monitoring
   - Regular security audits

## Support & Maintenance

For issues or questions:
- Check [API Documentation](./API.md)
- Review [Development Guide](./DEVELOPMENT.md)
- Open GitHub issues
- Check logs and error messages

## Additional Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL High Availability](https://www.postgresql.org/docs/current/warm-standby.html)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
