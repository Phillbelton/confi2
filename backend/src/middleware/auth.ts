import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { AuthRequest, TokenPayload } from '../types';
import { AppError } from './errorHandler';

// Re-export AuthRequest for convenience
export type { AuthRequest } from '../types';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener token de cookies o header Authorization
    const tokenFromCookie = req.cookies?.token;
    const tokenFromHeader = req.headers.authorization?.split(' ')[1];
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      throw new AppError(401, 'No autenticado - Token no proporcionado');
    }

    // Verificar token
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;

    // Agregar usuario al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Token inválido'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expirado'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'No autenticado'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'No tienes permisos para acceder a este recurso')
      );
    }

    next();
  };
};

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenFromCookie = req.cookies?.token;
    const tokenFromHeader = req.headers.authorization?.split(' ')[1];
    const token = tokenFromCookie || tokenFromHeader;

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // Si el token es inválido, simplemente continuar sin usuario
    next();
  }
};
