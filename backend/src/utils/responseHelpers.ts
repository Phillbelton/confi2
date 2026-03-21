/**
 * Response Helpers
 *
 * Utilidades centralizadas para enviar respuestas HTTP consistentes
 * en toda la aplicación.
 *
 * Estructuras estándar:
 * - Success: { success: true, data: any, message?: string }
 * - Paginated: { success: true, data: { data: any[], pagination: {...} } }
 * - Error: { success: false, error: string }
 */

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Respuesta exitosa simple
 * Uso: res.json(successResponse(user))
 */
export function successResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Respuesta paginada
 * Uso: res.json(paginatedResponse(products, { page, limit, total }))
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
): SuccessResponse<PaginatedData<T>> {
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return {
    success: true,
    data: {
      data,
      pagination: {
        ...pagination,
        totalPages,
        hasNextPage: pagination.page < totalPages,
        hasPrevPage: pagination.page > 1,
      },
    },
  };
}

/**
 * Respuesta de error
 * Uso: res.status(400).json(errorResponse('Invalid data'))
 */
export function errorResponse(error: string, validationErrors?: Array<{ field: string; message: string }>): ErrorResponse {
  return {
    success: false,
    error,
    ...(validationErrors && validationErrors.length > 0 && { errors: validationErrors }),
  };
}

/**
 * Helper para calcular skip/offset desde page number
 * Uso: const skip = getSkipFromPage(page, limit)
 */
export function getSkipFromPage(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Helper para extraer parámetros de paginación de query
 * Uso: const { page, limit, skip } = getPaginationParams(req.query)
 */
export function getPaginationParams(query: any): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10));
  const skip = getSkipFromPage(page, limit);

  return { page, limit, skip };
}

/**
 * Helper para mensajes de éxito comunes
 */
export const SuccessMessages = {
  CREATED: 'Recurso creado exitosamente',
  UPDATED: 'Perfil actualizado exitosamente',
  DELETED: 'Recurso eliminado exitosamente',
  LOGIN: 'Login exitoso',
  LOGOUT: 'Logout exitoso',
  REGISTER: 'Usuario registrado exitosamente',
  PASSWORD_CHANGED: 'Contraseña cambiada exitosamente',
  PASSWORD_RESET: 'Contraseña restablecida exitosamente',
  TOKEN_REFRESHED: 'Token refrescado exitosamente',
} as const;

/**
 * Helper para mensajes de error comunes
 */
export const ErrorMessages = {
  NOT_FOUND: 'Recurso no encontrado',
  UNAUTHORIZED: 'No autorizado',
  FORBIDDEN: 'No tienes permisos para acceder a este recurso',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  VALIDATION_ERROR: 'Error de validación',
  SERVER_ERROR: 'Error interno del servidor',
} as const;
