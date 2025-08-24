export const rateLimitConfig = [
  // Default rate limit
  {
    name: 'default',
    ttl: 60000,        // 1 minute
    limit: 5000,       // 5000 requests per minute
  },
  // Auth rate limit
  {
    name: 'auth',
    ttl: 300000,       // 5 minutes
    limit: 50,         // 50 auth requests per 5 minutes
  },
  // API rate limit
  {
    name: 'api',
    ttl: 60000,        // 1 minute
    limit: 10000,      // 10000 API requests per minute
  },
  // Upload rate limit
  {
    name: 'upload',
    ttl: 60000,        // 1 minute
    limit: 100,        // 100 file uploads per minute
  },
];

// Helper functions for getting limits
export const getRateLimit = (name: string) => {
  return rateLimitConfig.find(config => config.name === name) || rateLimitConfig[0];
};

export const getCurrentEnvironmentLimits = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    // Return more restrictive limits for production
    return [
      { name: 'default', ttl: 60000, limit: 1000 },
      { name: 'auth', ttl: 300000, limit: 10 },
      { name: 'api', ttl: 60000, limit: 2000 },
      { name: 'upload', ttl: 60000, limit: 20 },
    ];
  }
  return rateLimitConfig;
};
