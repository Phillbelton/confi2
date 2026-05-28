import { AxiosError, AxiosInstance } from 'axios';

/**
 * Forma estandarizada de error de API.
 * El backend envía { success, error, message, details? }
 * Este tipo unifica lo que el frontend maneja.
 */
export interface ApiErrorResponse {
  status: number;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Forma laxa del body de error que devuelve el backend. Acepta ambos
 * campos por compatibilidad: `error` (legacy) y `message` (estándar).
 */
type BackendErrorBody = { message?: unknown; error?: unknown; details?: unknown };

/**
 * Extrae el mensaje de error de una respuesta del backend.
 */
function extractErrorMessage(data: unknown): string {
  const body = data as BackendErrorBody | null | undefined;
  if (typeof body?.message === 'string' && body.message) return body.message;
  if (typeof body?.error === 'string' && body.error) return body.error;
  return 'An error occurred';
}

/**
 * Configura el interceptor de respuesta de error para una instancia de Axios.
 *
 * @param instance - Instancia de Axios a configurar
 * @param opts.tokenKey - Key en localStorage para el token de autenticación (null si no aplica)
 * @param opts.loginRedirect - Ruta a la que redirigir en 401 (null si no aplica)
 */
export function setupErrorInterceptor(
  instance: AxiosInstance,
  opts: {
    tokenKey?: string | null;
    loginRedirect?: string | null;
  } = {}
) {
  const { tokenKey = null, loginRedirect = null } = opts;

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data as BackendErrorBody | null | undefined;
        const message = extractErrorMessage(data);

        // Handle 401 — clear token and redirect
        if (status === 401 && tokenKey && loginRedirect && typeof window !== 'undefined') {
          localStorage.removeItem(tokenKey);
          if (!window.location.pathname.includes(loginRedirect)) {
            window.location.href = loginRedirect;
          }
        }

        const apiError: ApiErrorResponse = {
          status,
          message,
          ...(Array.isArray(data?.details) && { details: data.details as ApiErrorResponse['details'] }),
        };

        return Promise.reject(apiError);
      }

      // Network error (sin response del servidor)
      return Promise.reject({
        status: 0,
        message: error.message || 'Network error',
      } as ApiErrorResponse);
    }
  );
}
