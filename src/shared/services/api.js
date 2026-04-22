import axios from "axios";

// Determine base URL based on subdomain
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    const hostParts = window.location.hostname.split(".");

    // Local development
    if (
      hostParts.includes("localhost") ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168.") ||
      window.location.hostname.startsWith("10.")
    ) {
      const host = window.location.hostname;
      return `http://${host}:4000/api/v1`;
    }

    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }

    // Admin subdomain handling
    const subdomain = hostParts[0];
    if (subdomain === "admin") {
      return "https://api.saiisai.com/api/v1";
    }

    // Default production API
    return "https://api.saiisai.com/api/v1";
  }

  return "http://localhost:4000/api/v1";
};

const baseURL = getBaseURL();

// Grace period after login: suppress 401 redirects to prevent false "session expired"
// messages caused by race conditions right after login.
// Uses sessionStorage so the flag survives window.location.href page reloads.
const GRACE_KEY = '_adminLoginGrace';
const GRACE_DURATION = 20000; // 20 seconds

let _loginGraceTimer = null;

export const markRecentLogin = () => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(GRACE_KEY, String(Date.now() + GRACE_DURATION));
    // Clear any stale "session expired" message so it doesn't show after login
    sessionStorage.removeItem('eazadmin_login_message');
  }
  if (_loginGraceTimer) clearTimeout(_loginGraceTimer);
  _loginGraceTimer = setTimeout(() => {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(GRACE_KEY);
    _loginGraceTimer = null;
  }, GRACE_DURATION);
};

export const isLoginGraceActive = () => {
  if (typeof sessionStorage === 'undefined') return false;
  const expiry = parseInt(sessionStorage.getItem(GRACE_KEY) || '0', 10);
  return Date.now() < expiry;
};

// Only these routes are public - all others require authentication
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/admin/login",
  "/admin/signup",
  "/admin/forgot-password",
  "/admin/reset-password",
];

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000, // Reduced timeout for better UX
});

let csrfRefreshPromise = null;

// Helper functions
const getRelativePath = (url) => {
  try {
    if (url.startsWith("http")) {
      const parsedUrl = new URL(url);
      return parsedUrl.pathname;
    }
    return url.split("?")[0];
  } catch (e) {
    console.error("Error parsing URL:", e);
    return url;
  }
};

