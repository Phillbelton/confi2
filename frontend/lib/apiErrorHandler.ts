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
 * Extrae el mensaje de error de una respuesta del backend.
 * Soporta ambos campos: `error` (legacy) y `message` (estándar).
 */
function extractErrorMessage(data: any): string {
  return data?.message || data?.error || 'An error occurred';
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
        const data = error.response.data as any;
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
          ...(data?.details && { details: data.details }),
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
