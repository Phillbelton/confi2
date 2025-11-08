import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';
import logger from '../config/logger';

/**
 * Middleware de sanitización XSS
 * Limpia todos los strings en body, query y params para prevenir ataques XSS
 * Se ejecuta automáticamente en cada request HTTP
 */
export const xssSanitize = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitizar request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitizar query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitizar route parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error: any) {
    logger.error('Error en sanitización XSS', { error: error.message, stack: error.stack });
    // En caso de error, continuar sin sanitizar (fail-open para no romper la app)
    // En producción podrías preferir fail-closed (rechazar la request)
    next();
  }
};

/**
 * Sanitiza recursivamente un objeto, array o string
 * Remueve todos los tags HTML y scripts maliciosos
 */
function sanitizeObject(obj: any): any {
  // Si es null o undefined, retornar tal cual
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si es string, sanitizar
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, {
      ALLOWED_TAGS: [], // No permitir ningún tag HTML
      ALLOWED_ATTR: [], // No permitir ningún atributo
      KEEP_CONTENT: true, // Mantener el contenido de texto
    });
  }

  // Si es number, boolean, date, etc., retornar tal cual
  if (typeof obj !== 'object') {
    return obj;
  }

  // Si es array, sanitizar cada elemento
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  // Si es objeto, sanitizar cada propiedad
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // También sanitizar las keys (por si acaso)
    const cleanKey = typeof key === 'string'
      ? DOMPurify.sanitize(key, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      : key;

    sanitized[cleanKey] = sanitizeObject(value);
  }

  return sanitized;
}

/**
 * Middleware opcional para sanitizar solo campos específicos
 * Útil si quieres permitir HTML en ciertos campos (ej: descripciones ricas)
 */
export const xssSanitizeAllowHTML = (allowedFields: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObjectSelective(req.body, allowedFields);
      }

      next();
    } catch (error: any) {
      logger.error('Error en sanitización XSS selectiva', { error: error.message });
      next();
    }
  };
};

/**
 * Sanitiza selectivamente, permitiendo HTML básico en campos específicos
 */
function sanitizeObjectSelective(obj: any, allowedHTMLFields: string[]): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Por defecto, no permitir HTML
    return DOMPurify.sanitize(obj, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObjectSelective(item, allowedHTMLFields));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanKey = typeof key === 'string'
      ? DOMPurify.sanitize(key, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      : key;

    // Si el campo está en la whitelist, permitir HTML básico seguro
    if (allowedHTMLFields.includes(key) && typeof value === 'string') {
      sanitized[cleanKey] = DOMPurify.sanitize(value, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: [],
      });
    } else {
      sanitized[cleanKey] = sanitizeObjectSelective(value, allowedHTMLFields);
    }
  }

  return sanitized;
}
