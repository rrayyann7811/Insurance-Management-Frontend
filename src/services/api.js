import axios from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api' });

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('insurance-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(error) {
  return error.response?.data?.message || 'The request could not be completed. Please try again.';
}

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/login')) {
    window.dispatchEvent(new Event('insurance-session-expired'));
  }
  return Promise.reject(error);
});
