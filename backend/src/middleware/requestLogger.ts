import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

/**
 * Middleware para loguear todas las requests HTTP
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Capturar la respuesta original
  const originalSend = res.send;

  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log del request
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      statusCode,
      duration: `${duration}ms`,
      user: (req as any).user?.email || 'anonymous',
    };

    // Determinar nivel de log según status code
    if (statusCode >= 500) {
      logger.error('HTTP Request', logData);
    } else if (statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }

    // Llamar al método original
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware simplificado para loguear solo requests específicos
 */
export const logRequest = (message: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    logger.info(message, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      user: (req as any).user?.email || 'anonymous',
    });
    next();
  };
};
