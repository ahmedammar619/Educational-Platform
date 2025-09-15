import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { SkipEmailVerification } from '../../common/decorators/skip-email-verification.decorator';

@ApiTags('Authentication')
@Controller('auth')
@ApiBearerAuth('JWT-auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @SkipEmailVerification()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  async logout(@Request() req) {
    return this.authService.logout(req.user.sub);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get user information (Protected)' })
  async getCurrentUser(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Get('verify-token')
  @ApiOperation({ summary: 'Verify JWT token (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
  })
  async verifyToken(@Request() req) {
    return {
      valid: true,
      user: req.user
    };
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile (Protected)' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Put('profile')
  @Public()
  @ApiOperation({ summary: 'Update user profile (Public - No Authorization Required)' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
  })
  async updateProfile(
    @Body() body: { userId: string; updateData: UpdateProfileDto },
  ) {
    if (!body.userId) {
      throw new Error('User ID is required');
    }
    return this.authService.updateProfile(body.userId, body.updateData);
  }

  @Put('change-password')
  @Public()
  @ApiOperation({ summary: 'Change user password (Public - No Authorization Required)' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  async changePassword(
    @Body() body: { userId: string; changePasswordData: ChangePasswordDto },
  ) {
    if (!body.userId) {
      throw new Error('User ID is required');
    }
    return this.authService.changePassword(body.userId, body.changePasswordData);
  }

  @Put('deactivate')
  @Public()
  @ApiOperation({ summary: 'Deactivate user account (Public - No Authorization Required)' })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully',
  })
  async deactivateAccount(@Body() body: { userId: string }) {
    if (!body.userId) {
      throw new Error('User ID is required');
    }
    return this.authService.deactivateAccount(body.userId);
  }

  @Post('send-verification-email')
  @Public()
  @ApiOperation({ summary: 'Send email verification (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
  })
  async sendVerificationEmail(@Body() body: { userId: string }) {
    if (!body.userId) {
      throw new Error('User ID is required');
    }
    return this.authService.sendVerificationEmail(body.userId);
  }

  @Post('verify-email')
  @Public()
  @ApiOperation({ summary: 'Verify email address (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
  })
  async verifyEmail(@Body() body: { token: string }) {
    if (!body.token) {
      throw new Error('Verification token is required');
    }
    return this.authService.verifyEmail(body.token);
  }

  @Get('verify-email')
  @Public()
  @ApiOperation({ summary: 'Verify email address via query parameter (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
  })
  async verifyEmailFromQuery(@Query('token') token: string) {
    if (!token) {
      throw new Error('Verification token is required');
    }
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification-email')
  @Public()
  @ApiOperation({ summary: 'Resend verification email (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Verification email resent successfully',
  })
  async resendVerificationEmail(@Body() body: { userId: string }) {
    if (!body.userId) {
      throw new Error('User ID is required');
    }
    return this.authService.resendVerificationEmail(body.userId);
  }

  @Post('send-welcome-email')
  @Public()
  @ApiOperation({ summary: 'Send welcome email after profile completion (Public)' })
  @ApiResponse({
    status: 200,
    description: 'Welcome email sent successfully',
  })
  async sendWelcomeEmailAfterProfileCompletion(@Body() body: { userId: string }) {
    if (!body.userId) {
      throw new Error('User ID is required');
    }
    return this.authService.sendWelcomeEmailAfterProfileCompletion(body.userId);
  }

  // Test JWT token verification
  @Get('test-jwt')
  @Public()
  @ApiOperation({ summary: 'Test JWT token verification (Debug endpoint - Public)' })
  @ApiResponse({
    status: 200,
    description: 'JWT verification test results',
  })
  async testJwt(@Request() req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return {
        success: false,
        message: 'No authorization header found',
        headers: req.headers
      };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        message: 'Invalid authorization format (should start with "Bearer ")',
        authHeader
      };
    }

    const token = authHeader.substring(7);
    
    return {
      success: true,
      message: 'Token received (verification disabled in public mode)',
      tokenInfo: {
        length: token.length,
        preview: token.substring(0, 20) + '...',
        parts: token.split('.').length
      },
      note: 'JWT verification is disabled in public mode. In production, verify tokens properly.'
    };
  }

  // Test protected endpoint
  @Get('protected-test')
  @Public()
  @ApiOperation({ summary: 'Test protected endpoint (Public - No Authorization Required)' })
  @ApiResponse({
    status: 200,
    description: 'Access granted to protected endpoint',
  })
  async protectedTest(@Query('userId') userId: string) {
    return {
      success: true,
      message: 'Access granted to protected endpoint (public mode)',
      user: {
        id: userId || 'demo-user-id',
        email: 'demo@example.com',
        role: 'demo'
      },
      timestamp: new Date().toISOString(),
      note: 'This endpoint is now public. In production, add proper authentication.'
    };
  }
}
