import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../middleware/auth.js';
import { PubSubModule } from '../../redis/modules/pubsub.js';
import logger from '../../utils/logger.js';

export class NotificationHandler {
  private pubsub: PubSubModule;

  constructor(private io: Server) {
    this.pubsub = new PubSubModule();
    this.setupPubSubListeners();
  }

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on('notification_read', (data) => this.handleNotificationRead(socket, data));
    socket.on('notification_preferences', (data) => this.handleNotificationPreferences(socket, data));
  }

  private setupPubSubListeners() {
    // Listen for notification events from Redis pub/sub
    this.pubsub.subscribe('notifications:user', (message) => {
      try {
        const notification = JSON.parse(message);
        this.handleNotificationBroadcast(notification);
      } catch (error) {
        logger.error('Error parsing notification message:', error);
      }
    });

    this.pubsub.subscribe('notifications:workspace', (message) => {
      try {
        const notification = JSON.parse(message);
        this.handleWorkspaceNotification(notification);
      } catch (error) {
        logger.error('Error parsing workspace notification message:', error);
      }
    });
  }

  private handleNotificationBroadcast(notification: { id?: string; userId: string; type: string; title: string; message: string; data: unknown }) {
    const { userId, type, title, message, data } = notification;

    this.io.to(`user:${userId}`).emit('notification', {
      id: notification.id || Date.now(),
      type,
      title,
      message,
      data,
      timestamp: new Date().toISOString(),
      read: false
    });

    logger.debug(`Notification sent to user ${userId}: ${type}`);
  }

  private handleWorkspaceNotification(notification: { id?: string; workspaceId: string; type: string; title: string; message: string; data: unknown; excludeUserId?: string }) {
    const { workspaceId, type, title, message, data, excludeUserId } = notification;

    // Create a broadcast to workspace room
    let broadcast = this.io.to(`workspace:${workspaceId}`);

    // Exclude specific user if specified (e.g., the user who triggered the notification)
    if (excludeUserId) {
      broadcast = broadcast.except(`user:${excludeUserId}`);
    }

    broadcast.emit('workspace_notification', {
      id: notification.id || Date.now(),
      workspaceId,
      type,
      title,
      message,
      data,
      timestamp: new Date().toISOString(),
      read: false
    });

    logger.debug(`Workspace notification sent to workspace ${workspaceId}: ${type}`);
  }

  private async handleNotificationRead(socket: AuthenticatedSocket, data: { notificationId: string }) {
    try {
      const { notificationId } = data;
      const { userId } = socket;

      if (!notificationId) {
        socket.emit('error', { message: 'Notification ID is required' });
        return;
      }

      // You might want to store read status in database or Redis
      // For now, we'll just acknowledge
      socket.emit('notification_read_confirmed', {
        notificationId,
        timestamp: new Date().toISOString()
      });

      // Optionally broadcast to other user's devices
      socket.to(`user:${userId}`).emit('notification_read_sync', {
        notificationId,
        timestamp: new Date().toISOString()
      });

      logger.debug(`Notification ${notificationId} marked as read by user ${userId}`);
    } catch (error) {
      logger.error(`Error marking notification as read for user ${socket.userId}:`, error);
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  private async handleNotificationPreferences(socket: AuthenticatedSocket, data: { preferences: unknown }) {
    try {
      const { preferences } = data;
      const { userId } = socket;

      if (!preferences || typeof preferences !== 'object') {
        socket.emit('error', { message: 'Invalid preferences format' });
        return;
      }

      // Here you would typically save preferences to database
      // For now, we'll just acknowledge
      socket.emit('notification_preferences_updated', {
        preferences,
        timestamp: new Date().toISOString()
      });

      logger.debug(`Notification preferences updated for user ${userId}`);
    } catch (error) {
      logger.error(`Error updating notification preferences for user ${socket.userId}:`, error);
      socket.emit('error', { message: 'Failed to update notification preferences' });
    }
  }

  // Helper method to send notification via Redis pub/sub
  public async sendUserNotification(userId: string, notification: { id?: string; type: string; title: string; message: string; data: unknown }) {
    try {
      await this.pubsub.publish('notifications:user', JSON.stringify({
        userId,
        ...notification
      }));
    } catch (error) {
      logger.error('Error publishing user notification:', error);
    }
  }

  // Helper method to send workspace notification via Redis pub/sub
  public async sendWorkspaceNotification(workspaceId: string, notification: { id?: string; type: string; title: string; message: string; data: unknown }, excludeUserId?: string) {
    try {
      await this.pubsub.publish('notifications:workspace', JSON.stringify({
        workspaceId,
        excludeUserId,
        ...notification
      }));
    } catch (error) {
      logger.error('Error publishing workspace notification:', error);
    }
  }
}
