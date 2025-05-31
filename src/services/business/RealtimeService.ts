import { SocketService } from "../../websocket/SocketService.js";
import { NotificationHandler } from "../../websocket/handlers/notificationHandler.js";
import { PubSubModule } from "../../redis/modules/pubsub.js";
import logger from "../../utils/logger.js";

interface UserData {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

interface WorkspaceData {
  id?: string;
  name?: string;
  description?: string;
  [key: string]: unknown;
}

interface ActivityData {
  type: string;
  action: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface NotificationData {
  type?: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  [key: string]: unknown;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private socketService: SocketService;
  private notificationHandler: NotificationHandler | null = null;
  private pubsub: PubSubModule;

  private constructor() {
    this.socketService = SocketService.getInstance();
    this.pubsub = new PubSubModule();
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  public setNotificationHandler(handler: NotificationHandler): void {
    this.notificationHandler = handler;
  }

  // User-related real-time events
  public async notifyUserCreated(
    userId: string,
    userData: UserData,
  ): Promise<void> {
    try {
      await this.socketService.emitToUser(userId, "profile_updated", {
        type: "user_created",
        data: userData,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`User creation notification sent to ${userId}`);
    } catch (error) {
      logger.error("Error sending user creation notification:", error);
    }
  }

  public async notifyUserUpdated(
    userId: string,
    userData: UserData,
  ): Promise<void> {
    try {
      await this.socketService.emitToUser(userId, "profile_updated", {
        type: "user_updated",
        data: userData,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`User update notification sent to ${userId}`);
    } catch (error) {
      logger.error("Error sending user update notification:", error);
    }
  }

  // Workspace-related real-time events
  public async notifyWorkspaceCreated(
    workspaceId: string,
    creatorId: string,
    workspaceData: WorkspaceData,
  ): Promise<void> {
    try {
      await this.socketService.emitToUser(creatorId, "workspace_created", {
        workspaceId,
        data: workspaceData,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Workspace creation notification sent to user ${creatorId}`);
    } catch (error) {
      logger.error("Error sending workspace creation notification:", error);
    }
  }

  public async notifyWorkspaceUpdated(
    workspaceId: string,
    updatedBy: string,
    updateData: WorkspaceData,
  ): Promise<void> {
    try {
      await this.socketService.emitToWorkspace(
        workspaceId,
        "workspace_updated",
        {
          updatedBy,
          data: updateData,
          timestamp: new Date().toISOString(),
        },
      );

      // Also send notification via Redis pub/sub for cross-server compatibility
      if (this.notificationHandler) {
        await this.notificationHandler.sendWorkspaceNotification(
          workspaceId,
          {
            type: "workspace_updated",
            title: "Workspace Updated",
            message: "A workspace you're part of has been updated",
            data: updateData,
          },
          updatedBy,
        );
      }

      logger.debug(
        `Workspace update notification sent to workspace ${workspaceId}`,
      );
    } catch (error) {
      logger.error("Error sending workspace update notification:", error);
    }
  }

  public async notifyWorkspaceDeleted(
    workspaceId: string,
    deletedBy: string,
  ): Promise<void> {
    try {
      await this.socketService.emitToWorkspace(
        workspaceId,
        "workspace_deleted",
        {
          workspaceId,
          deletedBy,
          timestamp: new Date().toISOString(),
        },
      );

      logger.debug(
        `Workspace deletion notification sent to workspace ${workspaceId}`,
      );
    } catch (error) {
      logger.error("Error sending workspace deletion notification:", error);
    }
  }

  // Activity tracking
  public async trackUserActivity(
    userId: string,
    workspaceId: string,
    activity: ActivityData,
  ): Promise<void> {
    try {
      const activityData = {
        userId,
        workspaceId,
        activity: {
          ...activity,
          timestamp: new Date().toISOString(),
        },
      };

      // Emit to workspace members
      await this.socketService.emitToWorkspace(
        workspaceId,
        "user_activity",
        activityData,
      );

      // Store activity in Redis for analytics (optional)
      await this.pubsub.publish("activity_log", JSON.stringify(activityData));

      logger.debug(
        `Activity tracked for user ${userId} in workspace ${workspaceId}`,
      );
    } catch (error) {
      logger.error("Error tracking user activity:", error);
    }
  }

  // System notifications
  public async sendSystemNotification(
    userId: string,
    notification: NotificationData,
  ): Promise<void> {
    try {
      if (this.notificationHandler) {
        await this.notificationHandler.sendUserNotification(userId, {
          ...notification,
          type: notification.type || "system",
        });
      }

      logger.debug(`System notification sent to user ${userId}`);
    } catch (error) {
      logger.error("Error sending system notification:", error);
    }
  }

  public async broadcastSystemMessage(
    message: string,
    type: string = "info",
  ): Promise<void> {
    try {
      await this.socketService.broadcastToAll("system_message", {
        type,
        message,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`System message broadcasted: ${message}`);
    } catch (error) {
      logger.error("Error broadcasting system message:", error);
    }
  }

  // Connection management
  public async disconnectUser(userId: string, reason?: string): Promise<void> {
    try {
      await this.socketService.disconnectUser(userId);

      if (reason) {
        logger.info(`User ${userId} disconnected: ${reason}`);
      }
    } catch (error) {
      logger.error(`Error disconnecting user ${userId}:`, error);
    }
  }

  public getConnectedUsersCount(): number {
    return this.socketService.getConnectedUsers();
  }

  // Health check for WebSocket service
  public isHealthy(): boolean {
    try {
      return this.socketService.getConnectedUsers() >= 0;
    } catch {
      return false;
    }
  }
}
