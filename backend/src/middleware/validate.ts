import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../config/logger';

/**
 * Middleware genérico de validación con Zod
 *
 * Valida request.body, request.params, y request.query contra un schema de Zod
 */

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar el request completo (body, params, query)
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Formatear errores de Zod para una respuesta amigable
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validation error', {
          url: req.url,
          method: req.method,
          errors,
        });

        res.status(400).json({
          success: false,
          error: 'Error de validación',
          details: errors,
        });
      } else {
        // Error inesperado
        logger.error('Unexpected validation error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
        });
      }
    }
  };
};

/**
 * Validar solo el body
 */
export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated; // Reemplazar con datos validados/transformados
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Body validation error', {
          url: req.url,
          method: req.method,
          errors,
        });

        res.status(400).json({
          success: false,
          error: 'Error de validación',
          details: errors,
        });
      } else {
        logger.error('Unexpected body validation error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
        });
      }
    }
  };
};

/**
 * Validar solo los params
 */
export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Params validation error', {
          url: req.url,
          method: req.method,
          errors,
        });

        res.status(400).json({
          success: false,
          error: 'Parámetros inválidos',
          details: errors,
        });
      } else {
        logger.error('Unexpected params validation error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
        });
      }
    }
  };
};

/**
 * Validar solo el query
 */
export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Query validation error', {
          url: req.url,
          method: req.method,
          errors,
        });

        res.status(400).json({
          success: false,
          error: 'Parámetros de consulta inválidos',
          details: errors,
        });
      } else {
        logger.error('Unexpected query validation error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
        });
      }
    }
  };
};
