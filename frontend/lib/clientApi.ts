import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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

// Response interceptor - handle 401
clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';

      if (status === 401 && typeof window !== 'undefined') {
        // Clear client token
        localStorage.removeItem('client-token');
        // Redirect to client login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
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
