import axios from 'axios';
import { API_URL } from './apiConfig';

/**
 * Axios instance for Client authenticated requests
 * - Uses 'client-token' from localStorage
 * - Redirects to /login on 401
 */
export const clientApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach client token
clientApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('client-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 (no auth) and 403 (rol incorrecto)
clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || error.response.data?.message || 'An error occurred';

      if (status === 401 && typeof window !== 'undefined') {
        // Clear client token + persisted user state to avoid stale-auth loops
        localStorage.removeItem('client-token');
        localStorage.removeItem('client-storage');
        // Redirect to client login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      // 403 desde un endpoint cliente típicamente significa que el JWT pertenece
      // a un admin/funcionario que se coló por /login. La capa 2 (layout) ya lo
      // detecta vía user.role, pero esto es backup por si un componente fetcheá
      // antes de que el layout monte. Limpia y patea con flag para mostrar banner.
      if (status === 403 && typeof window !== 'undefined') {
        localStorage.removeItem('client-token');
        localStorage.removeItem('client-storage');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?error=role';
        }
      }

      return Promise.reject({
        status,
        message,
        errors: error.response.data?.errors,
      });
    }

    return Promise.reject({
      status: 0,
      message: error.message || 'Network error',
    });
  }
);

export default clientApi;
