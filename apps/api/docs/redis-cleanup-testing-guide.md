# Redis Queue Cleanup - Testing Guide

This guide provides step-by-step instructions for testing the Redis queue cleanup functionality in your development environment.

## Prerequisites

- Development environment set up and running
- Redis server accessible
- Admin user credentials for API testing
- API server running on default port (typically 3000)

## Environment Configuration

1. **Update your `.env` file** with cleanup settings:

```env
# Redis Cleanup Configuration
REDIS_REMOVE_ON_COMPLETE=100  # Keep last 100 completed jobs
REDIS_REMOVE_ON_FAIL=1000     # Keep last 1000 failed jobs
```

2. **Restart the API server** to apply the new configuration:

```bash
npm run start:dev
```

## Test 1: Automatic Cleanup on Job Completion

### Objective
Verify that completed jobs are automatically cleaned up after the configured threshold.

### Steps

1. **Send multiple notification requests** to create jobs:

```bash
# Example: Send 150 email notifications (more than REDIS_REMOVE_ON_COMPLETE=100)
for i in {1..150}; do
  curl -X POST http://localhost:3000/notifications \
    -H "Content-Type: application/json" \
    -H "x-api-key: YOUR-X-API-KEY" \
    -d "{
    \"providerId\": 1,
    \"data\": {
        \"from\": \"sender@example.com\",
        \"to\": \"receiver@example.com\",
        \"subject\": \"Test subject $i\",
        \"text\": \"This is a test notification $i\",
        \"html\": \"<b>This is a test notification $i</b>\"
      }
  }"
  sleep 0.5
done
```

2. **Wait for jobs to complete** (typically 1-2 minutes depending on your providers)

3. **Check Redis** to verify only ~100 completed jobs are retained:

```bash
# Using redis-cli
redis-cli

# Count completed jobs for a specific queue. Example: KEYS bull:email:*:completed
# Use osmo-x queue structure: `${action}-${providerType}-${providerId}`
KEYS *
KEYS bull:send*
KEYS bull:delivery-status*
KEYS bull:webhook*

# Should show approximately 100 keys, not 150
```

### Expected Result
Only the last 100 completed jobs should remain in Redis. Older completed jobs should be automatically removed.

---

## Test 2: Manual Cleanup via CLI Script

### Objective
Test the interactive CLI script for manual cleanup.

### Steps

1. **Run the cleanup script**:

```bash
cd apps/api
npm run cleanup:redis
# or
npx ts-node scripts/redis-cleanup.ts
```

2. **Follow the interactive prompts**:
   - Select queues to clean (or choose "All queues")
   - Set grace period (e.g., `3600000` for 1 hour)
   - Confirm the operation

3. **Review the output** showing:
   - Number of completed jobs cleaned per queue
   - Number of failed jobs cleaned per queue
   - Total jobs cleaned

### Expected Result
Script should display cleanup statistics and successfully remove jobs older than the grace period.

---

## Test 3: Manual Cleanup via API Endpoint

### Objective
Test the REST API endpoint for triggering cleanup.

### Steps

1. **Get an admin access token**:

```bash
# Login as admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin_password"
  }'
# Copy the access token from response
```

2. **Trigger cleanup without grace period**:

```bash
curl -X POST http://localhost:3000/notifications/redis/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

3. **Trigger cleanup with 1-hour grace period**:

```bash
curl -X POST "http://localhost:3000/notifications/redis/cleanup?gracePeriod=3600000" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Expected Response

```json
{
  "status": "success",
  "data": {
    "totalCompleted": 45,
    "totalFailed": 12,
    "queues": [
      {
        "name": "email",
        "completed": 30,
        "failed": 8
      },
      {
        "name": "sms",
        "completed": 15,
        "failed": 4
      }
    ],
    "message": "Successfully cleaned up 57 jobs from Redis"
  }
}
```

---

## Test 4: Authentication & Authorization

### Objective
Verify that the cleanup endpoint is properly protected.

### Steps

1. **Test without authentication**:

```bash
curl -X POST http://localhost:3000/notifications/redis/cleanup
```

**Expected**: `401 Unauthorized` error

