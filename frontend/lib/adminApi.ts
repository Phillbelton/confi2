import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Axios instance for Admin/Funcionario authenticated requests
 * - Uses 'admin-token' from localStorage
 * - Redirects to /admin/login on 401
 */
export const adminApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - attach admin token
adminApi.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';

      if (status === 401 && typeof window !== 'undefined') {
        // Clear admin token
        localStorage.removeItem('admin-token');
        // Redirect to admin login
        if (!window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login';
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

export default adminApi;
