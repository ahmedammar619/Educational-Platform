import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      let token = client.handshake.auth?.token;
      
      // If no token in auth, try headers
      if (!token) {
        const authHeader = client.handshake.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.replace('Bearer ', '');
        }
      }
      
      // If still no token, try query parameters
      if (!token) {
        token = client.handshake.query?.token as string;
      }
      
      if (!token) {
        this.logger.warn('Client connected without token');
        client.disconnect();
        return;
      }

      this.logger.debug(`Attempting to verify token: ${token.substring(0, 20)}...`);

      // Verify JWT token with proper options
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
        issuer: 'educational-platform',
        audience: 'educational-platform-users',
        algorithms: ['HS256'],
        clockTolerance: 30,
      });
      
      if (!payload.sub) {
        throw new Error('Invalid token payload: missing sub field');
      }

      client.userId = payload.sub;
      client.userRole = payload.role || 'user';

      // Store connection
      this.connectedUsers.set(client.userId, client.id);
      
      // Join user-specific room
      client.join(`user:${client.userId}`);
      
      // Join role-specific room
      client.join(`role:${client.userRole}`);

      this.logger.log(`User ${client.userId} (${client.userRole}) connected with socket ${client.id}`);

      // Send unread count on connection
      try {
        const unreadCount = await this.notificationsService.getUnreadCount(client.userId);
        client.emit('unread_count', { count: unreadCount });
      } catch (error) {
        this.logger.warn(`Failed to get unread count for user ${client.userId}:`, error.message);
      }

    } catch (error) {
      this.logger.error('Authentication failed for socket connection:', error.message);
      this.logger.debug('Full error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() room: string) {
    if (client.userId) {
      client.join(room);
      this.logger.log(`User ${client.userId} joined room: ${room}`);
    }
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() client: AuthenticatedSocket, @MessageBody() room: string) {
    if (client.userId) {
      client.leave(room);
      this.logger.log(`User ${client.userId} left room: ${room}`);
    }
  }

  @SubscribeMessage('mark_notification_read')
  async handleMarkNotificationRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string }
  ) {
    if (!client.userId) return;

    try {
      await this.notificationsService.update(data.notificationId, client.userId, { isRead: true });
      
      // Update unread count
      const unreadCount = await this.notificationsService.getUnreadCount(client.userId);
      client.emit('unread_count', { count: unreadCount });
      
      this.logger.log(`User ${client.userId} marked notification ${data.notificationId} as read`);
    } catch (error) {
      client.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  // Public methods for sending notifications
  async sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('new_notification', notification);
      
      // Update unread count
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      this.server.to(socketId).emit('unread_count', { count: unreadCount });
      
      this.logger.log(`Sent notification to user ${userId}`);
    }
  }

  async sendNotificationToUsers(userIds: string[], notification: any) {
    const promises = userIds.map(userId => this.sendNotificationToUser(userId, notification));
    await Promise.all(promises);
  }

  async sendNotificationToRole(role: string, notification: any) {
    this.server.to(`role:${role}`).emit('new_notification', notification);
    this.logger.log(`Sent notification to role ${role}`);
  }

  async updateUnreadCountForUser(userId: string) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      this.server.to(socketId).emit('unread_count', { count: unreadCount });
    }
  }

  // Helper method to get connected user count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Helper method to check if user is connected
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}
