import type { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../middleware/auth.js';
import logger from '../../utils/logger.js';

export class ConnectionHandler {
  constructor(private io: Server) {}

  public handleConnection = (socket: AuthenticatedSocket) => {
    const { userId, user } = socket;

    logger.info(`User connected: ${user.email} (${userId})`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Successfully connected to WebSocket server',
      userId,
      timestamp: new Date().toISOString()
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${user.email} (${userId}) - Reason: ${reason}`);
      
      // Leave all rooms
      socket.leave(`user:${userId}`);
      
      // Broadcast to other users if needed
      socket.broadcast.emit('user_disconnected', {
        userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    // Handle user status updates
    socket.on('status_update', (data) => {
      this.handleStatusUpdate(socket, data);
    });

    // Join workspace rooms for existing workspaces
    this.joinUserWorkspaces(socket);
  };

  private async joinUserWorkspaces(socket: AuthenticatedSocket) {
    try {
      const { user } = socket;
      
      const workspaces = await user.getWorkspaces();
      
      if (workspaces && workspaces.length > 0) {
        workspaces.forEach(workspace => {
          socket.join(`workspace:${workspace.id}`);
          logger.debug(`User ${user.id} joined workspace room: ${workspace.id}`);
        });

        socket.emit('workspaces_joined', {
          workspaces: workspaces.map(w => ({ id: w.id, name: w.name })),
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error(`Error joining user workspaces for ${socket.userId}:`, error);
    }
  }

  private handleStatusUpdate(socket: AuthenticatedSocket, data: { status: string; message?: string }) {
    try {
      const { userId } = socket;
      const { status, message } = data;

      // Validate status data
      if (!status || typeof status !== 'string') {
        socket.emit('error', { message: 'Invalid status format' });
        return;
      }

      // Broadcast status update to user's contacts/workspaces
      socket.broadcast.emit('user_status_update', {
        userId,
        status,
        message,
        timestamp: new Date().toISOString()
      });

      logger.debug(`Status update from user ${userId}: ${status}`);
    } catch (error) {
      logger.error(`Error handling status update for ${socket.userId}:`, error);
      socket.emit('error', { message: 'Failed to update status' });
    }
  }
}
