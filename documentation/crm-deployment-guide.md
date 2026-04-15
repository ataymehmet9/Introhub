# CRM Integration - Production Deployment Guide

## Overview

This guide covers the production deployment of the HubSpot CRM integration feature. Follow these steps carefully to ensure a smooth rollout.

## Pre-Deployment Requirements

### 1. HubSpot App Configuration

#### Create Production App

1. Go to [HubSpot Developer Portal](https://developers.hubspot.com/)
2. Create a new app for production
3. Configure OAuth settings:
   ```
   App Name: IntroHub (Production)
   Redirect URL: https://yourdomain.com/api/crm/hubspot/callback
   Scopes:
   - crm.objects.contacts.read
   - crm.objects.contacts.write
   ```
4. Save Client ID and Client Secret

#### Verify App Settings

- [ ] Redirect URI matches production domain
- [ ] Required scopes are enabled
- [ ] App is published (not in draft mode)
- [ ] Webhook endpoints configured (if applicable)

### 2. Infrastructure Setup

#### Redis Instance

Production-grade Redis is required for BullMQ job queue.

**Recommended Providers:**

- **AWS ElastiCache**: Managed Redis with automatic failover
- **Redis Cloud**: Fully managed with global replication
- **DigitalOcean Managed Redis**: Simple setup with backups

**Minimum Requirements:**

- Redis 6.0+
- 2GB RAM minimum
- Persistence enabled (AOF or RDB)
- TLS encryption enabled

**Configuration:**

```bash
# .env.production
REDIS_URL=rediss://username:password@your-redis-host:6379
REDIS_TLS=true
```

#### Database

Ensure PostgreSQL is ready:

- [ ] Version 14+ recommended
- [ ] Connection pooling configured
- [ ] Backup strategy in place
- [ ] Indexes created (handled by migration)

### 3. Environment Variables

Create `.env.production` with:

```bash
# HubSpot OAuth
HUBSPOT_CLIENT_ID=your_production_client_id
HUBSPOT_CLIENT_SECRET=your_production_client_secret
HUBSPOT_REDIRECT_URI=https://yourdomain.com/api/crm/hubspot/callback

# Token Encryption
# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your_secure_32_byte_key_here

# Redis
REDIS_URL=rediss://username:password@your-redis-host:6379
REDIS_TLS=true

# Email (for sync failure notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM=noreply@yourdomain.com

# Application
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/introhub
```

**Security Checklist:**

- [ ] All secrets stored in secure vault (AWS Secrets Manager, etc.)
- [ ] Encryption key is 32 bytes and randomly generated
- [ ] Redis uses TLS encryption
- [ ] Database uses SSL connection
- [ ] Environment variables not committed to git

## Deployment Steps

### Step 1: Database Migration

Run migrations in production:

```bash
# Backup database first
pg_dump -h your-db-host -U user introhub > backup_$(date +%Y%m%d).sql

# Apply migrations
pnpm db:push

# Verify tables created
psql -h your-db-host -U user introhub -c "\dt crm_*"
```

**Expected Output:**

```
              List of relations
 Schema |        Name        | Type  | Owner
--------+--------------------+-------+-------
 public | crm_integrations   | table | user
 public | sync_logs          | table | user
```

### Step 2: Deploy Application Code

#### Option A: Docker Deployment

```bash
# Build image
docker build -t introhub:latest .

# Run with environment variables
docker run -d \
  --name introhub \
  --env-file .env.production \
  -p 3000:3000 \
  introhub:latest

# Verify health
curl http://localhost:3000/api/health
```

#### Option B: Node.js Deployment

```bash
# Install dependencies
pnpm install --prod

# Build application
pnpm build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

**PM2 Configuration** (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [
    {
      name: 'introhub',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
```

### Step 3: Verify Services

#### Check Redis Connection

```bash
# Test Redis connectivity
redis-cli -u $REDIS_URL ping
# Expected: PONG
```

#### Check BullMQ Queue

```bash
# Install BullMQ CLI
npm install -g bull-board

# View queue dashboard
bull-board --redis $REDIS_URL
# Access at http://localhost:3000/admin/queues
```

#### Test OAuth Flow

1. Navigate to `/crm-integrations`
2. Click "Connect" on HubSpot card
3. Complete OAuth authorization
4. Verify redirect back to application
5. Check database for new integration record

### Step 4: Monitor Initial Syncs

#### Enable Debug Logging

```bash
# Temporarily enable debug logs
DEBUG=crm:* pm2 restart introhub
```

#### Watch Sync Logs

```bash
# Monitor sync activity
psql -h your-db-host -U user introhub -c "
  SELECT id, provider, status, success_count, error_count, started_at
  FROM sync_logs
  ORDER BY started_at DESC
  LIMIT 10;
"
```

#### Check Email Notifications

- Verify SMTP configuration
- Test failure notification email
- Check spam folder if not received

## Post-Deployment Verification

### Functional Tests

#### 1. OAuth Connection

- [ ] User can connect HubSpot account
- [ ] Tokens are stored encrypted
- [ ] Integration appears in CRM list

#### 2. Manual Sync

- [ ] "Sync Now" button triggers sync
- [ ] Real-time progress updates via SSE
- [ ] Contacts appear in contacts table
- [ ] Sync log created with correct counts

#### 3. Automatic Sync

- [ ] Background job runs at scheduled time
- [ ] Sync completes successfully
- [ ] `next_sync_at` updated correctly

#### 4. Analytics

- [ ] Dashboard card shows correct metrics
- [ ] Success rate calculated properly
- [ ] Last sync status displays correctly

#### 5. Error Handling

- [ ] Invalid token triggers error status
- [ ] Email notification sent on failure
- [ ] Error details logged in sync_logs

### Performance Tests

#### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run scripts/load-test-crm.js
```

**Expected Performance:**

- OAuth callback: < 500ms
- Manual sync trigger: < 200ms
- SSE connection: < 100ms
- Analytics query: < 300ms

#### Database Queries

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%crm_%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Monitoring & Alerting

### Key Metrics to Monitor

#### Application Metrics

- CRM sync success rate (target: >95%)
- Average sync duration (target: <5 minutes)
- OAuth connection success rate (target: >98%)
- SSE connection stability (target: >99%)

#### Infrastructure Metrics

- Redis memory usage (alert: >80%)
- Redis connection count (alert: >1000)
- Database connection pool (alert: >80%)
- BullMQ queue length (alert: >100 jobs)

### Recommended Alerts

#### Critical Alerts

```yaml
- name: CRM Sync Failure Rate High
  condition: sync_failure_rate > 10%
  window: 1 hour
  action: Page on-call engineer

- name: Redis Connection Failed
  condition: redis_connection_errors > 0
  window: 5 minutes
  action: Page on-call engineer

- name: OAuth Callback Errors
  condition: oauth_errors > 5
  window: 15 minutes
  action: Notify team channel
```

#### Warning Alerts

```yaml
- name: Sync Duration Increasing
  condition: avg_sync_duration > 10 minutes
  window: 1 hour
  action: Notify team channel

- name: BullMQ Queue Backing Up
  condition: queue_length > 50
  window: 30 minutes
  action: Notify team channel
```

### Logging Strategy

#### Structured Logging

```typescript
// Example log format
{
  timestamp: "2024-01-14T12:00:00Z",
  level: "info",
  service: "crm-sync",
  userId: "user_123",
  integrationId: 456,
  provider: "hubspot",
  action: "sync_completed",
  duration: 120000,
  contactsProcessed: 500,
  errors: 0
}
```

#### Log Aggregation

- Use CloudWatch, Datadog, or similar
- Set up log-based alerts
- Create dashboards for key metrics

## Rollback Procedure

### If Critical Issues Occur

#### 1. Immediate Actions

```bash
# Stop accepting new connections
# Update feature flag or environment variable
ENABLE_CRM_INTEGRATIONS=false

# Restart application
pm2 restart introhub

# Pause BullMQ queue
redis-cli LPUSH bull:crm-sync:paused 1
```

#### 2. Database Rollback (if needed)

```bash
# Restore from backup
psql -h your-db-host -U user introhub < backup_20240114.sql

# Or drop new tables
psql -h your-db-host -U user introhub -c "
  DROP TABLE IF EXISTS sync_logs CASCADE;
  DROP TABLE IF EXISTS crm_integrations CASCADE;
"
```

#### 3. Code Rollback

```bash
# Revert to previous version
git revert <commit-hash>
pnpm build
pm2 restart introhub
```

#### 4. Communication

- Notify affected users via email
- Update status page
- Post in team channels
- Document incident for post-mortem

## Gradual Rollout Strategy

### Phase 1: Internal Testing (Week 1)

- Enable for internal team only
- Monitor closely for issues
- Gather feedback
- Fix any bugs

### Phase 2: Beta Users (Week 2-3)

- Enable for 10% of users
- Monitor metrics daily
- Collect user feedback
- Optimize performance

### Phase 3: General Availability (Week 4+)

- Enable for all users
- Continue monitoring
- Iterate based on feedback
- Plan next features

### Feature Flag Configuration

```typescript
// src/config/features.ts
export const FEATURE_FLAGS = {
  CRM_INTEGRATIONS: {
    enabled: process.env.ENABLE_CRM_INTEGRATIONS === 'true',
    rolloutPercentage: parseInt(process.env.CRM_ROLLOUT_PERCENTAGE || '100'),
    allowedUserIds: process.env.CRM_ALLOWED_USERS?.split(',') || [],
  },
}
```

## Maintenance

### Regular Tasks

#### Daily

- [ ] Check sync success rate
- [ ] Review error logs
- [ ] Monitor queue length
- [ ] Verify email notifications

#### Weekly

- [ ] Review performance metrics
- [ ] Check Redis memory usage
- [ ] Analyze slow queries
- [ ] Update documentation

#### Monthly

- [ ] Review and archive old sync logs
- [ ] Update HubSpot API version if needed
- [ ] Security audit of OAuth flow
- [ ] Performance optimization review

### Database Maintenance

#### Archive Old Sync Logs

```sql
-- Archive logs older than 90 days
INSERT INTO sync_logs_archive
SELECT * FROM sync_logs
WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM sync_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

#### Vacuum and Analyze

```sql
-- Run weekly
VACUUM ANALYZE crm_integrations;
VACUUM ANALYZE sync_logs;
```

## Security Considerations

### Token Security

- [ ] Tokens encrypted at rest using AES-256
- [ ] Encryption key rotated quarterly
- [ ] Token refresh handled automatically
- [ ] Expired tokens cleaned up

### API Security

- [ ] Rate limiting on OAuth endpoints
- [ ] CSRF protection enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)

