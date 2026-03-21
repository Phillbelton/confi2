import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from './errorHandler';

/**
 * Middleware de autorización por roles
 */

/**
 * Verificar que el usuario esté autenticado
 */
export const isAuthenticated = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, 'No estás autenticado. Por favor inicia sesión.');
  }
  next();
};

/**
 * Verificar que el usuario sea Admin
 */
export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, 'No estás autenticado. Por favor inicia sesión.');
  }

  if (req.user.role !== 'admin') {
    throw new AppError(403, 'Acceso denegado. Se requiere rol de administrador.');
  }

  next();
};

/**
 * Verificar que el usuario sea Admin o Funcionario
 */
export const isAdminOrFuncionario = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, 'No estás autenticado. Por favor inicia sesión.');
  }

  const allowedRoles = ['admin', 'funcionario'];
  if (!allowedRoles.includes(req.user.role)) {
    throw new AppError(403, 'Acceso denegado. Se requiere rol de administrador o funcionario.');
  }

  next();
};

/**
 * Verificar que el usuario sea Cliente (o superior)
 */
export const isCliente = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, 'No estás autenticado. Por favor inicia sesión.');
  }

  const allowedRoles = ['cliente', 'funcionario', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    throw new AppError(403, 'Acceso denegado.');
  }

  next();
};

/**
 * Verificar que la cuenta del usuario esté activa
 */
export const isActive = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    throw new AppError(401, 'No estás autenticado. Por favor inicia sesión.');
  }

  // Aquí podrías verificar en la base de datos si el usuario está activo
  // Por ahora asumimos que el middleware de auth ya valida esto

  next();
};

/**
 * Middleware combinado: Autenticado + Admin
 */
export const authAdmin = [isAuthenticated, isAdmin];

/**
 * Middleware combinado: Autenticado + Admin o Funcionario
 */
export const authAdminOrFuncionario = [isAuthenticated, isAdminOrFuncionario];

/**
 * Middleware combinado: Autenticado + Cliente (cualquier usuario autenticado)
 */
export const authCliente = [isAuthenticated, isCliente];
