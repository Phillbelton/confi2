import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';
import { ApiResponse } from '../types';
import logger from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Error interno del servidor';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log del error
  if (!isOperational || ENV.NODE_ENV === 'development') {
    logger.error('Error en request', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      statusCode,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  } else {
    // En producción, solo log errores operacionales
    logger.error('Error operacional', {
      message: err.message,
      url: req.url,
      method: req.method,
      statusCode,
    });
  }

  // Response al cliente
  const response: ApiResponse = {
    success: false,
    error: message,
  };

  // En desarrollo, enviar stack trace
  if (ENV.NODE_ENV === 'development') {
    response.data = {
      stack: err.stack,
    };
  }

  res.status(statusCode).json(response);
};

// Not Found handler
export const notFoundHandler = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  const error = new AppError(404, `Ruta no encontrada: ${req.originalUrl}`);
  next(error);
};

// Async handler wrapper para evitar try-catch en cada controller
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
