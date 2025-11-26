import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Base axios instance for public/unauthenticated requests
 * - No automatic token attachment
 * - No automatic redirects on 401
 *
 * For authenticated requests, use:
 * - adminApi (admin/funcionario context)
 * - clientApi (client context)
 */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor - basic error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';

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

export default api;
