import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { AuthRequest, TokenPayload } from '../types';
import { AppError } from './errorHandler';
import { User } from '../models/User';
import { UserRole } from '../types';
import logger from '../config/logger';

// Re-export AuthRequest for convenience
export type { AuthRequest } from '../types';

// Cache simple en memoria del estado de usuarios para evitar un round-trip
// a Mongo en cada request autenticado. TTL corto para que cambios de
// active/role/tokenVersion se propaguen en orden de minuto, no de días
// (los JWT expiran en 7d, así que sin esto un usuario desactivado mantiene
// acceso). Para cambios críticos (password change, desactivación) se invoca
// además `invalidateUserStateCache(userId)` para propagación inmediata.
const USER_STATE_CACHE_TTL_MS = 60 * 1000; // 60s
type UserState = { active: boolean; role: UserRole; tokenVersion: number };
const userStateCache = new Map<string, { value: UserState; expiresAt: number }>();

const ALGORITHMS: jwt.Algorithm[] = ['HS256'];

const getUserState = async (userId: string): Promise<UserState | null> => {
  const cached = userStateCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const user = await User.findById(userId)
    .select('active role tokenVersion')
    .lean<{
      active: boolean;
      role: UserRole;
      tokenVersion?: number;
    } | null>();

  if (!user) return null;

  const value: UserState = {
    active: user.active,
    role: user.role,
    tokenVersion: user.tokenVersion ?? 0,
  };
  userStateCache.set(userId, {
    value,
    expiresAt: Date.now() + USER_STATE_CACHE_TTL_MS,
  });
  return value;
};

/**
 * Invalida el caché de estado de un usuario. Llamar después de cambios
 * críticos (desactivar, cambiar rol, eliminar) para que la próxima request
 * no use el snapshot viejo.
 */
export const invalidateUserStateCache = (userId: string): void => {
  userStateCache.delete(userId);
};

export const authenticate = async (
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

    // Verificar token con algoritmo HS256 explícito (defensa contra
    // futuras vulnerabilidades de algorithm confusion en jsonwebtoken).
    const decoded = jwt.verify(token, ENV.JWT_SECRET, {
      algorithms: ALGORITHMS,
    }) as TokenPayload;

    // Rechequear el usuario en DB (con caché) para invalidar JWTs de
    // usuarios desactivados/eliminados sin esperar la expiración del token.
    const state = await getUserState(decoded.id);
    if (!state) {
      throw new AppError(401, 'Usuario no encontrado');
    }
    if (!state.active) {
      throw new AppError(403, 'Cuenta desactivada');
    }

    // Validar token version: si el usuario cambió su password o un admin
    // forzó el logout, el `tokenVersion` en DB se incrementó y todos los
    // tokens emitidos antes (incluido éste) quedan inválidos.
    if (state.tokenVersion !== decoded.tv) {
      throw new AppError(401, 'Token revocado');
    }

    // Agregar usuario al request (usar el rol actual de DB, no el del JWT,
    // para reflejar cambios de rol dentro del TTL del caché)
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: state.role,
    };

    next();
  } catch (error) {
    // TokenExpiredError extiende JsonWebTokenError, por lo que debe
    // chequearse primero o nunca se alcanza la rama "Token expirado".
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'Token expirado'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Token inválido'));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      logger.error('Error inesperado en authenticate', { error });
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
      const decoded = jwt.verify(token, ENV.JWT_SECRET, {
        algorithms: ALGORITHMS,
      }) as TokenPayload;
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
