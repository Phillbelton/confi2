import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from './apiErrorHandler';

/**
 * Type guard: el interceptor de axios (lib/apiErrorHandler.ts) transforma
 * AxiosError → ApiErrorResponse (plain object) antes de rechazar la
 * promesa. Por eso el error que llega al onError de react-query NO es
 * instance of Error.
 */
function isApiErrorResponse(e: unknown): e is ApiErrorResponse {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    'message' in e &&
    typeof (e as ApiErrorResponse).status === 'number' &&
    typeof (e as ApiErrorResponse).message === 'string'
  );
}

/**
 * Extrae un mensaje legible de cualquier error que llegue a un onError
 * de react-query, un catch o un toast handler. Reemplaza el patrón
 * `error: any` + `error?.message || 'Ocurrió un error'` que se repetía
 * en cada mutación.
 *
 * Orden de búsqueda:
 *  1. ApiErrorResponse del interceptor (el caso común en este proyecto)
 *  2. AxiosError directo (si algo bypassa el interceptor)
 *  3. Error.message (errores nativos)
 *  4. string crudo
 *  5. fallback
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado'
): string {
  if (isApiErrorResponse(error) && error.message) return error.message;
  if (isAxiosError(error)) {
    const body = error.response?.data as { message?: unknown } | undefined;
    if (typeof body?.message === 'string' && body.message) return body.message;
    if (error.message) return error.message;
    return fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}
