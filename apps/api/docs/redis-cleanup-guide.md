# Redis Queue Cleanup Guide

This guide explains how to configure and manage Redis memory usage for BullMQ queues in OsmoX.

## Problem

BullMQ queues store completed and failed jobs in Redis indefinitely by default. Over time, this can cause:
- High Redis memory usage
- Slower queue operations
- Potential Redis out-of-memory errors

## Solution

OsmoX now supports automatic cleanup of completed and failed jobs through configuration.

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Keep only the last 100 completed jobs per queue
REDIS_REMOVE_ON_COMPLETE=100

# Keep only the last 1000 failed jobs per queue
REDIS_REMOVE_ON_FAIL=1000

# Set to 0 to keep all jobs (not recommended for production)
# REDIS_REMOVE_ON_COMPLETE=0
# REDIS_REMOVE_ON_FAIL=1000
```

### How It Works

- **`REDIS_REMOVE_ON_COMPLETE`**: When a job completes successfully, BullMQ automatically removes older completed jobs, keeping only the last N jobs.
- **`REDIS_REMOVE_ON_FAIL`**: When a job fails, BullMQ automatically removes older failed jobs, keeping only the last N jobs.

**Important**: This cleanup happens automatically when new jobs complete/fail. It does NOT retroactively clean up existing jobs.

## Recommended Values

| Environment | `REDIS_REMOVE_ON_COMPLETE` | `REDIS_REMOVE_ON_FAIL` | Reasoning |
|-------------|---------------------------|------------------------|-----------|
| **Development** | 50-100 | 500-1000 | Keep enough for debugging |
| **Production** | 100-500 | 1000-5000 | Balance between debugging and memory |
| **High Volume** | 10-50 | 100-500 | Minimize memory with high throughput |

### Factors to Consider

1. **Debugging needs**: Keep more jobs if you need to debug issues
2. **Traffic volume**: Higher volume = more aggressive cleanup
3. **Available Redis memory**: Less memory = more aggressive cleanup
4. **Retention requirements**: Compliance or audit needs may require keeping jobs longer

## Manual Cleanup Script

For cleaning up existing jobs accumulated before this feature was enabled:

### Run the Cleanup Script

```bash
cd apps/api

# Make sure your .env file is configured with REDIS_HOST and REDIS_PORT
npx ts-node scripts/redis-cleanup.ts
```

### What the Script Does

1. Scans Redis for all BullMQ queues
2. Lists found queues
3. Asks for confirmation
4. Removes completed and failed jobs based on grace period
5. Shows cleanup summary

### Example Usage

```bash
$ npx ts-node scripts/redis-cleanup.ts

============================================================
Redis Queue Cleanup Script
============================================================

Using Redis connection: localhost:6379
(Configure via REDIS_HOST and REDIS_PORT environment variables)

Scanning for BullMQ queues...

Found 12 queue(s):
  1. SEND-SMTP-1
  2. SEND-MAILGUN-2
  3. WEBHOOK-SMTP-1
  ...

Enter grace period in milliseconds (jobs older than this will be removed, 0 for all): 0

This will clean up completed and failed jobs from 12 queue(s). Continue? (yes/no): yes

Starting cleanup...

Cleaning up queue: SEND-SMTP-1
  Removed 1543 completed jobs
  Removed 23 failed jobs

...

============================================================
Cleanup Summary
============================================================

Total completed jobs removed: 15432
Total failed jobs removed: 234
Total jobs removed: 15666
============================================================
```

## Monitoring Redis Memory

### Check Redis Memory Usage

```bash
redis-cli info memory
```

Key metrics to watch:
- `used_memory_human`: Total memory used by Redis
- `used_memory_peak_human`: Peak memory usage
- `maxmemory`: Maximum memory limit (if configured)

### Check Queue Job Counts

You can check job counts programmatically or via Redis CLI:

```bash
redis-cli

# List all queue keys
KEYS bull:*

# Count completed jobs for a specific queue
LLEN bull:SEND-SMTP-1:completed

# Count failed jobs
LLEN bull:SEND-SMTP-1:failed
```

## Best Practices

### 1. Start Conservative

Start with higher values (e.g., 500 completed, 2000 failed) and reduce based on:
- Available Redis memory
- Actual debugging needs
- Traffic patterns

### 2. Keep More Failed Jobs

Failed jobs are more important for debugging than completed ones. Keep a higher count of failed jobs.

### 3. Regular Monitoring

Set up monitoring for:
- Redis memory usage trends
- Queue job counts
- Application error rates

### 4. One-Time Cleanup After Migration

When first enabling this feature:

1. Run the manual cleanup script to remove existing jobs
2. Restart the API to apply new configuration
3. Monitor Redis memory to verify it's working

### 5. Consider Archiving Important Jobs

If you need to keep job history for compliance:
- Export job data to a database before cleanup
- Use the notification archival feature (already in OsmoX)
- Store job results in the notification record

## Troubleshooting

### Memory Still High After Configuration

**Problem**: Redis memory doesn't decrease after adding configuration.

**Solution**: The cleanup only applies to new jobs. Run the manual cleanup script:
```bash
npx ts-node scripts/redis-cleanup.ts
```

### Jobs Cleaned Up Too Aggressively

**Problem**: Need more job history for debugging.

**Solution**: Increase the retention counts:
```bash
REDIS_REMOVE_ON_COMPLETE=500
REDIS_REMOVE_ON_FAIL=5000
```

### Script Fails with Connection Error

**Problem**: Can't connect to Redis.

**Solution**:
1. Verify Redis is running: `redis-cli ping`
2. Check `.env` has correct `REDIS_HOST` and `REDIS_PORT`
3. Ensure no firewall blocking the connection

### Want to Disable Cleanup Temporarily

**Problem**: Need to keep all jobs temporarily.

**Solution**: Set both values to 0:
```bash
REDIS_REMOVE_ON_COMPLETE=0
REDIS_REMOVE_ON_FAIL=0
```
Then restart the API.

## Additional Resources

- [BullMQ Documentation - Job Lifecycle](https://docs.bullmq.io/guide/jobs/job-lifecycle)
- [Redis Memory Optimization](https://redis.io/docs/manual/optimization/memory-optimization/)
- [OsmoX Architecture Documentation](./block-diagram.md)