const normalizePath = (path) => {
  if (!path) return "/";
  let normalized = path.split("?")[0].split("#")[0];
  normalized = normalized.replace(/\/+$/, "") || "/";
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const getCookieByName = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const fetchCsrfToken = async () => {
  if (typeof window === "undefined") return null;

  const existingToken = getCookieByName("csrf-token");
  if (existingToken) return existingToken;

  if (!csrfRefreshPromise) {
    csrfRefreshPromise = (async () => {
      try {
        const tokenResponse = await fetch(`${baseURL}/csrf-token`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (!tokenResponse.ok) return null;
        const tokenData = await tokenResponse.json();
        return getCookieByName("csrf-token") || tokenData?.csrfToken || null;
      } catch {
        return null;
      } finally {
        csrfRefreshPromise = null;
      }
    })();
  }

  return csrfRefreshPromise;
};

// Request interceptor
api.interceptors.request.use(async (config) => {
  // Strip trailing slashes from path so backend route matching works (e.g. GET /seller not GET /seller/)
  if (config.url && typeof config.url === 'string' && !config.url.startsWith('http')) {
    const [path, query] = config.url.split('?');
    const pathNorm = path.replace(/\/+$/, '') || '/';
    config.url = query ? `${pathNorm}?${query}` : pathNorm;
  }
  const relativePath = getRelativePath(config.url);
  const normalizedPath = normalizePath(relativePath);

  // Check if route is in the public list
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => normalizedPath === normalizePath(route)
  );

  // Increase timeout for auth endpoints (they may take longer due to middleware)
  const isAuthEndpoint = normalizedPath === '/admin/me' ||
    normalizedPath === '/admin/login' ||
    normalizedPath === '/seller/me' ||
    normalizedPath === '/user/me';

  if (isAuthEndpoint && !config.timeout) {
    config.timeout = 30000; // 30 seconds for auth endpoints
  }

  // SECURITY: Cookie-only authentication
  // Cookies are automatically sent via withCredentials: true
  // Backend reads from req.cookies.admin_jwt

  // Add platform header (non-sensitive metadata)
  config.headers["x-platform"] = "eazadmin";

  if (typeof window !== "undefined") {
    config.headers["X-admin-Subdomain"] =
      window.location.hostname.split(".")[0] || "default";
  }

  // CSRF token handling for state-changing requests (POST, PATCH, PUT, DELETE)
  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && !isPublicRoute) {
    let csrfToken = getCookieByName("csrf-token");
    if (!csrfToken) {
      csrfToken = await fetchCsrfToken();
    }

    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    } else if (import.meta.env.DEV) {
      console.warn(`[API] ⚠️ CSRF token not found in cookie for ${method} ${normalizedPath}`);
    }
  }

  const isDev = Boolean(import.meta.env.DEV);

  if (isPublicRoute) {
    if (isDev) {
      console.log(`Public route: ${normalizedPath}, cookie will be sent automatically if available`);
    }
  } else {
    // Protected route - cookie will be sent automatically via withCredentials: true
    if (isDev) {
      console.debug(`Cookie will be sent automatically for ${normalizedPath}`);
    }
  }

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // CSRF token is set as a cookie by the backend — no localStorage needed
    return response;
  },
  async (error) => {
    // React Query `cancelQueries` / navigation aborts in-flight requests — not a failure.
    // Without this, `console.error` logs "API Error: canceled" with status undefined.
    const msg = typeof error?.message === 'string' ? error.message.trim().toLowerCase() : '';
    const isCanceled =
      error?.code === 'ERR_CANCELED' ||
      error?.name === 'CanceledError' ||
      error?.name === 'AbortError' ||
      axios.isCancel?.(error) === true ||
      error?.config?.signal?.aborted === true ||
      msg === 'canceled' ||
      msg === 'cancelled' ||
      // DOMException / browser: "The user aborted a request."
      (!error?.response && msg && (msg.includes('aborted') || msg.includes('user aborted')));
    if (isCanceled) {
      return Promise.reject(error);
    }

    // Handle CSRF token errors (403)
    if (error.response?.status === 403) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || "Invalid security token";

      // Try to fetch CSRF token from endpoint as fallback
      if (errorCode === 'CSRF_TOKEN_MISSING' || errorCode === 'CSRF_TOKEN_MISMATCH') {
        try {
          const originalRequest = error.config;
          if (originalRequest?._csrfRetried) {
            return Promise.reject(error);
          }
          // Attempt to get CSRF token from API endpoint (use fetch to avoid circular dependency)
          const refreshedCsrfToken = await fetchCsrfToken();
          if (refreshedCsrfToken && originalRequest) {
              // Retry the original request with the fresh CSRF token
              originalRequest._csrfRetried = true;
              originalRequest.headers['X-CSRF-Token'] = refreshedCsrfToken;
              console.log("[API] CSRF token refreshed, retrying request");
              return api(originalRequest);
          }
        } catch (tokenError) {
          console.warn("[API] Failed to fetch CSRF token:", tokenError);
          // Continue with original error handling
        }
      }

      // If session expired (cookie missing), suggest re-login
      if (errorCode === 'SESSION_EXPIRED') {
        console.warn("[API] CSRF token expired - possible session expiry");
        return Promise.reject({
          ...error,
          isSessionExpired: true,
          message: errorMessage,
        });
      }

      // If CSRF token is missing or mismatched, suggest refresh
      if (errorCode === 'CSRF_TOKEN_MISSING' || errorCode === 'CSRF_TOKEN_MISMATCH') {
        console.warn("[API] CSRF token issue - user should refresh page");
        if (typeof window !== "undefined" && !window.location.pathname.includes('/login')) {
          return Promise.reject({
            ...error,
            needsRefresh: true,
            message: errorMessage,
          });
        }
      }
    }

    // Handle admin session required (401) or wrong role (403) – redirect to admin login
    const status = error.response?.status;
    const message = error.response?.data?.message || "";
    const requestUrl = error.config?.url || "";

    // The /admin/me auth-check endpoint's 401 is handled by the useAuth queryFn
    const isAuthCheckRequest = requestUrl.includes('/admin/me');

    // Session logout routes: useAuth onError already navigates; don't double-redirect.
    const isLogoutRequest = requestUrl.includes('/sessions/') && requestUrl.includes('/logout');

    // On 401 or wrong-role 403 — redirect to login
    if ((status === 401 || (status === 403 && message.includes("Role"))) && !isAuthCheckRequest && !isLogoutRequest) {
      if (typeof window !== "undefined") {
        const isLoginPage = window.location.pathname === "/" || window.location.pathname === "/login";
        if (!isLoginPage) {
          // Suppress if within the post-login grace period
          if (isLoginGraceActive()) {
            console.warn(`[API] ${status} on ${requestUrl} — suppressed redirect (grace period active)`);
            return Promise.reject(error);
          }
          // Suppress if there is a cached admin — single-route 401 is likely transient.
          // Let ProtectedRoute handle a real session expiry via /admin/me.
          try {
            const { default: queryClient } = await import('../../api/queryClient');
            const cachedAdmin = queryClient.getQueryData(['adminAuth']);
            if (cachedAdmin) {
              console.warn(`[API] ${status} on ${requestUrl} — suppressed (admin cached), invalidating auth`);
              queryClient.invalidateQueries({ queryKey: ['adminAuth'] });
              return Promise.reject(error);
            }
          } catch {
            // queryClient import failed — fall through to redirect
          }
          console.warn(`[API] ${status} on ${requestUrl} — redirecting to login`);
          sessionStorage.setItem(
            "eazadmin_login_message",
            status === 401 ? "Session expired. Please log in again." : "Access denied. Please log in with an admin account."
          );
          window.location.href = "/";
        }
      }
      return Promise.reject(error);
    }


    // Handle network errors (backend not running / connection refused)
    if (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED')) {
      const networkError = new Error('Cannot reach the API server. Please ensure the backend is running (e.g. on port 4000).');
      networkError.isNetworkError = true;
      networkError.status = 0;
      networkError.code = error.code;
      console.warn('[API] Network error:', error.config?.url, error.message);
      return Promise.reject(networkError);
    }

    // Handle timeout errors with better messaging
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const isAuthEndpoint = error.config?.url?.includes('/me') ||
        error.config?.url?.includes('/login');
      const errorMessage = isAuthEndpoint
        ? 'Authentication request timed out. The server may be slow or unreachable. Please try again.'
        : error.response?.data?.message ||
        'Request timed out. Please check your connection and try again.';
      const timeoutError = new Error(errorMessage);
      timeoutError.isTimeout = true;
      timeoutError.status = 408;
      timeoutError.isAuthTimeout = isAuthEndpoint;
      // Hint to callers (e.g. React Query) not to auto-retry timeouts aggressively,
      // which can otherwise create request storms under backend load.
      timeoutError.shouldRetry = false;
      console.error(`[API] Timeout error on ${error.config?.url}:`, errorMessage);
      return Promise.reject(timeoutError);
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Request failed";

    // Last-chance: some Axios/React Query versions omit ERR_CANCELED but still set message.
    const em = String(errorMessage).trim().toLowerCase();
    if (em === 'canceled' || em === 'cancelled') {
      return Promise.reject(error);
    }

    // Don't log 404 errors as they're often expected (e.g., when trying multiple endpoints)
    // Only log if it's not a 404 or if it's a critical error
    if (error.response?.status !== 404 && error.response?.status !== 401) {
      console.error(`API Error: ${errorMessage}`, {
        url: error.config?.url,
        status: error.response?.status,
      });
    }

    return Promise.reject(error);
  }
);

export default api;
