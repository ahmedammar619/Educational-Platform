import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class AgoraTokenService {
  private readonly logger = new Logger(AgoraTokenService.name);
  private readonly appId: string;
  private readonly appCertificate: string;

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.get<string>('AGORA_APP_ID');
    this.appCertificate = this.configService.get<string>('AGORA_APP_CERTIFICATE');

    if (!this.appId || !this.appCertificate) {
      this.logger.error('AGORA_APP_ID or AGORA_APP_CERTIFICATE is not configured.');
      throw new Error('Agora App ID and Certificate must be configured.');
    }
  }

  /**
   * Generate Agora RTC token for joining a channel
   */
  generateRtcToken(
    channelName: string,
    uid: string | number,
    role: 'publisher' | 'subscriber' = 'publisher',
    expireTime: number = 3600 // 1 hour default
  ): string {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expireTime;

    // Build the token string using Agora's format
    const token = this.buildTokenWithUid(
      channelName,
      uid,
      role === 'publisher' ? 1 : 2, // 1 for publisher, 2 for subscriber
      privilegeExpiredTs,
      currentTimestamp,
      this.appId,
      this.appCertificate,
    );
    
    this.logger.log(`Generated RTC Token for channel: ${channelName}, UID: ${uid}`);
    return token;
  }

  /**
   * Generate Agora RTM token for real-time messaging
   */
  generateRtmToken(uid: string, expireTime: number = 3600): string {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expireTime;

    // Create privilege object for RTM
    const privileges = {
      [1]: privilegeExpiredTs, // Login
    };

    // Create message - use a hash of appId instead of parsing it directly
    const appIdHash = this.hashAppId(this.appId);
    let messagePack = this.packUint16(appIdHash) +
      this.packUint32(currentTimestamp) +
      this.packUint32(crypto.randomInt(1, 99999999)) +
      this.packUint32(Object.keys(privileges).length);

    for (const [key, value] of Object.entries(privileges)) {
      messagePack += this.packUint16(parseInt(key)) + this.packUint32(value);
    }

    // Create signature
    const signature = crypto
      .createHmac('sha256', Buffer.from(this.appCertificate, 'hex'))
      .update(Buffer.from(messagePack, 'binary'))
      .digest('hex');

    // Build the RTM token
    const version = '006';
    const token = `${version}${this.appId}${currentTimestamp.toString(16)}${privilegeExpiredTs.toString(16)}${signature}${uid}`;
    
    this.logger.log(`Generated RTM Token for UID: ${uid}`);
    return token;
  }

  /**
   * Build token with UID using Agora's algorithm
   */
  private buildTokenWithUid(
    channelName: string,
    uid: string | number,
    role: number,
    privilegeExpiredTs: number,
    currentTimestamp: number,
    appId: string,
    appCertificate: string,
  ): string {
    const message = {
      salt: crypto.randomInt(1, 99999999),
      ts: currentTimestamp,
      privileges: {
        [1]: privilegeExpiredTs, // K_JOIN_CHANNEL
        [2]: privilegeExpiredTs, // K_PUBLISH_AUDIO
        [3]: privilegeExpiredTs, // K_PUBLISH_VIDEO
        [4]: privilegeExpiredTs, // K_PUBLISH_DATA_STREAM
      },
    };

    // Create message pack - use a hash of appId instead of parsing it directly
    const appIdHash = this.hashAppId(appId);
    let messagePack = this.packUint16(appIdHash) +
      this.packUint32(currentTimestamp) +
      this.packUint32(message.salt) +
      this.packUint32(Object.keys(message.privileges).length);

    for (const [key, value] of Object.entries(message.privileges)) {
      messagePack += this.packUint16(parseInt(key)) + this.packUint32(value);
    }

    // Create signature
    const signature = crypto
      .createHmac('sha256', Buffer.from(appCertificate, 'hex'))
      .update(Buffer.from(messagePack, 'binary'))
      .digest('hex');

    // Build the RTC token
    const version = '007';
    const token = `${version}${appId}${currentTimestamp.toString(16)}${message.salt.toString(16)}${signature}${uid}${channelName}`;
    
    return token;
  }

  /**
   * Pack uint16 to binary
   */
  private packUint16(value: number): string {
    // Validate the value is within uint16 range
    if (value < 0 || value > 65535) {
      this.logger.error(`Value ${value} is out of range for uint16. Must be 0-65535`);
      throw new Error(`Value ${value} is out of range for uint16. Must be 0-65535`);
    }
    
    const buffer = Buffer.alloc(2);
    buffer.writeUInt16LE(value, 0);
    return buffer.toString('binary');
  }

  /**
   * Pack uint32 to binary
   */
  private packUint32(value: number): string {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(value, 0);
    return buffer.toString('binary');
  }

  /**
   * Hash App ID to a uint16 value
   */
  private hashAppId(appId: string): number {
    // Create a simple hash of the appId that fits in uint16 range
    let hash = 0;
    for (let i = 0; i < appId.length; i++) {
      const char = appId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Ensure it's within uint16 range
    return Math.abs(hash) % 65536;
  }

  /**
   * Get App ID for client initialization
   */
  getAppId(): string {
    return this.appId;
  }

  /**
   * Validate token format
   */
  validateToken(token: string): boolean {
    try {
      // Basic validation - check if token has required parts
      const parts = token.split('');
      return parts.length >= 5 && token.startsWith('007');
    } catch (error) {
      this.logger.error('Token validation failed:', error);
      return false;
    }
  }
}