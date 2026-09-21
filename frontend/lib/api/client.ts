import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Endpoints where a 401 is an expected outcome, not a session expiring.
// - /auth/login, /auth/register: a wrong password or duplicate username.
// - /auth/refresh: attempting to refresh a refresh token that has itself
//   expired or is missing — refreshing again here would loop forever.
const NEVER_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh'];
// /auth/me is polled on every page load to discover whether a session
// exists; a 401 there just means "not logged in", not "redirect me". A
// failed /auth/refresh must not redirect on its own either — it runs nested
// inside another request's interceptor, and that outer request (whatever it
// was) is what decides whether a redirect is warranted.
const NO_REDIRECT_ON_FAILURE = ['/auth/login', '/auth/me', '/auth/refresh'];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/**
 * The access token cookie lives 15 minutes; the refresh token 7 days. Without
 * this, every session went silent after 15 minutes: the browser stopped
 * sending the expired cookie, every API call 401'd, and pages that catch
 * their own errors (most of them, to show a retry button rather than crash)
 * simply rendered with no data — which looked exactly like "everything is
 * empty" rather than "please sign in again".
 *
 * A single in-flight refresh is shared across every request that hits a 401
 * at the same time, so a page that fires five requests at once triggers one
 * refresh, not five.
 */
let refreshPromise: Promise<boolean> | null = null;

function attemptRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh')
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = config?.url || '';

    if (status !== 401 || !config) {
      return Promise.reject(error);
    }

    const skipRefresh = NEVER_REFRESH.some((path) => url.includes(path));
    if (!skipRefresh && !config._retried) {
      config._retried = true;
      const refreshed = await attemptRefresh();
      if (refreshed) {
        return api(config);
      }
    }

    const skipRedirect = NO_REDIRECT_ON_FAILURE.some((path) => url.includes(path));
    if (!skipRedirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
