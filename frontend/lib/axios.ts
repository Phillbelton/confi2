import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for JWT cookies
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // In development, send token in Authorization header (cookies don't work cross-port)
    if (typeof window !== 'undefined') {
      // Check which token to use based on the current path or available tokens
      const isAdminPath = window.location.pathname.startsWith('/admin') ||
                          window.location.pathname.startsWith('/funcionario');

      // Try admin token first for admin/funcionario paths, otherwise try client token
      let token = null;
      if (isAdminPath) {
        token = localStorage.getItem('admin-token');
      } else {
        // For client paths, prefer client-token
        token = localStorage.getItem('client-token') || localStorage.getItem('admin-token');
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Return data directly if it's a successful response
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';

      switch (status) {
        case 401:
          // Unauthorized - redirect to appropriate login
          if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            // Only redirect if not already on a login page
            if (!currentPath.includes('/login')) {
              // Determine correct login page based on current path
              if (currentPath.startsWith('/admin') || currentPath.startsWith('/funcionario')) {
                window.location.href = '/admin/login';
              } else {
                // Client pages redirect to client login
                window.location.href = '/login';
              }
            }
          }
          break;
        case 403:
          // Forbidden
          console.error('Access denied:', message);
          break;
        case 404:
          // Not found
          console.error('Resource not found:', message);
          break;
        case 429:
          // Too many requests
          console.error('Rate limit exceeded. Please try again later.');
          break;
        case 500:
          // Server error
          console.error('Server error. Please try again later.');
          break;
      }

      return Promise.reject({
        status,
        message,
        errors: error.response.data?.errors,
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error. Please check your connection.');
      return Promise.reject({
        status: 0,
        message: 'Network error. Please check your connection.',
      });
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject({
        status: 0,
        message: error.message || 'An unexpected error occurred',
      });
    }
  }
);

export default api;
