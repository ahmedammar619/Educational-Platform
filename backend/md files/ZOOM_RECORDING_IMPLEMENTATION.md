# Zoom Recording Implementation Guide

## Overview

This implementation provides automatic Zoom meeting recording with cloud storage and YouTube upload functionality for the educational platform. The system automatically processes Zoom recordings through the following workflow:

1. **Zoom Cloud Recording**: Meetings are automatically recorded to Zoom cloud
2. **R2 Storage**: Recordings are downloaded from Zoom and stored in Cloudflare R2
3. **YouTube Upload**: Recordings are uploaded to YouTube with unlisted privacy
4. **Database Tracking**: All recording information is stored in the database

## Architecture

### Components

1. **Zoom API Service** (`zoom-api.service.ts`)
   - Creates meetings with cloud recording enabled
   - Downloads recording files from Zoom
   - Manages Zoom API authentication

2. **R2 Storage Service** (`r2.service.ts`)
   - Handles file uploads to Cloudflare R2
   - Manages file streaming and metadata
   - Provides public URLs for recordings

3. **YouTube Service** (`youtube.service.ts`)
   - Uploads videos to YouTube with unlisted privacy
   - Manages YouTube API authentication
   - Generates video titles and descriptions

4. **Recording Service** (`recording.service.ts`)
   - Orchestrates the entire recording workflow
   - Handles error recovery and retries
   - Updates database with recording status

5. **Webhook Controller** (`zoom-webhook.controller.ts`)
   - Receives Zoom webhook events
   - Verifies webhook signatures for security
   - Triggers recording processing

6. **Webhook Service** (`zoom-webhook.service.ts`)
   - Processes webhook events
   - Updates meeting status
   - Initiates recording processing

## Database Schema

### New Fields Added to `zoom_meetings` Table

```sql
ALTER TABLE zoom_meetings ADD COLUMN recordingStatus varchar(50) DEFAULT 'pending' NOT NULL;
ALTER TABLE zoom_meetings ADD COLUMN recordingUrl text;
ALTER TABLE zoom_meetings ADD COLUMN youtubeVideoId varchar(100);
ALTER TABLE zoom_meetings ADD COLUMN youtubeUrl text;
ALTER TABLE zoom_meetings ADD COLUMN recordingCompletedAt timestamp;
ALTER TABLE zoom_meetings ADD COLUMN r2RecordingKey varchar(500);
ALTER TABLE zoom_meetings ADD COLUMN r2RecordingUrl text;
```

### Recording Status Values

- `pending`: Recording not started
- `recording`: Recording in progress
- `processing`: Recording completed, processing for upload
- `completed`: Successfully uploaded to YouTube
- `failed`: Recording or upload failed

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Zoom Webhook Configuration
ZOOM_WEBHOOK_SECRET=your_webhook_secret_here

# YouTube API Configuration
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REFRESH_TOKEN=your_youtube_refresh_token
YOUTUBE_CHANNEL_ID=your_youtube_channel_id

# R2 Configuration (S3-compatible credentials)
R2_BUCKET_NAME=baraem
R2_REGION=weur
R2_ENDPOINT=https://9f7f3b84be13f9cfee5aa178acad1d08.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=8e7de9f83465b796ca4792b4040198a9
R2_SECRET_ACCESS_KEY=5e39b7a43a90efcc910dbf4ed697b64574c89d45a2052fc32e163b9eb8d35bf8
R2_PUBLIC_URL=https://media.baraemalnour.org
```

## API Endpoints

### Webhook Endpoints

- `POST /webhooks/zoom/events` - Receives Zoom webhook events
- `POST /webhooks/zoom/validation` - Validates webhook endpoint

### Test Endpoints

- `GET /zoom/recording-test/status/:meetingId` - Get recording status
- `POST /zoom/recording-test/retry/:meetingId` - Retry recording processing
- `GET /zoom/recording-test/zoom-details/:meetingId` - Get Zoom recording details
- `POST /zoom/recording-test/enable-auto-recording/:meetingId` - Enable automatic recording for existing meeting
- `POST /zoom/recording-test/disable-auto-recording/:meetingId` - Disable automatic recording for existing meeting
- `POST /zoom/recording-test/enable-host-control/:meetingId` - Enable host control (prevent automatic meeting termination)
- `GET /zoom/recording-test/test-r2-connection` - Test R2 cloud storage connection
- `GET /zoom/recording-test/check-recording-workflow/:meetingId` - Check recording workflow for a specific meeting
- `POST /zoom/recording-test/test-r2-upload/:meetingId` - Test R2 upload with actual Zoom recording

## Workflow

### 1. Meeting Creation

When a Zoom meeting is created, **automatic cloud recording** is enabled:

```typescript
settings: {
  // ... other settings
  cloud_recording: true,
  auto_recording: 'cloud', // Automatically start recording when meeting begins
  recording_authentication: false, // Allow recording without authentication
  cloud_recording_download: true,
  // ... other recording settings
}
```

**🎯 Automatic Recording**: Recording starts automatically when the meeting begins - no host interaction required!

**👑 Host Control**: Meeting will wait for the host to manually end it - no automatic termination!

### 2. Recording Events

The system handles these Zoom webhook events:

- `recording.started` - Updates status to 'recording'
- `recording.stopped` - Updates status to 'processing'
- `recording.completed` - Triggers full processing workflow
- `meeting.ended` - Updates meeting status to 'ended'

### 3. Recording Processing

When a recording is completed:

1. **Download from Zoom**: Recording is streamed directly from Zoom to R2
2. **Upload to R2**: File is stored in Cloudflare R2 with metadata
3. **Upload to YouTube**: File is streamed from R2 to YouTube API
4. **Update Database**: All URLs and status are saved
5. **Keep in R2**: File remains in R2 as backup

### 4. YouTube Privacy

Videos are uploaded with:
- **Privacy**: `unlisted` (accessible via link but not public/searchable)
- **Access**: Anyone with the link can view
- **Search**: Not visible in YouTube search results
- **Channel**: Not publicly visible on your channel

## Security

### Webhook Verification

All webhook events are verified using HMAC-SHA256 signatures:

```typescript
const expectedSignature = crypto
  .createHmac('sha256', this.webhookSecret)
  .update(JSON.stringify(body))
  .digest('hex');
