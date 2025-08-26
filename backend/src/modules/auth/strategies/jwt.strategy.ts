import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-change-in-production',
      issuer: 'educational-platform',
      audience: 'educational-platform-users',
      algorithms: ['HS256'],
      clockTolerance: 30, // 30 seconds
    });
  }

  async validate(payload: any) {
    try {
      console.log('🔐 JWT Strategy - Validating payload:', {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        exp: payload.exp,
        iat: payload.iat,
        now: Math.floor(Date.now() / 1000)
      });

      // Validate payload structure
      if (!payload.sub || !payload.email || !payload.role) {
        console.log('❌ JWT Strategy - Invalid payload structure');
        throw new UnauthorizedException('Invalid token payload');
      }

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        console.log('❌ JWT Strategy - Token expired');
        throw new UnauthorizedException('Token has expired');
      }

      // Check if token is issued in the future (clock skew protection)
      if (payload.iat && payload.iat > currentTime + 30) {
        console.log('❌ JWT Strategy - Token issued in future');
        throw new UnauthorizedException('Token issued in the future');
      }

      // Get user from database
      const user = await this.authService.findById(payload.sub);
      
      if (!user) {
        console.log('❌ JWT Strategy - User not found in database');
        throw new UnauthorizedException('User not found');
      }

      console.log('✅ JWT Strategy - User validated successfully:', {
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      console.error('❌ JWT Strategy - Validation error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }
}