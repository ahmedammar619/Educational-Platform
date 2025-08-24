import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Add retry-after header
    const retryAfter = Math.ceil(this.getThrottlerOptions().ttl / 1000);
    response.setHeader('Retry-After', retryAfter);
    
    // Add rate limit headers for better client handling
    response.setHeader('X-RateLimit-Limit', this.getThrottlerOptions().limit);
    response.setHeader('X-RateLimit-Remaining', 0);
    response.setHeader('X-RateLimit-Reset', new Date(Date.now() + this.getThrottlerOptions().ttl).toISOString());
    
    // Custom error message
    const errorMessage = `Rate limit exceeded. Retry after ${retryAfter} seconds. Limit: ${this.getThrottlerOptions().limit} requests per ${this.getThrottlerOptions().ttl / 1000} seconds. Endpoint: ${request.url} Method: ${request.method}`;
    
    throw new ThrottlerException(errorMessage);
  }

  protected getThrottlerOptions() {
    // Get the appropriate throttler options based on the route
    return {
      ttl: 60000,      // 1 minute default
      limit: 5000,     // 5000 requests per minute default
    };
  }
}
