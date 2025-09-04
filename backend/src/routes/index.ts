import { Router } from 'express';
import projectRoutes from './projects';
import authRoutes from './auth';
import oauthRoutes from './oauth';
import aiRoutes from './ai';
import jobRoutes from './jobs';
import orchestratorRoutes from './orchestrator';
import websocketRoutes from './websocket';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GameForge API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/auth', oauthRoutes); // OAuth routes under /auth
router.use('/projects', projectRoutes);
router.use('/ai', aiRoutes);
router.use('/jobs', jobRoutes);
router.use('/orchestrator', orchestratorRoutes);
router.use('/websocket', websocketRoutes);

export default router;
