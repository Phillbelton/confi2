import rateLimit, { Options as RateLimitOptions } from 'express-rate-limit';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

/**
 * Factory para crear rate limiters conscientes del entorno de test
 * En modo test, todos los limiters se desactivan automáticamente
 */
export function createTestAwareRateLimiter(options: Partial<RateLimitOptions>): any {
  const skipOriginal = options.skip;

  return rateLimit({
    ...options,
    skip: (req: Request, res: any) => {
      // Siempre skip en tests
      if (ENV.NODE_ENV === 'test') {
        return true;
      }

      // Si hay skip function original, usarla
      if (skipOriginal) {
        return skipOriginal(req, res);
      }

      return false;
    },
  });
}

/**
 * Extrae el rol del token JWT sin validarlo completamente
 * (la validación completa la hace el middleware authenticate)
 */
function extractRoleFromToken(req: Request): string | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    // Decodificar sin verificar (solo para rate limiting)
    const decoded = jwt.decode(token) as any;

    return decoded?.role || null;
  } catch {
    return null;
  }
}

/**
 * Rate limiter diferenciado por rol de usuario
 *
 * Límites:
 * - Admin/Funcionario: 1000 requests / 15 min (trabajo intensivo)
 * - Usuario autenticado: 500 requests / 15 min
 * - Anónimo: 300 requests / 15 min (suficiente para navegación de catálogo)
 */
export const apiRateLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS, // 15 minutos

  // Límite dinámico basado en rol extraído del token
  max: (req: Request) => {
    const role = extractRoleFromToken(req);

    if (!role) {
      // Usuario anónimo (sin token o token inválido)
      // 300 permite navegar catálogo de productos sin problemas
      return 300;
    }

    // Usuarios con roles administrativos
    if (role === 'admin' || role === 'funcionario') {
      return 1000; // 10x más para trabajo intensivo
    }

    // Usuario cliente autenticado
    return 500; // 5x más que anónimos
  },

  // Mensaje personalizado
  message: (req: Request) => {
    const role = extractRoleFromToken(req) || 'anónimo';
    return `Límite de peticiones excedido para usuario ${role}. Intenta de nuevo más tarde.`;
  },

  // Headers estándar
  standardHeaders: true,
  legacyHeaders: false,

  // Skip para health check
  skip: (req: Request) => {
    // Deshabilitar en tests
    if (ENV.NODE_ENV === 'test') {
      return true;
    }
    return req.path === '/health';
  },

  // Key generator: usar rol + IP para agrupar por tipo de usuario
  keyGenerator: (req: Request) => {
    const role = extractRoleFromToken(req);
    const ip = req.ip || 'unknown';

    if (role) {
      // Agrupar por rol + IP
      return `${role}:${ip}`;
    }

    // Solo IP para anónimos
    return `anon:${ip}`;
  },
});

/**
 * Rate limiter estricto para endpoints sensibles
 * (login, registro, recuperación de contraseña)
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos
  message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  skip: (req: Request) => {
    // Deshabilitar en tests
    return ENV.NODE_ENV === 'test';
  },
});

/**
 * Rate limiter para uploads
 */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: (req: Request) => {
    const user = (req as any).user;

    if (user?.role === 'admin' || user?.role === 'funcionario') {
      return 200; // Muchos productos con imágenes
    }

    return 50; // Usuarios normales
  },
  message: 'Límite de uploads excedido. Intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Deshabilitar en tests
    return ENV.NODE_ENV === 'test';
  },
});
