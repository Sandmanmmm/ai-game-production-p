import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { jobQueueService } from '../services/jobQueue';
import { 
  AssetGenerationJobData, 
  StylePackTrainingJobData, 
  QUEUE_NAMES 
} from '../types/jobQueue';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Validation middleware
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// POST /api/jobs/generate-assets - Create asset generation job
router.post('/generate-assets', [
  authenticateToken,
  body('prompt').isString().isLength({ min: 1, max: 1000 }),
  body('projectId').isString(),
  body('assetType').isIn(['character-design', 'environment-art', 'prop-design', 'ui-element', 'concept-art']),
  body('options.batchSize').isInt({ min: 1, max: 10 }),
  body('options.dimensions.width').isInt({ min: 64, max: 2048 }),
  body('options.dimensions.height').isInt({ min: 64, max: 2048 }),
  body('options.quality').isIn(['draft', 'standard', 'high']),
  body('options.format').isIn(['png', 'webp', 'svg']),
  body('options.variations').isInt({ min: 1, max: 5 }),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { prompt, projectId, assetType, stylePackId, options, metadata } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const jobData: AssetGenerationJobData = {
      id: uuidv4(),
      projectId,
      userId,
      prompt,
      stylePackId,
      assetType,
      options,
      metadata,
      createdAt: new Date()
    };

    const job = await jobQueueService.addAssetGenerationJob(jobData);

    res.json({
      success: true,
      message: 'Asset generation job created successfully',
      data: {
        jobId: job.id,
        queueName: QUEUE_NAMES.ASSET_GENERATION,
        status: 'waiting',
        estimatedTime: Math.ceil(options.batchSize * 1.5), // minutes
        createdAt: jobData.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating asset generation job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create asset generation job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/jobs/train-style-pack - Create style pack training job
router.post('/train-style-pack', [
  authenticateToken,
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('projectId').isString(),
  body('referenceImages').isArray({ min: 5, max: 50 }),
  body('baseModel').isIn(['SDXL', 'SD1.5', 'custom']),
  body('trainingConfig.steps').isInt({ min: 100, max: 2000 }),
  body('trainingConfig.learningRate').isFloat({ min: 0.0001, max: 0.01 }),
  body('trainingConfig.batchSize').isInt({ min: 1, max: 8 }),
  body('trainingConfig.resolution').isInt({ min: 512, max: 1024 }),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { name, description, projectId, referenceImages, baseModel, trainingConfig } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const jobData: StylePackTrainingJobData = {
      id: uuidv4(),
      projectId,
      userId,
      name,
      description,
      referenceImages,
      baseModel,
      trainingConfig,
      createdAt: new Date()
    };

    const job = await jobQueueService.addStylePackTrainingJob(jobData);

    res.json({
      success: true,
      message: 'Style pack training job created successfully',
      data: {
        jobId: job.id,
        queueName: QUEUE_NAMES.STYLE_PACK_TRAINING,
        status: 'waiting',
        estimatedTime: Math.ceil(trainingConfig.steps / 10), // minutes
        createdAt: jobData.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating style pack training job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create style pack training job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/jobs/:queueName/:jobId/status - Get job status and progress
router.get('/:queueName/:jobId/status', [
  authenticateToken,
  param('queueName').isIn(Object.values(QUEUE_NAMES)),
  param('jobId').isString(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { queueName, jobId } = req.params;

    const status = await jobQueueService.getJobStatus(
      jobId, 
      queueName as any
    );

    res.json({
      success: true,
      data: {
        jobId,
        queueName,
        ...status
      }
    });

  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(404).json({
      success: false,
      message: 'Job not found or error retrieving status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/jobs/:queueName/:jobId - Cancel a job
router.delete('/:queueName/:jobId', [
  authenticateToken,
  param('queueName').isIn(Object.values(QUEUE_NAMES)),
  param('jobId').isString(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { queueName, jobId } = req.params;

    await jobQueueService.cancelJob(
      jobId, 
      queueName as any
    );

    res.json({
      success: true,
      message: 'Job cancelled successfully',
      data: { jobId, queueName }
    });

  } catch (error) {
    console.error('Error cancelling job:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to cancel job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/jobs/queues/stats - Get stats for all queues
router.get('/queues/stats', [
  authenticateToken
], async (req: Request, res: Response) => {
  try {
    const stats: any = {};
    
    for (const queueName of Object.values(QUEUE_NAMES)) {
      stats[queueName] = await jobQueueService.getQueueStats(queueName);
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/jobs/queues/clean - Clean old jobs from queues
router.post('/queues/clean', [
  authenticateToken,
  query('maxAge').optional().isInt({ min: 3600000 }), // minimum 1 hour
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const maxAge = parseInt(req.query.maxAge as string) || 24 * 60 * 60 * 1000; // 24 hours default

    const cleanResults: any = {};
    
    for (const queueName of Object.values(QUEUE_NAMES)) {
      await jobQueueService.cleanQueue(queueName, maxAge);
      cleanResults[queueName] = 'cleaned';
    }

    res.json({
      success: true,
      message: 'Queues cleaned successfully',
      data: cleanResults
    });

  } catch (error) {
    console.error('Error cleaning queues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean queues',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
