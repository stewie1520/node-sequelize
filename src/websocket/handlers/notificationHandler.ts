import type { Server } from "socket.io";
import { PubSubModule } from "../../redis/modules/pubsub.js";
import logger from "../../utils/logger.js";

export class NotificationHandler {
  private pubsub: PubSubModule;

  constructor(private readonly io: Server) {
    this.pubsub = new PubSubModule();
  }

  public setupPubSubListeners() {
    this.pubsub.subscribe("notifications:user", (message) => {
      try {
        const notification = JSON.parse(message);
        this.handleNotificationBroadcast(notification);
      } catch (error) {
        logger.error("Error parsing notification message:", error);
      }
    });

    this.pubsub.subscribe("notifications:workspace", (message) => {
      try {
        const notification = JSON.parse(message);
        this.handleWorkspaceNotification(notification);
      } catch (error) {
        logger.error("Error parsing workspace notification message:", error);
      }
    });
  }

  private handleNotificationBroadcast(notification: {
    id?: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data: unknown;
  }) {
    const { userId, type, title, message, data } = notification;

    this.io.to(`user:${userId}`).emit("notification", {
      id: notification.id || Date.now(),
      type,
      title,
      message,
      data,
      timestamp: new Date().toISOString(),
      read: false,
    });

    logger.debug(`Notification sent to user ${userId}: ${type}`);
  }

  private handleWorkspaceNotification(notification: {
    id?: string;
    workspaceId: string;
    type: string;
    title: string;
    message: string;
    data: unknown;
    excludeUserId?: string;
  }) {
    const { workspaceId, type, title, message, data, excludeUserId } =
      notification;

    // Create a broadcast to workspace room
    let broadcast = this.io.to(`workspace:${workspaceId}`);

    // Exclude specific user if specified (e.g., the user who triggered the notification)
    if (excludeUserId) {
      broadcast = broadcast.except(`user:${excludeUserId}`);
    }

    broadcast.emit("workspace_notification", {
      id: notification.id || Date.now(),
      workspaceId,
      type,
      title,
      message,
      data,
      timestamp: new Date().toISOString(),
      read: false,
    });

    logger.debug(
      `Workspace notification sent to workspace ${workspaceId}: ${type}`,
    );
  }
}