```

### Error Handling

- Failed uploads are retried automatically
- Database status is updated on failures
- Comprehensive logging for debugging
- Graceful degradation on service failures

## Testing

### Test Recording Status

```bash
GET /zoom/recording-test/status/{meetingId}
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "completed",
    "recordingUrl": "https://media.baraemalnour.org/recordings/...",
    "youtubeUrl": "https://www.youtube.com/watch?v=...",
    "youtubeVideoId": "abc123",
    "completedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Retry Processing

```bash
POST /zoom/recording-test/retry/{meetingId}
```

### Check Zoom Details

```bash
GET /zoom/recording-test/zoom-details/{meetingId}
```

## Monitoring

### Logs

The system provides comprehensive logging:

- Recording status changes
- Upload progress
- Error details
- Performance metrics

### Database Queries

Check recording status:

```sql
SELECT 
  id, 
  title, 
  recordingStatus, 
  youtubeUrl, 
  recordingCompletedAt 
FROM zoom_meetings 
WHERE recordingStatus != 'pending';
```

## Automatic Recording

### How It Works

**🎯 Fully Automatic Recording**: The system now automatically starts recording when a Zoom meeting begins - no host interaction required!

- **Meeting Creation**: Automatic recording is enabled by default
- **Meeting Start**: Recording begins automatically when the meeting starts
- **Meeting End**: Recording stops automatically when the meeting ends
- **Processing**: Webhook triggers automatic R2 and YouTube upload

**👑 Host Control**: Meetings are configured to wait for the host to manually end them:

- **No Automatic Termination**: Meeting continues until host manually ends it
- **Host Must Be Present**: `join_before_host: false` ensures host starts the meeting
- **Full Host Control**: Host controls video order, participants, and meeting flow
- **Manual End Required**: Only the host can end the meeting

### Enable/Disable Automatic Recording

For existing meetings, you can control automatic recording:

```bash
# Enable automatic recording
POST /zoom/recording-test/enable-auto-recording/{meetingId}

# Disable automatic recording
POST /zoom/recording-test/disable-auto-recording/{meetingId}

# Enable host control (prevent automatic meeting termination)
POST /zoom/recording-test/enable-host-control/{meetingId}

# Test R2 cloud storage connection
GET /zoom/recording-test/test-r2-connection

# Check recording workflow for a specific meeting
GET /zoom/recording-test/check-recording-workflow/{meetingId}

# Test R2 upload with actual Zoom recording
POST /zoom/recording-test/test-r2-upload/{meetingId}
```

## Testing R2 Integration

### Test R2 Connection

To verify that R2 cloud storage is properly configured:

```bash
GET /zoom/recording-test/test-r2-connection
```

This will return:
- R2 configuration details
- Test key generation
- Public URL format
- Connection status

### Check Recording Workflow

To check if a Zoom meeting has recordings ready for upload:

```bash
GET /zoom/recording-test/check-recording-workflow/{meetingId}
```

This will return:
- Available recording files
- File sizes and types
- Download URLs
- Workflow readiness status

### Test R2 Upload

To test the actual upload process from Zoom to R2:

```bash
POST /zoom/recording-test/test-r2-upload/{meetingId}
```

This will:
1. Download the recording from Zoom
2. Upload it to R2 cloud storage
3. Return the R2 URL and file details
4. Verify the complete workflow

### Expected R2 Workflow

1. **Zoom Recording Completes** → Webhook triggers
2. **Download from Zoom** → Stream directly to R2
3. **Upload to R2** → File stored with metadata
4. **Upload to YouTube** → Stream from R2 to YouTube
5. **Database Update** → All URLs saved
6. **R2 Backup** → File retained in R2

## Troubleshooting

### Common Issues

1. **Recording Not Starting Automatically**
   - Check Zoom account has cloud recording enabled
   - Verify meeting settings include `auto_recording: 'cloud'`
   - Ensure `recording_authentication: false` is set

2. **Upload Failures**
   - Check R2 credentials and bucket permissions
   - Verify YouTube API credentials and quotas
   - Check network connectivity

3. **Webhook Not Receiving Events**
   - Verify webhook URL is accessible
   - Check webhook secret configuration
   - Ensure Zoom webhook is properly configured

### Error Recovery

- Use the retry endpoint to reprocess failed recordings
- Check logs for detailed error information
- Verify all environment variables are set correctly

## Performance Considerations

- Recordings are streamed directly between services (no local storage)
- R2 serves as intermediate storage for reliability
- YouTube uploads happen asynchronously
- Database updates are atomic and consistent

## Future Enhancements

- Automatic cleanup of old R2 files
- Video thumbnail generation
- Multiple recording format support
- Advanced error recovery mechanisms
- Recording analytics and metrics
