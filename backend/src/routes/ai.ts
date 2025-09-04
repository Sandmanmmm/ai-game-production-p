import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  generateStory,
  generateAssets,
  generateCode,
  getJobStatus
} from '../controllers/ai';

const router = Router();

// Apply authentication middleware to all AI routes
router.use(authenticateToken);

// Story generation endpoint
router.post('/story', generateStory);

// Asset generation endpoint  
router.post('/assets', generateAssets);

// Job status endpoint for asset generation
router.get('/jobs/:jobId', getJobStatus);

// Code generation endpoint
router.post('/code', generateCode);

export default router;
