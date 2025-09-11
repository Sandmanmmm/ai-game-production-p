import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { CustomError } from './errorHandler';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    const error = new Error('Access token required') as CustomError;
    error.statusCode = 401;
    return next(error);
  }

  try {
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    const customError = new Error('Invalid or expired token') as CustomError;
    customError.statusCode = 401;
    next(customError);
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = AuthService.verifyToken(token);
      req.user = decoded;
    } catch (error) {
      // For optional auth, we don't fail if token is invalid
      // Just continue without setting req.user
    }
  }

  next();
};
