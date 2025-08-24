import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { securityConfig } from '../../../config/security.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || securityConfig.jwt.secret,
      issuer: securityConfig.jwt.issuer,
      audience: securityConfig.jwt.audience,
      // Additional security options
      algorithms: [securityConfig.jwt.algorithm],
      clockTolerance: securityConfig.jwt.clockTolerance,
    });
  }

  async validate(payload: any) {
    try {
      // Validate payload structure
      if (!payload.sub || !payload.email || !payload.role) {
        throw new UnauthorizedException('Invalid token payload');
      }

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        throw new UnauthorizedException('Token has expired');
      }

      // Check if token is issued in the future (clock skew protection)
      if (payload.iat && payload.iat > currentTime + securityConfig.jwt.clockTolerance) {
        throw new UnauthorizedException('Token issued in the future');
      }

      // Get user from database
      const user = await this.authService.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token validation failed');
    }
  }
}