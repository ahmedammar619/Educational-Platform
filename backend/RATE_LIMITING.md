# Rate Limiting Configuration

## Overview
This application implements intelligent rate limiting to prevent abuse while maintaining good user experience during development.

## Current Configuration

### Development Environment (Default)
- **Default Limit**: 5,000 requests per minute
- **Auth Limit**: 50 requests per 5 minutes
- **API Limit**: 10,000 requests per minute
- **Upload Limit**: 100 uploads per minute

### Production Environment
- **Default Limit**: 1,000 requests per minute
- **Auth Limit**: 10 requests per 5 minutes
- **API Limit**: 2,000 requests per minute
- **Upload Limit**: 20 uploads per minute

## Why These Limits?

### Development
- **Higher limits** to prevent 429 errors during development
- **Faster iteration** without hitting rate limits
- **Better debugging** experience

### Production
- **Lower limits** to prevent abuse and protect server resources
- **Security-focused** configuration
- **Cost optimization** for cloud resources

## How It Works

### 1. Automatic Environment Detection
The system automatically detects `NODE_ENV` and applies appropriate limits:
```bash
NODE_ENV=development  # Uses development limits
NODE_ENV=production   # Uses production limits
```

### 2. Named Rate Limiters
Different endpoints can use different rate limiters:
```typescript
// Use auth limiter for login/registration
@UseGuards(ThrottlerGuard)
@Throttle({ name: 'auth' })
async login() { ... }

// Use API limiter for general endpoints
@UseGuards(ThrottlerGuard)
@Throttle({ name: 'api' })
async getData() { ... }
```

### 3. Custom Error Handling
When rate limits are exceeded, the system provides:
- **Retry-After header** with seconds to wait
- **X-RateLimit-* headers** for client information
- **Detailed error messages** with limit information
- **Development-friendly** error details

## Error Response Format

When you hit a rate limit (429 error):
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "limit": 5000,
  "window": 60,
  "endpoint": "/api/users",
  "method": "GET"
}
```

## Headers Added to All Responses

- `X-RateLimit-Info`: "Rate limiting is enabled"
- `X-RateLimit-Documentation`: "Check X-RateLimit-* headers for limits"
- `X-RateLimit-Limit`: Current limit for the endpoint
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: When the limit resets

## Customization

### Environment Variables
You can override limits using environment variables:
```bash
# Override default limits
RATE_LIMIT_TTL=60000
RATE_LIMIT_LIMIT=5000

# Override auth limits
RATE_LIMIT_AUTH_TTL=300000
RATE_LIMIT_AUTH_LIMIT=50
```

### Code Configuration
Modify `src/config/rate-limit.config.ts` to change limits:
```typescript
export const rateLimitConfig = [
  {
    name: 'default',
    ttl: 60000,        // Time window in milliseconds
    limit: 5000,       // Maximum requests in that window
  },
  // ... more configurations
];
```

## Best Practices

### 1. Frontend Implementation
```javascript
// Handle 429 errors gracefully
if (error.response?.status === 429) {
  const retryAfter = error.response.headers['retry-after'];
  console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  
  // Show user-friendly message
  // Implement exponential backoff
  // Add request delays
}
```

### 2. Request Management
```javascript
// Add delays between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Use in API calls
await delay(100); // 100ms delay
const response = await apiCall();
```

### 3. Caching
```javascript
// Cache responses to reduce API calls
const cache = new Map();
const getCachedData = (key) => cache.get(key);
const setCachedData = (key, data) => cache.set(key, data);
```

## Troubleshooting

### Common Issues

1. **429 Errors During Development**
   - Check if you're making too many rapid requests
   - Add delays between API calls
   - Implement proper loading states

2. **Rate Limits Too Restrictive**
   - Increase limits in `rate-limit.config.ts`
   - Check environment variables
   - Verify `NODE_ENV` setting

3. **Rate Limits Not Working**
   - Ensure `CustomThrottlerGuard` is applied
   - Check if rate limiting is enabled
   - Verify configuration is loaded

### Debug Mode
In development, responses include rate limit information:
```json
{
  "data": { ... },
  "_rateLimitInfo": {
    "message": "Rate limiting is active",
    "defaultLimit": "5000 requests per minute",
    "authLimit": "50 requests per 5 minutes",
    "apiLimit": "10000 requests per minute"
  }
}
```

## Migration from Old System

If you were using the old rate limiting:
1. **Old limits**: 10 requests per minute (very restrictive)
2. **New limits**: 5,000 requests per minute (development-friendly)
3. **Better error messages** with retry information
4. **Environment-aware** configuration
5. **Named limiters** for different endpoint types

The new system should eliminate most 429 errors during normal development while maintaining security in production.
