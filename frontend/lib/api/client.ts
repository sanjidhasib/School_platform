import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Where API calls go.
 * - Locally: straight to the backend (http://localhost:5000/api).
 * - Hosted: NEXT_PUBLIC_API_URL is "/api", so the browser calls the website's
 *   own domain and next.config.mjs forwards it to the backend. Login cookies
 *   then belong to the website's domain, which is what the page guard in
 *   middleware.ts reads.
 * - On the server (homepage data) a relative URL has no host, so the backend
 *   is called directly through API_PROXY_TARGET.
 */
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SERVER_API_URL = process.env.API_PROXY_TARGET
  ? `${process.env.API_PROXY_TARGET.replace(/\/$/, '')}/api`
  : PUBLIC_API_URL;

const api = axios.create({
  baseURL: typeof window === 'undefined' ? SERVER_API_URL : PUBLIC_API_URL,
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

/** The backend's origin, for files it serves (uploaded logo, carousel pictures). */
// With the hosted "/api" setting this is "", so pictures load from the
// website's own /uploads path, which is forwarded to the backend too.
export const API_ORIGIN = PUBLIC_API_URL.replace(/\/api\/?$/, '');

/**
 * Big uploads (textbook PDFs) can't pass through the hosting forwarder, which
 * caps request bodies at a few MB. When NEXT_PUBLIC_DIRECT_API_URL is set they
 * go straight to the backend instead, signed with a short-lived upload token.
 */
export const DIRECT_API_URL = process.env.NEXT_PUBLIC_DIRECT_API_URL || '';

/** "/uploads/branding/x.jpg" → a full URL; anything else passes through. */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  return path.startsWith('/uploads/') ? `${API_ORIGIN}${path}` : path;
}
