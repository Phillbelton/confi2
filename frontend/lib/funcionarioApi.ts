import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Axios instance for Funcionario authenticated requests
 * - Uses 'funcionario-token' from localStorage
 * - Redirects to /funcionario/login on 401
 */
export const funcionarioApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach funcionario token
funcionarioApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('funcionario-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
funcionarioApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';

      if (status === 401 && typeof window !== 'undefined') {
        // Clear funcionario token
        localStorage.removeItem('funcionario-token');
        // Redirect to funcionario login
        if (!window.location.pathname.includes('/funcionario/login')) {
          window.location.href = '/funcionario/login';
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

export default funcionarioApi;
