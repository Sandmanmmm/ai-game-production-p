import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { CustomError } from '../middleware/errorHandler';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;

      const result = await AuthService.registerUser({
        email,
        password,
        name,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'User with this email already exists') {
        const customError = new Error(error.message) as CustomError;
        customError.statusCode = 409; // Conflict
        return next(customError);
      }
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await AuthService.loginUser({
        email,
        password,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.token,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid email or password') {
        const customError = new Error(error.message) as CustomError;
        customError.statusCode = 401; // Unauthorized
        return next(customError);
      }
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;

      const user = await AuthService.getUserById(userId);

      if (!user) {
        const error = new Error('User not found') as CustomError;
        error.statusCode = 404;
        return next(error);
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.userId;
      const email = (req as any).user.email;

      const token = AuthService.generateToken({ id: userId, userId, email });

      res.json({
        success: true,
        data: { token },
      });
    } catch (error) {
      next(error);
    }
  }
}
