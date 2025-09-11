import { Router } from 'express';
import { body, param } from 'express-validator';
import { ProjectController } from '../controllers/projectController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Validation rules
const createProjectValidation = [
  body('title').notEmpty().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).withMessage('Invalid status'),
];

const updateProjectValidation = [
  param('id').notEmpty().withMessage('Project ID is required'),
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).withMessage('Invalid status'),
];

const projectIdValidation = [
  param('id').notEmpty().withMessage('Project ID is required'),
];

// Routes
router.post('/', authenticateToken, validate(createProjectValidation), ProjectController.createProject);
router.get('/my-projects', authenticateToken, ProjectController.getUserProjects);
router.get('/all', optionalAuth, ProjectController.getAllProjects);
router.get('/:id', optionalAuth, validate(projectIdValidation), ProjectController.getProjectById);
router.put('/:id', authenticateToken, validate(updateProjectValidation), ProjectController.updateProject);
router.delete('/:id', authenticateToken, validate(projectIdValidation), ProjectController.deleteProject);

export default router;
