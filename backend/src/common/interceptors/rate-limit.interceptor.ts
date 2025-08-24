import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Add rate limit info headers to help clients manage their requests
    response.setHeader('X-RateLimit-Info', 'Rate limiting is enabled');
    response.setHeader('X-RateLimit-Documentation', 'Check X-RateLimit-* headers for limits');
    
    return next.handle().pipe(
      map(data => {
        // Add rate limit info to response body for debugging
        if (process.env.NODE_ENV === 'development') {
          return {
            ...data,
            _rateLimitInfo: {
              message: 'Rate limiting is active',
              defaultLimit: '5000 requests per minute',
              authLimit: '50 requests per 5 minutes',
              apiLimit: '10000 requests per minute',
            }
          };
        }
        return data;
      })
    );
  }
}
