import type { Socket } from "socket.io";
import logger from "../../utils/logger.js";
import { User } from "../../models/User.js";
import JwtService from "../../services/platform/JwtService.js";

export interface AuthenticatedSocket extends Socket {
  userId: string;
  user: User;
}

export const authenticateSocket = async (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    // Extract token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      logger.warn(
        `Socket connection rejected: No token provided (${socket.id})`,
      );
      return next(new Error("Authentication token required"));
    }

    // Verify the JWT token
    const decoded = await JwtService.verifyToken(token as string);
    if (!decoded || typeof decoded === "string") {
      logger.warn(`Socket connection rejected: Invalid token (${socket.id})`);
      return next(new Error("Invalid authentication token"));
    }

    // Fetch user from database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      logger.warn(`Socket connection rejected: User not found (${socket.id})`);
      return next(new Error("User not found"));
    }

    // Attach user info to socket
    (socket as AuthenticatedSocket).userId = user.id;
    (socket as AuthenticatedSocket).user = user;

    logger.info(`Socket authenticated for user ${user.id} (${user.email})`);
    next();
  } catch (error) {
    logger.error(`Socket authentication error (${socket.id}):`, error);
    next(new Error("Authentication failed"));
  }
};
