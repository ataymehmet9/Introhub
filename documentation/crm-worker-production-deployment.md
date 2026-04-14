# CRM Worker Production Deployment Guide

## Overview

The CRM sync worker runs as a **separate process** from your main web application. This guide covers deploying and managing the worker in production.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Web Server    │         │  Worker Process │
│   (Port 3000)   │         │  (Background)   │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │    Redis    │
              │  (Queue)    │
              └─────────────┘
```

## Deployment Options

### Option 1: Process Manager (PM2) - Recommended

PM2 manages both your web server and worker as separate processes.

#### Installation

```bash
npm install -g pm2
```

#### Configuration

Create `ecosystem.config.js` in your project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'introhub-web',
      script: 'pnpm',
      args: 'start:prod',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'introhub-worker',
      script: 'pnpm',
      args: 'start:worker',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1, // Start with 1, scale as needed
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
}
```

#### Deployment Commands

```bash
# Build the application
pnpm build

# Start both web and worker
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# View logs
pm2 logs introhub-worker
pm2 logs introhub-web

# Restart worker
pm2 restart introhub-worker

# Stop worker
pm2 stop introhub-worker

# Delete processes
pm2 delete all
```

#### Auto-start on System Boot

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

### Option 2: Docker Compose

Run web server and worker as separate containers.

#### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - HUBSPOT_CLIENT_ID=${HUBSPOT_CLIENT_ID}
      - HUBSPOT_CLIENT_SECRET=${HUBSPOT_CLIENT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - redis
      - postgres
    command: pnpm start:prod

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - HUBSPOT_CLIENT_ID=${HUBSPOT_CLIENT_ID}
      - HUBSPOT_CLIENT_SECRET=${HUBSPOT_CLIENT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - redis
      - postgres
    command: pnpm start:worker
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=introhub
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  redis_data:
  postgres_data:
```

#### Dockerfile

```dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

RUN npm install -g pnpm

WORKDIR /app

# Copy built files
COPY --from=base /app/.output ./.output
COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Expose port
EXPOSE 3000

# Default command (can be overridden)
CMD ["pnpm", "start:prod"]
```

#### Deployment Commands

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f worker
docker-compose logs -f web

# Restart worker
docker-compose restart worker

# Scale workers (run 3 instances)
docker-compose up -d --scale worker=3

# Stop all services
docker-compose down
```

### Option 3: Kubernetes

For large-scale deployments.

#### web-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: introhub-web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: introhub-web
  template:
    metadata:
      labels:
        app: introhub-web
    spec:
      containers:
        - name: web
          image: your-registry/introhub:latest
          command: ['pnpm', 'start:prod']
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: 'production'
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: introhub-secrets
                  key: database-url
            - name: REDIS_URL
              value: 'redis://redis-service:6379'
          resources:
            requests:
              memory: '512Mi'
              cpu: '500m'
            limits:
              memory: '1Gi'
              cpu: '1000m'
```

#### worker-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: introhub-worker
spec:
  replicas: 2
  selector:
    matchLabels:
      app: introhub-worker
  template:
    metadata:
      labels:
        app: introhub-worker
    spec:
      containers:
        - name: worker
          image: your-registry/introhub:latest
          command: ['pnpm', 'start:worker']
          env:
            - name: NODE_ENV
              value: 'production'
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: introhub-secrets
                  key: database-url
            - name: REDIS_URL
              value: 'redis://redis-service:6379'
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
```

### Option 4: Serverless (Not Recommended)

⚠️ **Note**: BullMQ workers require long-running processes. Serverless functions (AWS Lambda, Vercel Functions) are **not suitable** for the worker.

**Alternative**: Use a managed service like:

- **Railway**: Supports long-running workers
- **Render**: Background workers supported
- **Fly.io**: Multiple processes supported
- **DigitalOcean App Platform**: Worker processes supported

## Environment Variables

Ensure these are set in production:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/introhub

# Redis (required for worker)
REDIS_URL=redis://host:6379

# HubSpot OAuth
HUBSPOT_CLIENT_ID=your-client-id
HUBSPOT_CLIENT_SECRET=your-client-secret
HUBSPOT_REDIRECT_URI=https://yourdomain.com/api/crm/hubspot/callback

# Encryption
ENCRYPTION_KEY=your-64-character-encryption-key

# Auth
BETTER_AUTH_SECRET=your-auth-secret
BETTER_AUTH_URL=https://yourdomain.com
```

## Monitoring

### Health Checks

Add health check endpoint for the worker:

```typescript
// src/workers/health-check.ts
import { createServer } from 'http'
import { getQueueMetrics } from '../services/sync-queue.service'

const server = createServer(async (req, res) => {
  if (req.url === '/health') {
    try {
      const metrics = await getQueueMetrics()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'healthy', metrics }))
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'unhealthy', error: error.message }))
    }
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(3001, () => {
  console.log('Health check server running on port 3001')
})
```

### Logging

Use structured logging:

```typescript
// In sync-worker.ts
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
})

hubspotSyncWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed')
})

hubspotSyncWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, 'Job failed')
})
```

### Metrics

Track worker metrics:

```typescript
// Prometheus metrics example
import { register, Counter, Gauge } from 'prom-client'

const jobsCompleted = new Counter({
  name: 'worker_jobs_completed_total',
  help: 'Total number of completed jobs',
})

const jobsFailed = new Counter({
  name: 'worker_jobs_failed_total',
  help: 'Total number of failed jobs',
})

const activeJobs = new Gauge({
  name: 'worker_active_jobs',
  help: 'Number of currently active jobs',
})
```

## Scaling

### Horizontal Scaling

Run multiple worker instances:

```bash
# PM2
pm2 scale introhub-worker 3

# Docker Compose
docker-compose up -d --scale worker=3

# Kubernetes
kubectl scale deployment introhub-worker --replicas=3
```

### Vertical Scaling

Increase worker concurrency:

```typescript
// In sync-queue.service.ts
export const hubspotSyncWorker = new Worker(
  'hubspot-contact-sync',
  processJob,
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
  },
)
```

## Troubleshooting

### Worker Not Starting

1. Check Redis connection:

```bash
redis-cli -h your-redis-host ping
```

2. Check environment variables:

```bash
echo $REDIS_URL
echo $DATABASE_URL
```

3. Check logs:

```bash
pm2 logs introhub-worker --lines 100
```

### High Memory Usage

1. Reduce batch size in sync options
2. Reduce worker concurrency
3. Add more worker instances
4. Increase memory limits

### Jobs Not Processing

1. Verify worker is running:

```bash
pm2 status
```

2. Check queue metrics:

```typescript
const metrics = await getQueueMetrics()
console.log(metrics)
```

3. Manually retry failed jobs:

```bash
# Via Redis CLI
redis-cli
> LRANGE bull:hubspot-contact-sync:failed 0 -1
```

## Best Practices

1. **Always run worker separately** from web server
2. **Monitor queue metrics** regularly
3. **Set up alerts** for failed jobs
4. **Use process manager** (PM2) in production
5. **Scale horizontally** for high load
6. **Keep Redis persistent** (use AOF or RDB)
7. **Implement health checks**
8. **Log all errors** with context
9. **Test failover** scenarios
10. **Document deployment** process

## Quick Start Commands

```bash
# Development
pnpm worker:dev

# Production Build
pnpm build

# Production Start (with PM2)
pm2 start ecosystem.config.js

# Production Start (standalone)
pnpm start:worker

# Monitor
pm2 monit

# Logs
pm2 logs introhub-worker
```

## Next Steps

1. Set up monitoring and alerting
2. Configure log aggregation
3. Implement metrics dashboard
4. Set up automated deployments
5. Test disaster recovery procedures
