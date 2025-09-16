import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    // Verify connection once during startup
    this.verifyConnectionOnStartup();
  }

  private initializeTransporter() {
    try {
      const smtpHost = this.configService.get<string>('SMTP_HOST', 'smtp.zoho.com');
      const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
      const smtpSecure = this.configService.get<boolean>('SMTP_SECURE', false);
      
      this.logger.log(`Initializing email transporter with host: ${smtpHost}, port: ${smtpPort}, secure: ${smtpSecure}`);
      
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: false, // Always false for port 587 (STARTTLS)
        auth: {
          user: this.configService.get<string>('SMTP_USER', 'info@baraemalnour.org'),
          pass: this.configService.get<string>('SMTP_PASS', 'y1fsNly$'),
        },
        tls: {
          rejectUnauthorized: false, // For development/testing
          minVersion: 'TLSv1', // Use TLS 1.0 or higher
          maxVersion: 'TLSv1.3', // Support up to TLS 1.3
        },
        // Additional options for better compatibility and performance
        connectionTimeout: 30000, // 30 seconds (reduced from 60)
        greetingTimeout: 15000, // 15 seconds (reduced from 30)
        socketTimeout: 30000, // 30 seconds (reduced from 60)
        debug: false, // Disable debug logging for production performance
        logger: false, // Disable logger for production performance
        pool: true, // Enable connection pooling
        maxConnections: 5, // Maximum number of connections in pool
        maxMessages: 100, // Maximum number of messages per connection
      });

      this.logger.log('Email transporter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  private async verifyConnectionOnStartup() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully on startup');
    } catch (error) {
      this.logger.warn('SMTP connection verification failed on startup, will retry on first email send:', error.message);
    }
  }

  private getLogoUrl(): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    // Use the PNG logo from the public assets directory
    return `${frontendUrl}/assets/baraem.png`;
  }

  async sendVerificationEmail(email: string, verificationToken: string, firstName: string): Promise<boolean> {
    try {
      const verificationUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: `"Baraem Al Nour" <${this.configService.get<string>('SMTP_USER', 'info@baraemalnour.org')}>`,
        to: email,
        subject: 'Verify Your Email - Baraem Al Nour Educational Platform',
        html: this.getVerificationEmailTemplate(firstName, verificationUrl),
        text: this.getVerificationEmailText(firstName, verificationUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent successfully to ${email}. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      this.logger.error(`Error details: ${error.message}`);
      if (error.code) {
        this.logger.error(`Error code: ${error.code}`);
      }
      return false;
    }
  }

  async sendWelcomeEmail(email: string, firstName: string, lastName: string, role: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Baraem Al Nour" <${this.configService.get<string>('SMTP_USER', 'info@baraemalnour.org')}>`,
        to: email,
        subject: 'Welcome to Baraem Al Nour Educational Platform',
        html: this.getWelcomeEmailTemplate(firstName, lastName, role),
        text: this.getWelcomeEmailText(firstName, lastName, role),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent successfully to ${email}. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      return false;
    }
  }

  private getVerificationEmailTemplate(firstName: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎓 Baraem Al Nour</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Educational Platform</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Welcome to Baraem Al Nour Educational Platform! We're excited to have you join our learning community.</p>
            <p>To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Baraem Al Nour Educational Platform. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getVerificationEmailText(firstName: string, verificationUrl: string): string {
    return `
Hello ${firstName}!

Welcome to Baraem Al Nour Educational Platform! We're excited to have you join our learning community.

To complete your registration and start using your account, please verify your email address by visiting this link:

${verificationUrl}

Important: This verification link will expire in 24 hours for security reasons.

If you didn't create an account with us, please ignore this email.

© 2024 Baraem Al Nour Educational Platform. All rights reserved.
This is an automated message, please do not reply to this email.
    `;
  }

  private getWelcomeEmailTemplate(firstName: string, lastName: string, role: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Baraem Al Nour</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="margin-bottom: 15px;">
              <img src="${this.getLogoUrl()}" alt="Baraem Al Nour Logo" style="height: 60px; width: auto; max-width: 200px;" />
            </div>
            <h1 style="margin: 0; font-size: 24px;">🎓 Baraem Al Nour</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Educational Platform</p>
          </div>
          <div class="content">
            <h2>Welcome ${firstName} ${lastName}!</h2>
            <p>Congratulations! Your email has been successfully verified and your ${role} account is now active.</p>
            <p>You can now:</p>
            <ul>
              <li>Access all platform features</li>
              <li>Manage your profile</li>
              <li>Connect with other users</li>
              <li>Enjoy our educational resources</li>
            </ul>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Thank you for choosing Baraem Al Nour Educational Platform!</p>
          </div>
          <div class="footer">
            <p>© 2024 Baraem Al Nour Educational Platform. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getWelcomeEmailText(firstName: string, lastName: string, role: string): string {
    return `
Welcome ${firstName} ${lastName}!

Congratulations! Your email has been successfully verified and your ${role} account is now active.

You can now:
- Access all platform features
- Manage your profile
- Connect with other users
- Enjoy our educational resources

If you have any questions or need assistance, please don't hesitate to contact our support team.

Thank you for choosing Baraem Al Nour Educational Platform!

© 2024 Baraem Al Nour Educational Platform. All rights reserved.
This is an automated message, please do not reply to this email.
    `;
  }

  async sendPasswordResetEmail(email: string, resetToken: string, firstName: string): Promise<boolean> {
    try {
      const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"Baraem Al Nour" <${this.configService.get<string>('SMTP_USER', 'info@baraemalnour.org')}>`,
        to: email,
        subject: 'Reset Your Password - Baraem Al Nour Educational Platform',
        html: this.getPasswordResetEmailTemplate(firstName, resetUrl),
        text: this.getPasswordResetEmailText(firstName, resetUrl),
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent successfully to ${email}. MessageId: ${result.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}:`, error);
      this.logger.error(`Error details: ${error.message}`);
      if (error.code) {
        this.logger.error(`Error code: ${error.code}`);
      }
      return false;
    }
  }

  private getPasswordResetEmailTemplate(firstName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🔒 Baraem Al Nour</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Educational Platform</p>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>We received a request to reset your password for your Baraem Al Nour Educational Platform account.</p>
            <p>If you made this request, click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link will expire in 24 hours for security reasons</li>
                <li>If you didn't request this password reset, please ignore this email</li>
                <li>Your password will remain unchanged until you click the link above</li>
              </ul>
            </div>
            </div>
          <div class="footer">
            <p>© 2024 Baraem Al Nour Educational Platform. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailText(firstName: string, resetUrl: string): string {
    return `
Hello ${firstName}!

We received a request to reset your password for your Baraem Al Nour Educational Platform account.

If you made this request, visit this link to reset your password:

${resetUrl}

⚠️ Security Notice:
- This link will expire in 24 hours for security reasons
- If you didn't request this password reset, please ignore this email
- Your password will remain unchanged until you visit the link above

© 2024 Baraem Al Nour Educational Platform. All rights reserved.
This is an automated message, please do not reply to this email.
    `;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection test successful');
      return true;
    } catch (error) {
      this.logger.error('SMTP connection test failed:', error);
      return false;
    }
  }
}
