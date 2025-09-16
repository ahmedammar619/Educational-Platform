# Zoom Webhook Setup and Troubleshooting Guide

This guide covers setting up Zoom webhooks for the Educational Platform and troubleshooting common issues.

## Overview

The webhook system handles Zoom events like:
- `recording.completed` - When a meeting recording is finished
- `recording.started` - When recording begins
- `recording.stopped` - When recording stops
- `meeting.ended` - When a meeting ends

## Webhook Endpoints

### Production Endpoints
- **Events**: `https://backend-production-ece4.up.railway.app/api/webhooks/zoom/events`
- **Validation**: `https://backend-production-ece4.up.railway.app/api/webhooks/zoom/validation`

### Local Development Endpoints
- **Events**: `http://localhost:3000/api/webhooks/zoom/events`
- **Validation**: `http://localhost:3000/api/webhooks/zoom/validation`

## Environment Variables

Required environment variables:

```bash
# Zoom Webhook Secret (get this from Zoom App Marketplace)
ZOOM_WEBHOOK_SECRET=your_webhook_secret_here

# For testing, you can use:
ZOOM_WEBHOOK_SECRET=test-secret
```

## Setup Instructions

### 1. Zoom App Configuration

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/)
2. Create or edit your app
3. Go to "Webhook" section
4. Add webhook endpoint: `https://backend-production-ece4.up.railway.app/api/webhooks/zoom/events`
5. Subscribe to events:
   - `recording.completed`
   - `recording.started`
   - `recording.stopped`
   - `meeting.ended`
6. Copy the webhook secret and set it as `ZOOM_WEBHOOK_SECRET`

### 2. Local Testing with ngrok

For local development, use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Use the https URL in Zoom webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/zoom/events
```

### 3. Testing Webhooks

#### Using the Test Scripts

```bash
# Test basic webhook connectivity
node test-webhook-endpoint.js

# Test with proper signature generation
node test-webhook-signature.js
```

#### Manual Testing

```bash
# Test with curl (no signature - for testing mode)
curl -X POST http://localhost:3000/api/webhooks/zoom/events \
  -H "Content-Type: application/json" \
  -d '{"event":"recording.completed","payload":{"account_id":"test","object":{"id":"123","topic":"Test"}}}'

# Test validation endpoint
curl -X POST http://localhost:3000/api/webhooks/zoom/validation \
  -H "Content-Type: application/json" \
  -H "x-zoom-validation-token: test-token" \
  -d '{"test":"validation"}'
```

## Troubleshooting

### Common Issues

#### 1. 401 Unauthorized - Invalid webhook signature

**Symptoms:**
```
[Nest] WARN [ZoomWebhookService] No signature provided in webhook request
[Nest] ERROR [ZoomWebhookController] Error processing webhook event: Invalid webhook signature
```

**Solutions:**
- Check if `ZOOM_WEBHOOK_SECRET` is set correctly
- For testing, use `ZOOM_WEBHOOK_SECRET=test-secret`
- Verify the signature generation in Zoom matches your implementation

#### 2. 404 Not Found - Webhook endpoint not found

**Symptoms:**
```
{"statusCode":404,"message":"Cannot POST /api/webhooks/zoom/events","error":"Not Found"}
```

**Solutions:**
- Check if the server is running
- Verify the URL is correct
- Ensure the webhook controller is properly registered in the module
- Check if the production deployment includes the webhook routes

#### 3. Production Server Issues

**Symptoms:**
- Production endpoints return 404
- Local endpoints work but production doesn't

**Solutions:**
- Check Railway deployment logs
- Verify the production server is running
- Check if all modules are properly deployed
- Ensure environment variables are set in production

#### 4. CORS Issues

**Symptoms:**
- Browser blocks webhook requests
- Preflight requests fail

**Solutions:**
- Webhooks don't use CORS (they're server-to-server)
- If testing from browser, use ngrok or disable CORS temporarily

### Debugging Steps

#### 1. Check Server Status

```bash
# Check if local server is running
curl http://localhost:3000/api/health

# Check production server
curl https://backend-production-ece4.up.railway.app/api/health
```

#### 2. Verify Webhook Routes

```bash
# Check if webhook routes are registered
curl -X POST http://localhost:3000/api/webhooks/zoom/events \
  -H "Content-Type: application/json" \
  -d '{"test":"route-check"}'
```

#### 3. Test Signature Generation

```bash
# Run the signature test script
node test-webhook-signature.js
```

#### 4. Check Environment Variables

```bash
# In your backend directory
echo $ZOOM_WEBHOOK_SECRET

# Or check in your .env file
cat .env | grep ZOOM_WEBHOOK_SECRET
```

### Production Deployment Checklist

- [ ] Server is running on Railway
- [ ] `ZOOM_WEBHOOK_SECRET` is set in production environment
- [ ] Webhook routes are accessible from internet
- [ ] SSL certificate is valid
- [ ] No firewall blocking webhook requests
- [ ] Database connection is working
- [ ] All required modules are deployed

### Testing Checklist

- [ ] Local webhook endpoint responds (200/401 is OK for testing)
- [ ] Production webhook endpoint responds
- [ ] Signature generation works correctly
- [ ] Validation endpoint works
- [ ] ngrok tunnel works (for local testing)
- [ ] Zoom webhook configuration is correct

## Security Considerations

### Webhook Signature Validation

The webhook system validates signatures using HMAC-SHA256:

```javascript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

### Testing Mode

For development/testing, the system allows requests without signatures when:
- `ZOOM_WEBHOOK_SECRET` is not set, or
- `ZOOM_WEBHOOK_SECRET` is set to `'test-secret'`

**⚠️ Never use testing mode in production!**

## Webhook Event Handling

### Recording Completed Event

When a recording is completed:
1. Webhook receives `recording.completed` event
2. System finds the meeting in database
3. Updates recording status to 'completed'
4. Processes the recording (downloads to R2, uploads to YouTube)

### Meeting Ended Event

When a meeting ends:
1. Webhook receives `meeting.ended` event
2. System finds the meeting in database
3. Updates meeting status to 'ended'

## Monitoring and Logs

### Log Levels

- **INFO**: Successful webhook processing
- **WARN**: Missing signatures (testing mode)
- **ERROR**: Processing failures

### Key Log Messages

```
[ZoomWebhookController] Received Zoom webhook event: recording.completed
[ZoomWebhookService] Processing webhook event: recording.completed
[ZoomWebhookService] Recording completed for meeting: 123456789
[ZoomWebhookController] Successfully processed webhook event: recording.completed
```

### Error Logs

```
[ZoomWebhookService] No signature provided in webhook request
[ZoomWebhookController] Invalid webhook signature received
[ZoomWebhookService] Meeting not found in database: 123456789
```

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Run the test scripts
3. Check server logs
4. Verify environment variables
5. Test with ngrok for local development

For additional help, check the Railway deployment logs and ensure all environment variables are properly configured.