2. **Test with non-admin user**:

```bash
# Login as regular user
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "user_password"
  }'

# Try to cleanup with regular user token
curl -X POST http://localhost:3000/notifications/redis/cleanup \
  -H "Authorization: Bearer REGULAR_USER_TOKEN"
```

**Expected**: `403 Forbidden` error

3. **Test with admin user**:

```bash
curl -X POST http://localhost:3000/notifications/redis/cleanup \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected**: `200 OK` with cleanup results

---

## Test 5: Invalid Parameters

### Objective
Verify proper error handling for invalid input.

### Steps

1. **Test with invalid grace period (negative)**:

```bash
curl -X POST "http://localhost:3000/notifications/redis/cleanup?gracePeriod=-1000" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected**: `400 Bad Request` with error message

2. **Test with invalid grace period (non-numeric)**:

```bash
curl -X POST "http://localhost:3000/notifications/redis/cleanup?gracePeriod=invalid" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected**: `400 Bad Request` with error message

---

## Test 6: Memory Impact Verification

### Objective
Verify that cleanup reduces Redis memory usage.

### Steps

1. **Check initial Redis memory usage**:

```bash
redis-cli INFO memory | grep used_memory_human
```

2. **Create many jobs** (e.g., 1000+ notifications)

3. **Wait for jobs to complete**

4. **Check Redis memory again**:

```bash
redis-cli INFO memory | grep used_memory_human
```

5. **Trigger manual cleanup**:

```bash
curl -X POST http://localhost:3000/notifications/redis/cleanup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

6. **Check memory usage after cleanup**:

```bash
redis-cli INFO memory | grep used_memory_human
```

### Expected Result
Memory usage should decrease after cleanup, especially if you had many completed/failed jobs accumulated.

---

## Monitoring During Testing

### Check Queue Status

```bash
# Connect to Redis
redis-cli

# List all Bull queues
KEYS bull:*

# Count jobs in a specific queue
ZCARD bull:email:completed
ZCARD bull:email:failed
ZCARD bull:sms:completed
ZCARD bull:sms:failed
```

### Check Application Logs

Monitor the API server logs for cleanup operations:

```bash
# If running with npm run start:dev
# Watch the console output for messages like:
# "Cleaned up X completed and Y failed jobs from Redis"
```

---

## Common Issues & Troubleshooting

### Issue: Cleanup not working
**Solution**:
- Verify environment variables are set correctly
- Restart the API server after changing `.env`
- Check that jobs are actually completing (check provider configurations)

### Issue: 403 Forbidden on cleanup endpoint
**Solution**:
- Ensure you're using an admin user token
- Verify user has `UserRoles.ADMIN` role in database

### Issue: No jobs being cleaned
**Solution**:
- Check if grace period is too long
- Verify jobs are actually in "completed" or "failed" state
- Use `redis-cli` to manually inspect job data

### Issue: Memory not decreasing
**Solution**:
- Redis memory might be fragmented - try `redis-cli MEMORY PURGE`
- Verify jobs are actually being removed: `KEYS bull:*:completed | wc -l`
- Check if other Redis data (non-queue) is consuming memory

---

## Success Criteria

✅ Automatic cleanup keeps only configured number of jobs
✅ Manual cleanup via CLI removes old jobs and reports statistics
✅ API endpoint successfully cleans up jobs when called by admin
✅ Non-admin users cannot access cleanup endpoint
✅ Invalid parameters return proper error responses
✅ Redis memory usage decreases after cleanup
✅ Application logs show cleanup operations
✅ No errors in application logs during cleanup

---

## Cleanup Test Environment

After testing, you may want to clean up:

```bash
# Flush all Redis data (CAUTION: This removes ALL data)
redis-cli FLUSHALL

# Or remove only Bull queue data
redis-cli --scan --pattern "bull:*" | xargs redis-cli DEL
```

---

## Next Steps

After successful testing:
1. Document any issues found in the PR
2. Verify cleanup works in staging environment
3. Monitor Redis memory usage in production after deployment
4. Set up alerts for Redis memory thresholds
5. Schedule periodic manual cleanups if needed (via cron job calling API endpoint)
