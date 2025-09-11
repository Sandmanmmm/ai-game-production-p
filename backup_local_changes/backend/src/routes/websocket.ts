import { Router } from 'express';
import { webSocketService } from '../services/webSocketService';

const router = Router();

// WebSocket statistics endpoint
router.get('/stats', (req, res) => {
  try {
    const stats = webSocketService.getStats();
    
    res.json({
      success: true,
      data: {
        websocket: stats,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('WebSocket stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get WebSocket stats' }
    });
  }
});

// Test asset generation with progress events (GET)
router.get('/test-asset-progress', async (req, res) => {
  try {
    const testJobId = `test-job-${Date.now()}`;
    
    // Start the test
    webSocketService.emitAssetProgress({
      jobId: testJobId,
      status: 'started',
      progress: 0,
      message: 'Starting asset generation...',
      assetType: 'character',
      prompt: 'A brave knight in shining armor',
      currentStep: 'Initializing',
      totalSteps: 4,
      currentStepIndex: 0,
      timestamp: new Date().toISOString(),
      estimatedTimeRemaining: 30
    });

    // Simulate progress updates
    setTimeout(() => {
      webSocketService.emitAssetProgress({
        jobId: testJobId,
        status: 'processing',
        progress: 25,
        message: 'Analyzing prompt...',
        assetType: 'character',
        prompt: 'A brave knight in shining armor',
        currentStep: 'Prompt Analysis',
        totalSteps: 4,
        currentStepIndex: 1,
        timestamp: new Date().toISOString(),
        estimatedTimeRemaining: 22
      });
    }, 1000);

    setTimeout(() => {
      webSocketService.emitAssetProgress({
        jobId: testJobId,
        status: 'processing',
        progress: 50,
        message: 'Generating base image...',
        assetType: 'character',
        prompt: 'A brave knight in shining armor',
        currentStep: 'Image Generation',
        totalSteps: 4,
        currentStepIndex: 2,
        timestamp: new Date().toISOString(),
        estimatedTimeRemaining: 15
      });
    }, 2000);

    setTimeout(() => {
      webSocketService.emitAssetProgress({
        jobId: testJobId,
        status: 'processing',
        progress: 75,
        message: 'Applying style enhancements...',
        assetType: 'character',
        prompt: 'A brave knight in shining armor',
        currentStep: 'Style Enhancement',
        totalSteps: 4,
        currentStepIndex: 3,
        timestamp: new Date().toISOString(),
        estimatedTimeRemaining: 7
      });
    }, 3000);

    setTimeout(() => {
      webSocketService.emitAssetProgress({
        jobId: testJobId,
        status: 'completed',
        progress: 100,
        message: 'Asset generation complete!',
        assetType: 'character',
        prompt: 'A brave knight in shining armor',
        currentStep: 'Complete',
        totalSteps: 4,
        currentStepIndex: 4,
        timestamp: new Date().toISOString(),
        estimatedTimeRemaining: 0,
        generatedAssets: [
          { id: 'asset-1', url: '/assets/knight-1.png', type: 'character' }
        ]
      });
    }, 4000);

    res.json({
      success: true,
      message: `Asset generation test started with job ID: ${testJobId}`,
      jobId: testJobId
    });
  } catch (error) {
    console.error('Test asset progress error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to start asset generation test' }
    });
  }
});

// Quick test notification endpoint (GET)
router.get('/test-notification', (req, res) => {
  try {
    webSocketService.broadcastSystemMessage({
      title: 'Test Notification',
      message: 'WebSocket service is working correctly!',
      type: 'announcement',
      data: { test: true, timestamp: new Date().toISOString() }
    });

    res.json({
      success: true,
      message: 'Test notification broadcasted to all connected clients',
      stats: webSocketService.getStats()
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send test notification' }
    });
  }
});

// Send test notification endpoint (POST)
router.post('/test-notification', (req, res) => {
  try {
    const { userId, title, message, type = 'info' } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: { message: 'userId, title, and message are required' }
      });
    }

    webSocketService.sendNotification(userId, {
      title,
      message,
      type,
      data: { test: true }
    });

    res.json({
      success: true,
      message: `Test notification sent to user ${userId}`
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send notification' }
    });
  }
});

// Broadcast system message endpoint
router.post('/broadcast', (req, res) => {
  try {
    const { title, message, type = 'announcement' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: { message: 'title and message are required' }
      });
    }

    webSocketService.broadcastSystemMessage({
      title,
      message,
      type,
      data: { broadcast: true }
    });

    res.json({
      success: true,
      message: 'System message broadcasted to all clients'
    });
  } catch (error) {
    console.error('Broadcast message error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to broadcast message' }
    });
  }
});

export default router;
