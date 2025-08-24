# API Configuration Guide

## Quick Setup

The frontend is configured to connect to your NestJS backend at `http://localhost:3000` by default.

**Important**: The backend uses a global prefix `/api`, so all endpoints are prefixed with `/api` (e.g., `/api/auth/register`).

## Changing the API URL

If you need to change the backend URL, edit the file:

```
src/config/api.js
```

And update this line:

```javascript
BASE_URL: 'http://localhost:3000',
```

## Environment Variables (Optional)

If you want to use environment variables, you can:

1. Create a `.env.local` file in the frontend root directory
2. Add: `VITE_API_URL=http://your-backend-url:port`
3. Update `src/config/api.js` to use:

```javascript
BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
```

## Current Configuration

- **Default Backend URL**: `http://localhost:3000`
- **Global API Prefix**: `/api` (set by backend)
- **Configuration File**: `src/config/api.js`
- **Services**: All services automatically use this configuration
- **Example Endpoints**: 
  - `/api/auth/register` for parent registration
  - `/api/auth/login` for user login
  - `/api/users` for user management

## Testing

After changing the configuration:

1. Restart your frontend development server
2. Navigate to `/test-services` to test the connection
3. Check the browser console for any connection errors

## Common URLs

- **Local Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`
- **Docker**: `http://backend:3000` (if using Docker Compose)
