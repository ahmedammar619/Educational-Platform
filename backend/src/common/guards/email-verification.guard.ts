import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_EMAIL_VERIFICATION_KEY } from '../decorators/skip-email-verification.decorator';

@Injectable()
export class EmailVerificationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const skipEmailVerification = this.reflector.getAllAndOverride<boolean>(SKIP_EMAIL_VERIFICATION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip email verification for public routes or routes explicitly marked to skip
    if (isPublic || skipEmailVerification) {
      console.log('🔓 Email Verification Guard - Skipping email verification check');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log('🔍 Email Verification Guard - Checking email verification:', {
      path: request.url,
      userId: user?.sub,
      email: user?.email,
      emailVerified: user?.emailVerified
    });

    if (!user) {
      console.log('❌ Email Verification Guard - No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // Check if user's email is verified (only for teachers and parents)
    if ((user.role === 'teacher' || user.role === 'parent') && !user.emailVerified) {
      console.log('❌ Email Verification Guard - Email not verified for teacher/parent');
      throw new ForbiddenException('Email verification required. Please check your email and click the verification link.');
    }

    console.log('✅ Email Verification Guard - Email verified, allowing access');
    return true;
  }
}
