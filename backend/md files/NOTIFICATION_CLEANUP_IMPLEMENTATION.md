# Notification Cleanup Implementation

## Overview

This document describes the implementation of automatic notification cleanup functionality that permanently deletes notifications older than 3 days, regardless of their read status.

## Key Changes

### 1. Modified Cleanup Logic

**File**: `backend/src/modules/notifications/notifications.service.ts`

- **Changed default cleanup period** from 30 days to 3 days
- **Removed archived-only restriction** - now deletes ALL notifications older than the specified period
- **Added automatic cleanup method** for scheduled tasks

```typescript
// Before: Only deleted archived notifications older than 30 days
.andWhere('isArchived = :archived', { archived: true })

// After: Deletes ALL notifications older than 3 days
// No additional conditions - deletes regardless of read/archived status
```

### 2. Scheduled Cleanup Service

**File**: `backend/src/modules/notifications/notification-cleanup.service.ts`

- **Daily cleanup at 2:00 AM** using `@Cron(CronExpression.EVERY_DAY_AT_2AM)`
- **Automatic execution** without manual intervention
- **Comprehensive logging** for monitoring and debugging

### 3. Updated Module Configuration

**File**: `backend/src/modules/notifications/notifications.module.ts`

- **Added ScheduleModule** for cron job functionality
- **Integrated NotificationCleanupService** as a provider

### 4. Enhanced API Endpoints

**File**: `backend/src/modules/notifications/notifications.controller.ts`

- **Updated cleanup endpoint** with new default (3 days)
- **Added manual trigger endpoint** for testing: `POST /api/notifications/cleanup-auto`

## API Endpoints

### Manual Cleanup (Admin Only)
```http
POST /api/notifications/cleanup?daysOld=3
```

### Trigger Automatic Cleanup (Admin Only)
```http
POST /api/notifications/cleanup-auto
```

## Behavior Changes

### Before Implementation
- Notifications were only deleted when marked as read
- Archived notifications older than 30 days could be cleaned up manually
- No automatic cleanup process

### After Implementation
- **Mark as read**: Still deletes notification immediately
- **Automatic cleanup**: Deletes ALL notifications older than 3 days (read/unread/archived)
- **Scheduled execution**: Runs daily at 2:00 AM
- **Manual override**: Admins can trigger cleanup manually or adjust the period

## Database Impact

### Deletion Criteria
```sql
DELETE FROM notifications 
WHERE createdAt < (NOW() - INTERVAL '3 days')
```

This query will delete:
- ✅ Unread notifications older than 3 days
- ✅ Read notifications older than 3 days  
- ✅ Archived notifications older than 3 days
- ✅ Any notification older than 3 days regardless of status

### Performance Considerations
- **Index on createdAt**: Ensure there's an index on the `createdAt` column for efficient queries
- **Batch processing**: Large deletions are handled efficiently by the database
- **Logging**: All cleanup operations are logged for monitoring

## Configuration Options

### Environment Variables
- `DISABLE_NOTIFICATIONS`: If true, prevents notification creation (existing functionality)
- No new environment variables required

### Cron Schedule Options
The cleanup service supports different scheduling patterns:

```typescript
// Daily at 2:00 AM (current default)
@Cron(CronExpression.EVERY_DAY_AT_2AM)

// Every 6 hours
@Cron('0 */6 * * *')

// Every 12 hours
@Cron('0 */12 * * *')
```

## Testing

### Manual Testing
1. **Create test notifications** with different ages
2. **Run cleanup endpoint** manually
3. **Verify deletion** of notifications older than 3 days
4. **Check logs** for cleanup results

### Test Script
A test script is provided at `backend/src/modules/notifications/test-cleanup.ts` for manual verification.

## Monitoring

### Log Messages
- `Starting scheduled notification cleanup...`
- `Cleaned up X notifications older than 3 days`
- `Automatic cleanup completed: X notifications deleted`
- `Automatic cleanup failed: [error message]`

### Metrics to Monitor
- Number of notifications deleted per cleanup cycle
- Cleanup execution time
- Any cleanup failures or errors
- Database performance during cleanup operations

## Migration Notes

### Existing Notifications
- **No migration required** - existing notifications will be cleaned up automatically
- **Immediate effect** - cleanup starts working as soon as the service is deployed
- **Backward compatibility** - all existing API endpoints continue to work

### Deployment Steps
1. Install `@nestjs/schedule` package
2. Deploy updated code
3. Verify cleanup service starts automatically
4. Monitor logs for successful cleanup execution

## Security Considerations

- **Admin-only access** to manual cleanup endpoints
- **Rate limiting** applies to cleanup endpoints
- **Audit logging** for all cleanup operations
- **No user data exposure** during cleanup process

## Troubleshooting

### Common Issues

1. **Cleanup not running**
   - Check if ScheduleModule is properly imported
   - Verify NotificationCleanupService is registered as provider
   - Check application logs for startup errors

2. **Notifications not being deleted**
   - Verify database connection
   - Check createdAt column format
   - Review cleanup query logs

3. **Performance issues**
   - Ensure proper indexing on createdAt column
   - Monitor database performance during cleanup
   - Consider adjusting cleanup frequency if needed

### Debug Commands
```bash
# Check cleanup service status
curl -X POST /api/notifications/cleanup-auto

# Manual cleanup with custom period
curl -X POST "/api/notifications/cleanup?daysOld=1"

# Check notification count
curl -X GET /api/notifications/unread-count
```

## Future Enhancements

### Potential Improvements
- **Configurable cleanup period** via environment variable
- **Selective cleanup** by notification type
- **Cleanup statistics** and reporting
- **User notification** before cleanup (if needed)
- **Backup/archive** option before deletion

### Monitoring Dashboard
- Cleanup execution history
- Notification volume trends
- Performance metrics
- Error tracking and alerts
