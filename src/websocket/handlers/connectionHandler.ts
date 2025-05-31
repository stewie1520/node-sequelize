import type { AuthenticatedSocket } from "../middleware/auth.js";

export class ConnectionHandler {
  public setupHandlers = (socket: AuthenticatedSocket) => {
    const { userId } = socket;

    socket.join(`user:${userId}`);

    socket.on("disconnect", () => {
      socket.leave(`user:${userId}`);
    });

    socket.on("ping", () => {
      socket.emit("pong", { timestamp: new Date().toISOString() });
    });
  };
}
