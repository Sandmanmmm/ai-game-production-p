import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { llmOrchestrator } from '../services/llmOrchestrator';
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

// POST /api/orchestrator/process - Main entry point for processing user requests
router.post('/process', [
  authenticateToken,
  body('request').isString().isLength({ min: 1, max: 2000 }),
  body('projectId').isString().isUUID(),
  body('conversationHistory').optional().isArray(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { request, projectId, conversationHistory = [] } = req.body;
    const userId = (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log(`🎯 Orchestrator processing: "${request}" for project ${projectId}`);

    const result = await llmOrchestrator.processUserRequest(
      request,
      userId,
      projectId,
      conversationHistory
    );

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: {
        ...result.metadata,
        requestId: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in orchestrator process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/orchestrator/project/:projectId/context - Get project context
router.get('/project/:projectId/context', [
  authenticateToken,
  param('projectId').isUUID(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    const context = await llmOrchestrator.getProjectContext(projectId);
    
    if (!context) {
      return res.status(404).json({
        success: false,
        message: 'Project context not found'
      });
    }

    res.json({
      success: true,
      data: context
    });

  } catch (error) {
    console.error('Error getting project context:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project context',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/orchestrator/project/:projectId/context - Update project context
router.put('/project/:projectId/context', [
  authenticateToken,
  param('projectId').isUUID(),
  body('name').isString().isLength({ min: 1, max: 200 }),
  body('description').isString().isLength({ min: 1, max: 1000 }),
  body('gameType').isString().isLength({ min: 1, max: 100 }),
  body('artStyle').isString().isLength({ min: 1, max: 100 }),
  body('targetPlatform').isArray(),
  body('technicalStack').isArray(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const contextData = req.body;

    // Build project context from request
    const context = {
      id: projectId,
      ...contextData,
      assets: contextData.assets || { characters: [], environments: [], props: [], ui: [] },
      styleGuides: contextData.styleGuides || [],
      codebase: contextData.codebase || { languages: [], frameworks: [], architecture: '' },
      timeline: contextData.timeline || { milestones: [] }
    };

    await llmOrchestrator.updateProjectContext(context);

    res.json({
      success: true,
      message: 'Project context updated successfully',
      data: { projectId }
    });

  } catch (error) {
    console.error('Error updating project context:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project context',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/orchestrator/intent/parse - Parse user intent (for testing/debugging)
router.post('/intent/parse', [
  authenticateToken,
  body('request').isString().isLength({ min: 1, max: 1000 }),
  body('projectId').optional().isString().isUUID(),
  handleValidationErrors
], async (req: Request, res: Response) => {
  try {
    const { request, projectId } = req.body;

    // This would use the intent parser directly for testing
    const { intentParser } = await import('../services/intentParser');
    const intent = await intentParser.parseUserIntent(request, projectId);

    res.json({
      success: true,
      data: intent
    });

  } catch (error) {
    console.error('Error parsing intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse intent',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/orchestrator/tools/available - Get available tools and their schemas
router.get('/tools/available', [
  authenticateToken
], async (req: Request, res: Response) => {
  try {
    const tools = {
      generate_assets: {
        name: 'Generate Assets',
        description: 'Generate game assets using AI',
        schema: {
          subject: 'string - What to generate (e.g., "warrior")',
          type: 'enum - Asset type (sprite, icon, tileset, portrait, concept, ui-element, prop)',
          count: 'number - How many to generate (1-64)',
          size: 'enum - Dimensions (64x64, 128x128, 256x256, 512x512, 1024x1024)',
          style: 'enum - Art style (pixel-art, hand-drawn, realistic, cartoon, minimalist)',
          transparent: 'boolean - Transparent background',
          format: 'enum - File format (png, webp, svg)'
        },
        examples: [
          'Generate 5 warrior sprites in pixel art style',
          'Create a 256x256 castle tileset',
          'Make 3 health potion icons'
        ]
      },
      create_style_pack: {
        name: 'Create Style Pack',
        description: 'Train a custom art style from reference images',
        schema: {
          name: 'string - Style pack name',
          description: 'string - Description of the style',
          referenceImages: 'array - URLs of reference images (5-50)',
          baseModel: 'enum - Base model (SDXL, SD1.5, custom)',
          trainingConfig: 'object - Training parameters'
        },
        examples: [
          'Train a style pack from my concept art',
          'Create a custom anime style pack'
        ]
      },
      scaffold_code: {
        name: 'Scaffold Code',
        description: 'Generate code scaffolding and components',
        schema: {
          type: 'enum - Code type (component, system, script, shader, config)',
          language: 'enum - Programming language',
          framework: 'enum - Framework (react, vue, unity, godot, phaser)',
          description: 'string - What to create',
          requirements: 'array - Specific requirements',
          dependencies: 'array - Required dependencies'
        },
        examples: [
          'Create a React component for inventory management',
          'Generate a Unity script for player movement',
          'Scaffold a Phaser game scene'
        ]
      },
      summarize_docs: {
        name: 'Summarize Documents',
        description: 'Summarize project documents and notes',
        schema: {
          documentIds: 'array - Document IDs to summarize',
          summaryType: 'enum - Summary type (overview, technical, requirements, changes)',
          maxLength: 'number - Maximum summary length (100-2000 words)'
        },
        examples: [
          'Summarize the game design document',
          'Give me a technical overview of the architecture',
          'Summarize recent changes to requirements'
        ]
      }
    };

    res.json({
      success: true,
      data: tools
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get available tools',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