### Compliance

- [ ] GDPR: User can delete all CRM data
- [ ] CCPA: User can export CRM data
- [ ] SOC 2: Audit logs maintained
- [ ] HIPAA: PHI not stored in metadata

## Support & Troubleshooting

### Common Production Issues

#### Issue: High Sync Failure Rate

**Diagnosis:**

```sql
SELECT last_sync_error, COUNT(*)
FROM crm_integrations
WHERE status = 'error'
GROUP BY last_sync_error;
```

**Solutions:**

- Check HubSpot API status
- Verify token refresh logic
- Review rate limiting
- Check network connectivity

#### Issue: Slow Sync Performance

**Diagnosis:**

```sql
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration,
  MAX(EXTRACT(EPOCH FROM (completed_at - started_at))) as max_duration
FROM sync_logs
WHERE status = 'completed'
  AND started_at > NOW() - INTERVAL '24 hours';
```

**Solutions:**

- Increase BullMQ concurrency
- Optimize field mapping logic
- Add database indexes
- Use batch inserts

### Emergency Contacts

- **On-Call Engineer**: [Pager number]
- **Team Lead**: [Contact info]
- **DevOps**: [Contact info]
- **HubSpot Support**: support@hubspot.com

## Success Criteria

### Launch Metrics (First 30 Days)

- [ ] > 90% sync success rate
- [ ] <5 minute average sync time
- [ ] <1% OAuth connection failures
- [ ] Zero security incidents
- [ ] > 80% user satisfaction (survey)

### Business Metrics

- [ ] X% of users connect CRM
- [ ] Y% increase in contact imports
- [ ] Z% reduction in manual data entry
- [ ] Positive user feedback

---

**Document Version**: 1.0.0  
**Last Updated**: 2024-01-14  
**Next Review**: 2024-02-14  
**Owner**: Engineering Team
