import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

export interface ProgressEvent {
  jobId: string;
  status: 'started' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  message?: string;
  data?: any;
  timestamp: string;
  estimatedTimeRemaining?: number; // seconds
}

export interface AssetGenerationProgress extends ProgressEvent {
  assetType: string;
  prompt: string;
  currentStep?: string;
  totalSteps?: number;
  currentStepIndex?: number;
  generatedAssets?: any[];
}

export interface StyleTrainingProgress extends ProgressEvent {
  trainingStep?: number;
  totalTrainingSteps?: number;
  loss?: number;
  learningRate?: number;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, Socket> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          'http://localhost:5000',
          'http://localhost:5173',
          'http://localhost:3000',
          process.env.FRONTEND_URL || 'http://localhost:5000'
        ],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    this.setupEventHandlers();
    console.log('🔌 WebSocket server initialized');
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id;
      this.connectedClients.set(clientId, socket);
      
      console.log(`🔗 Client connected: ${clientId}`);
      
      // Send welcome message
      socket.emit('connected', {
        clientId,
        timestamp: new Date().toISOString(),
        message: 'WebSocket connection established'
      });

      // Handle client authentication
      socket.on('authenticate', (data: { userId?: string; sessionId?: string }) => {
        console.log(`🔐 Client ${clientId} authenticating:`, data);
        socket.join(`user_${data.userId || 'anonymous'}`);
        socket.emit('authenticated', { success: true, clientId });
      });

      // Handle job subscription
      socket.on('subscribe_job', (jobId: string) => {
        console.log(`📋 Client ${clientId} subscribing to job: ${jobId}`);
        socket.join(`job_${jobId}`);
        socket.emit('subscribed', { jobId, clientId });
      });

      // Handle job unsubscription
      socket.on('unsubscribe_job', (jobId: string) => {
        console.log(`📋 Client ${clientId} unsubscribing from job: ${jobId}`);
        socket.leave(`job_${jobId}`);
        socket.emit('unsubscribed', { jobId, clientId });
      });

      // Handle project subscription
      socket.on('subscribe_project', (projectId: string) => {
        console.log(`📁 Client ${clientId} subscribing to project: ${projectId}`);
        socket.join(`project_${projectId}`);
        socket.emit('subscribed', { projectId, clientId });
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        console.log(`🔌 Client ${clientId} disconnected: ${reason}`);
        this.connectedClients.delete(clientId);
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        console.error(`❌ Socket error for ${clientId}:`, error);
      });
    });
  }

  /**
   * Emit asset generation progress to subscribers
   */
  emitAssetProgress(progress: AssetGenerationProgress): void {
    if (!this.io) return;

    console.log(`📤 Emitting asset progress for job ${progress.jobId}:`, {
      status: progress.status,
      progress: progress.progress,
      message: progress.message
    });

    // Emit to job subscribers
    this.io.to(`job_${progress.jobId}`).emit('asset_progress', progress);

    // Also emit to general progress channel for monitoring
    this.io.emit('progress_update', {
      type: 'asset_generation',
      ...progress
    });
  }

  /**
   * Emit style training progress to subscribers
   */
  emitStyleTrainingProgress(progress: StyleTrainingProgress): void {
    if (!this.io) return;

    console.log(`📤 Emitting style training progress for job ${progress.jobId}:`, {
      status: progress.status,
      progress: progress.progress,
      trainingStep: progress.trainingStep
    });

    this.io.to(`job_${progress.jobId}`).emit('style_training_progress', progress);
    this.io.emit('progress_update', {
      type: 'style_training',
      ...progress
    });
  }

  /**
   * Emit general progress update
   */
  emitProgress(progress: ProgressEvent): void {
    if (!this.io) return;

    console.log(`📤 Emitting general progress for job ${progress.jobId}:`, {
      status: progress.status,
      progress: progress.progress
    });

    this.io.to(`job_${progress.jobId}`).emit('progress', progress);
    this.io.emit('progress_update', progress);
  }

  /**
   * Send notification to specific user
   */
  sendNotification(userId: string, notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    data?: any;
  }): void {
    if (!this.io) return;

    console.log(`📬 Sending notification to user ${userId}:`, notification);

    this.io.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast system message to all clients
   */
  broadcastSystemMessage(message: {
    title: string;
    message: string;
    type: 'maintenance' | 'update' | 'announcement';
    data?: any;
  }): void {
    if (!this.io) return;

    console.log('📢 Broadcasting system message:', message);

    this.io.emit('system_message', {
      ...message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send message to specific project subscribers
   */
  sendProjectUpdate(projectId: string, update: {
    type: 'asset_added' | 'asset_updated' | 'project_updated' | 'collaboration';
    data: any;
  }): void {
    if (!this.io) return;

    console.log(`📁 Sending project update for ${projectId}:`, update);

    this.io.to(`project_${projectId}`).emit('project_update', {
      projectId,
      ...update,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    connectedClients: number;
    rooms: string[];
    clientIds: string[];
  } {
    return {
      connectedClients: this.connectedClients.size,
      rooms: this.io ? Array.from(this.io.sockets.adapter.rooms.keys()) : [],
      clientIds: Array.from(this.connectedClients.keys())
    };
  }

  /**
   * Gracefully shutdown WebSocket server
   */
  shutdown(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.io) {
        resolve();
        return;
      }

      console.log('🔌 Shutting down WebSocket server...');
      
      // Send shutdown notice to all clients
      this.io.emit('server_shutdown', {
        message: 'Server is shutting down',
        timestamp: new Date().toISOString()
      });

      // Close all connections
      this.io.close(() => {
        console.log('🔌 WebSocket server shutdown complete');
        this.io = null;
        this.connectedClients.clear();
        resolve();
      });
    });
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
