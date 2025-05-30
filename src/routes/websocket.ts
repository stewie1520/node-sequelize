import { Hono } from 'hono';
import { RealtimeService } from '../services/RealtimeService.js';

const websocketRouter = new Hono();

// Health check for WebSocket service
websocketRouter.get('/health', async (c) => {
  try {
    const realtimeService = RealtimeService.getInstance();
    
    const connectedUsers = realtimeService.getConnectedUsersCount();
    const isHealthy = realtimeService.isHealthy();
    
    return c.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      websocket: {
        connected_users: connectedUsers,
        server_running: isHealthy
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('WebSocket health check error:', error);
    return c.json({
      status: 'unhealthy',
      error: 'WebSocket service unavailable',
      timestamp: new Date().toISOString()
    }, 503);
  }
});

// Get WebSocket connection statistics
websocketRouter.get('/stats', async (c) => {
  try {
    const realtimeService = RealtimeService.getInstance();
    
    return c.json({
      connected_users: realtimeService.getConnectedUsersCount(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('WebSocket stats error:', error);
    return c.json({
      error: 'Unable to retrieve WebSocket statistics'
    }, 500);
  }
});

// Send test notification (for development/testing)
websocketRouter.post('/test-notification', async (c) => {
  try {
    const { userId, message, type = 'info' } = await c.req.json();
    
    if (!userId || !message) {
      return c.json({
        error: 'userId and message are required'
      }, 400);
    }

    const realtimeService = RealtimeService.getInstance();
    await realtimeService.sendSystemNotification(userId, {
      title: 'Test Notification',
      message,
      type
    });

    return c.json({
      success: true,
      message: 'Test notification sent'
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return c.json({
      error: 'Failed to send test notification'
    }, 500);
  }
});

export default websocketRouter;
