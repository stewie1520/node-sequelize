import type { Server } from "socket.io";
import { Workspace } from "../../models/Workspace.js";
import logger from "../../utils/logger.js";
import type { AuthenticatedSocket } from "../middleware/auth.js";

export class WorkspaceHandler {
  constructor(private readonly io: Server) {}

  public setupHandlers(socket: AuthenticatedSocket) {
    socket.on("join_workspace", (data) =>
      this.handleJoinWorkspace(socket, data),
    );
    socket.on("leave_workspace", (data) =>
      this.handleLeaveWorkspace(socket, data),
    );
    socket.on("workspace_update", (data) =>
      this.handleWorkspaceUpdate(socket, data),
    );
    socket.on("workspace_activity", (data) =>
      this.handleWorkspaceActivity(socket, data),
    );
  }

  private async handleJoinWorkspace(
    socket: AuthenticatedSocket,
    data: { workspaceId: string },
  ) {
    try {
      const { workspaceId } = data;
      const { userId, user } = socket;

      if (!workspaceId) {
        socket.emit("error", { message: "Workspace ID is required" });
        return;
      }

      const workspace = await Workspace.findOne({
        where: {
          id: workspaceId,
          authorId: userId,
        },
      });

      if (!workspace) {
        socket.emit("error", {
          message: "Workspace not found or access denied",
        });
        return;
      }

      // Join workspace room
      socket.join(`workspace:${workspaceId}`);

      // Notify other workspace members
      socket.to(`workspace:${workspaceId}`).emit("user_joined_workspace", {
        userId,
        userName: user.name,
        workspaceId,
        timestamp: new Date().toISOString(),
      });

      // Confirm join to user
      socket.emit("workspace_joined", {
        workspaceId,
        workspaceName: workspace.name,
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${userId} joined workspace ${workspaceId}`);
    } catch (error) {
      logger.error(`Error joining workspace for user ${socket.userId}:`, error);
      socket.emit("error", { message: "Failed to join workspace" });
    }
  }

  private async handleLeaveWorkspace(
    socket: AuthenticatedSocket,
    data: { workspaceId: string },
  ) {
    try {
      const { workspaceId } = data;
      const { userId, user } = socket;

      if (!workspaceId) {
        socket.emit("error", { message: "Workspace ID is required" });
        return;
      }

      // Leave workspace room
      socket.leave(`workspace:${workspaceId}`);

      // Notify other workspace members
      socket.to(`workspace:${workspaceId}`).emit("user_left_workspace", {
        userId,
        userName: user.name,
        workspaceId,
        timestamp: new Date().toISOString(),
      });

      // Confirm leave to user
      socket.emit("workspace_left", {
        workspaceId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${userId} left workspace ${workspaceId}`);
    } catch (error) {
      logger.error(`Error leaving workspace for user ${socket.userId}:`, error);
      socket.emit("error", { message: "Failed to leave workspace" });
    }
  }

  private async handleWorkspaceUpdate(
    socket: AuthenticatedSocket,
    data: { workspaceId: string; updateType: string; updateData: unknown },
  ) {
    try {
      const { workspaceId, updateType, updateData } = data;
      const { userId, user } = socket;

      if (!workspaceId || !updateType) {
        socket.emit("error", {
          message: "Workspace ID and update type are required",
        });
        return;
      }

      // Verify user has permission to update workspace
      const workspace = await Workspace.findOne({
        where: {
          id: workspaceId,
          authorId: userId, // Adjust based on your permission logic
        },
      });

      if (!workspace) {
        socket.emit("error", {
          message: "Workspace not found or permission denied",
        });
        return;
      }

      // Broadcast update to all workspace members
      this.io.to(`workspace:${workspaceId}`).emit("workspace_updated", {
        workspaceId,
        updateType,
        updateData,
        updatedBy: {
          id: userId,
          name: user.name,
        },
        timestamp: new Date().toISOString(),
      });

      logger.info(
        `Workspace ${workspaceId} updated by user ${userId}: ${updateType}`,
      );
    } catch (error) {
      logger.error(
        `Error updating workspace for user ${socket.userId}:`,
        error,
      );
      socket.emit("error", { message: "Failed to update workspace" });
    }
  }

  private handleWorkspaceActivity(
    socket: AuthenticatedSocket,
    data: { workspaceId: string; activity: { type: string; details: unknown } },
  ) {
    try {
      const { workspaceId, activity } = data;
      const { userId, user } = socket;

      if (!workspaceId || !activity) {
        socket.emit("error", {
          message: "Workspace ID and activity are required",
        });
        return;
      }

      // Broadcast activity to workspace members (excluding sender)
      socket.to(`workspace:${workspaceId}`).emit("workspace_activity", {
        workspaceId,
        activity: {
          ...activity,
          user: {
            id: userId,
            name: user.name,
          },
          timestamp: new Date().toISOString(),
        },
      });

      logger.debug(
        `Workspace activity from user ${userId} in workspace ${workspaceId}: ${activity.type}`,
      );
    } catch (error) {
      logger.error(
        `Error handling workspace activity for user ${socket.userId}:`,
        error,
      );
      socket.emit("error", { message: "Failed to process workspace activity" });
    }
  }
}
