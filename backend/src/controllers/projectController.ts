import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProjectService } from '../services/projectService';
import { CustomError } from '../middleware/errorHandler';

// Validation schemas
const createProjectSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'])
    .optional()
    .default('DRAFT'),
});

const updateProjectSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'])
    .optional(),
});

const projectIdSchema = z.string().uuid('Invalid project ID format');

export class ProjectController {
  /**
   * Create a new project
   * POST /api/projects
   */
  static async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = createProjectSchema.parse(req.body);
      
      // Check authentication - use type assertion since we know the middleware sets this
      const userId = (req as any).user?.userId || (req as any).user?.id;
      if (!userId) {
        const error = new Error('Authentication required') as CustomError;
        error.statusCode = 401;
        return next(error);
      }

      // Create project
      const project = await ProjectService.createProject({
        userId,
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status as any, // Type assertion for now
      });

      // Log successful creation for monitoring
      console.log(`Project created: ${project.id} by user: ${userId}`);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project,
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        const customError = new Error('Validation failed') as CustomError;
        customError.statusCode = 400;
        customError.details = error.issues;
        return next(customError);
      }
      next(error);
    }
  }

  /**
   * Get a project by ID
   * GET /api/projects/:id
   */
  static async getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate project ID
      const projectId = projectIdSchema.parse(req.params.id);
      
      // Check authentication - use type assertion since we know the middleware sets this
      const userId = (req as any).user?.userId || (req as any).user?.id;
      if (!userId) {
        const error = new Error('Authentication required') as CustomError;
        error.statusCode = 401;
        return next(error);
      }

      // Get project
      const project = await ProjectService.getProjectById(projectId, userId);

      if (!project) {
        const error = new Error('Project not found or access denied') as CustomError;
        error.statusCode = 404;
        return next(error);
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const customError = new Error('Invalid project ID') as CustomError;
        customError.statusCode = 400;
        return next(customError);
      }
      next(error);
    }
  }

  /**
   * Update a project by ID
   * PUT /api/projects/:id
   */
  static async updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate project ID and request body
      const projectId = projectIdSchema.parse(req.params.id);
      const validatedData = updateProjectSchema.parse(req.body);
      
      // Check authentication
      const userId = (req as any).user?.userId || (req as any).user?.id;
      if (!userId) {
        const error = new Error('Authentication required') as CustomError;
        error.statusCode = 401;
        return next(error);
      }

      // Check if there's actually data to update
      if (Object.keys(validatedData).length === 0) {
        const error = new Error('No update data provided') as CustomError;
        error.statusCode = 400;
        return next(error);
      }

      // Update project - fix the service call to match existing implementation
      const updatedProject = await ProjectService.updateProject(projectId, {
        ...validatedData,
        status: validatedData.status as any, // Type assertion for now
      }, userId);

      if (!updatedProject) {
        const error = new Error('Project not found or access denied') as CustomError;
        error.statusCode = 404;
        return next(error);
      }

      // Log successful update for monitoring
      console.log(`Project updated: ${projectId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Project updated successfully',
        data: updatedProject,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const customError = new Error('Validation failed') as CustomError;
        customError.statusCode = 400;
        customError.details = error.issues;
        return next(customError);
      }
      next(error);
    }
  }

  /**
   * Delete a project by ID
   * DELETE /api/projects/:id
   */
  static async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate project ID
      const projectId = projectIdSchema.parse(req.params.id);
      
      // Check authentication
      const userId = (req as any).user?.userId || (req as any).user?.id;
      if (!userId) {
        const error = new Error('Authentication required') as CustomError;
        error.statusCode = 401;
        return next(error);
      }

      // Delete project
      const success = await ProjectService.deleteProject(projectId, userId);

      if (!success) {
        const error = new Error('Project not found or access denied') as CustomError;
        error.statusCode = 404;
        return next(error);
      }

      // Log successful deletion for monitoring
      console.log(`Project deleted: ${projectId} by user: ${userId}`);

      res.json({
        success: true,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const customError = new Error('Invalid project ID') as CustomError;
        customError.statusCode = 400;
        return next(customError);
      }
      next(error);
    }
  }

  /**
   * Get all projects for the authenticated user
   * GET /api/projects
   */
  static async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check authentication
      const userId = (req as any).user?.userId || (req as any).user?.id;
      if (!userId) {
        const error = new Error('Authentication required') as CustomError;
        error.statusCode = 401;
        return next(error);
      }

      // Parse query parameters for filtering
      const status = req.query.status as string;

      // Validate status if provided
      const validStatuses = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];
      if (status && !validStatuses.includes(status)) {
        const error = new Error('Invalid status filter') as CustomError;
        error.statusCode = 400;
        return next(error);
      }

      // Get projects - use existing service method
      let projects;
      if (status) {
        projects = await ProjectService.getProjectsByStatus(status as any, userId);
      } else {
        projects = await ProjectService.getUserProjects(userId);
      }

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all projects (for admin/public view)
   * GET /api/projects/all
   */
  static async getAllProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get all projects
      const projects = await ProjectService.getAllProjects();

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's projects
   * GET /api/projects/my-projects
   */
  static async getUserProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check authentication
      const userId = (req as any).user?.userId || (req as any).user?.id;
      if (!userId) {
        const error = new Error('Authentication required') as CustomError;
        error.statusCode = 401;
        return next(error);
      }

      // Get user's projects
      const projects = await ProjectService.getUserProjects(userId);

      res.json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }
}
