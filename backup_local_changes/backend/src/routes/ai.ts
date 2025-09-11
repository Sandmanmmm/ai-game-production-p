import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import {
  generateStory,
  generateAssets,
  generateCode,
  getJobStatus
} from '../controllers/ai';

const router = Router();

// Apply optional authentication for development testing
// In production, change back to authenticateToken
const authMiddleware = process.env.NODE_ENV === 'development' ? optionalAuth : authenticateToken;
router.use(authMiddleware);

// Story generation endpoint
router.post('/story', generateStory);

// Asset generation endpoint  
router.post('/assets', generateAssets);

// Job status endpoint for asset generation
router.get('/jobs/:jobId', getJobStatus);

// Code generation endpoint
router.post('/code', generateCode);

export default router;
