import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Endpoints that are allowed to return 401 without triggering a redirect.
// /auth/me is checked on every page load — it returning 401 just means
// the user is not logged in, not that the session has expired.
const ANONYMOUS_ALLOWLIST = ['/auth/login', '/auth/me', '/auth/refresh'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      const isAnonymous = ANONYMOUS_ALLOWLIST.some((path) => url.includes(path));
      if (!isAnonymous && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
