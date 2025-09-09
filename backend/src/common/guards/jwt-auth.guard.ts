import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    console.log('🔍 JWT Auth Guard - Checking route:', {
      path: context.switchToHttp().getRequest().url,
      isPublic,
      handler: context.getHandler().name,
      className: context.getClass().name
    });

    if (isPublic) {
      console.log('🔓 JWT Auth Guard - Public route, skipping authentication');
      return true;
    }

    console.log('🔐 JWT Auth Guard - Protected route, checking authentication');
    
    const request = context.switchToHttp().getRequest();
    console.log('📝 JWT Auth Guard - Request headers:', {
      authorization: request.headers.authorization,
      hasToken: !!request.headers.authorization
    });
    
    // Use the passport JWT strategy
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      console.log('❌ JWT Auth Guard - Authentication failed:', {
        error: err?.message,
        info: info?.message,
        hasUser: !!user,
        errorType: err?.constructor?.name
      });
      
      if (err?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      
      if (err?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      
      if (err?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active yet');
      }
      
      throw err || new UnauthorizedException('Authentication failed');
    }
    
    console.log('✅ JWT Auth Guard - Authentication successful:', {
      userId: user.sub,
      email: user.email,
      role: user.role
    });
    
    return user;
  }
}
