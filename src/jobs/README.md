# Background Jobs

This directory contains background jobs for the IntroHub application.

## Monthly Reset Job

The `monthly-reset.ts` job resets monthly request counters for free tier users based on their anniversary date.

### How It Works

- Runs daily to check all free tier users
- For each user, calculates their next reset date based on their `freeTierStartDate`
- If the current date is past the reset date, resets `requestsUsedThisCycle` to 0
- Updates `currentCycleStartDate` to the current date

### Running Manually

```bash
# Using tsx (recommended for development)
npx tsx src/jobs/monthly-reset.ts

# Or compile and run
npm run build
node dist/jobs/monthly-reset.js
```

### Setting Up Cron

#### Option 1: System Cron (Linux/macOS)

Add to your crontab (`crontab -e`):

```cron
# Run daily at 2 AM
0 2 * * * cd /path/to/introhub && npx tsx src/jobs/monthly-reset.ts >> /var/log/introhub-monthly-reset.log 2>&1
```

#### Option 2: Node Cron (In-App Scheduler)

If you prefer to run the job within your application, you can use `node-cron`:

```typescript
// In your server startup file
import cron from 'node-cron'
import { runMonthlyReset } from './jobs/monthly-reset'

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running monthly reset job...')
  try {
    await runMonthlyReset()
  } catch (error) {
    console.error('Monthly reset job failed:', error)
  }
})
```

#### Option 3: Cloud Scheduler (Production)

For production deployments, use your cloud provider's scheduler:

- **Vercel**: Use Vercel Cron Jobs
- **AWS**: Use EventBridge Scheduler
- **GCP**: Use Cloud Scheduler
- **Azure**: Use Azure Functions Timer Trigger

Example Vercel configuration in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/monthly-reset",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Then create an API route at `src/routes/api/cron/monthly-reset.ts`:

```typescript
import { runMonthlyReset } from '@/jobs/monthly-reset'

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const result = await runMonthlyReset()
    return Response.json(result)
  } catch (error) {
    console.error('Monthly reset failed:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
```

### Monitoring

The job logs detailed information about its execution:

- Total users processed
- Number of resets performed
- Any errors encountered
- Execution duration

Monitor these logs to ensure the job runs successfully.

### Testing

Before deploying to production:

1. Test with a small set of users in staging
2. Verify the reset logic works correctly
3. Check that users' request counters are properly reset
4. Ensure no data loss or corruption

### Troubleshooting

**Job not running:**

- Check cron configuration
- Verify file permissions
- Check application logs

**Users not being reset:**

- Verify `freeTierStartDate` is set for all free tier users
- Check the `calculateNextResetDate` logic
- Ensure database connection is working

**Performance issues:**

- Consider batching updates if you have many users
- Add database indexes on `planType` and `freeTierStartDate`
- Monitor job execution time
