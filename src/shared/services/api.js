import axios from "axios";

// Determine base URL based on subdomain
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== "undefined") {
    const hostParts = window.location.hostname.split(".");

    // Local development
    if (hostParts.includes("localhost")) {
      return "http://localhost:4000/api/v1";
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

// Only these routes are public - all others require authentication
const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/admin/login",
  "/admin/register",
  "/admin/forgot-password",
  "/admin/reset-password",
];

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000, // Reduced timeout for better UX
});

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

// Request interceptor
api.interceptors.request.use((config) => {
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

  // SECURITY: Cookie-only authentication - no token storage
  // Cookies are automatically sent via withCredentials: true
  // Backend reads from req.cookies.admin_jwt (or seller_jwt/main_jwt based on route)
  
  // Add platform header (non-sensitive metadata)
  config.headers["x-platform"] = "eazadmin";
  
  // Add subdomain information for admin context (non-sensitive metadata)
  if (typeof window !== "undefined") {
    config.headers["X-admin-Subdomain"] =
      window.location.hostname.split(".")[0] || "default";
  }
  
  // CSRF token handling for state-changing requests (POST, PATCH, PUT, DELETE)
  const method = config.method?.toUpperCase();
  if (method && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method) && !isPublicRoute) {
    // Read CSRF token from cookie (synchronous)
    let csrfToken = null;
    if (typeof document !== "undefined") {
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };
      csrfToken = getCookie('csrf-token');
    }
    
    // If token not found in cookie, try to get it from localStorage (fallback)
    // This handles cases where cookie isn't readable due to domain/cross-origin issues
    if (!csrfToken && typeof window !== "undefined") {
      csrfToken = localStorage.getItem('csrf-token');
    }
    
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
      if (import.meta.env.DEV) {
        console.debug(`[API] CSRF token added to ${method} ${normalizedPath}`);
      }
    } else {
      // If token is still missing, this will cause a 403 error
      // The response interceptor will handle it and suggest refresh/re-login
      if (import.meta.env.DEV) {
        console.warn(`[API] ⚠️ CSRF token not found in cookie or localStorage for ${method} ${normalizedPath}`);
        console.warn(`[API] ⚠️ This may cause a 403 error. User may need to refresh the page or log in again.`);
      }
    }
  }
  
  // Use Vite's import.meta.env.DEV or fallback to __DEV__ if polyfilled
  const isDev = import.meta.env.DEV || (typeof __DEV__ !== "undefined" && __DEV__);
  
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
    // Store CSRF token from response cookie if available (for cross-origin cookie issues)
    // This is a fallback for when cookies aren't readable due to domain/cross-origin issues
    if (response.headers['set-cookie']) {
      const csrfCookie = response.headers['set-cookie']
        .find(cookie => cookie.startsWith('csrf-token='));
      if (csrfCookie && typeof window !== "undefined") {
        const tokenMatch = csrfCookie.match(/csrf-token=([^;]+)/);
        if (tokenMatch && tokenMatch[1]) {
          localStorage.setItem('csrf-token', tokenMatch[1]);
        }
      }
    }
    return response;
  },
  async (error) => {
    // Handle CSRF token errors (403)
    if (error.response?.status === 403) {
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message || "Invalid security token";
      
      // Try to fetch CSRF token from endpoint as fallback
      if (errorCode === 'CSRF_TOKEN_MISSING' || errorCode === 'CSRF_TOKEN_MISMATCH') {
        try {
          // Attempt to get CSRF token from API endpoint (use fetch to avoid circular dependency)
          const tokenResponse = await fetch(`${baseURL}/csrf-token`, {
            method: 'GET',
            credentials: 'include', // Include cookies
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            
            if (tokenData?.csrfToken) {
              // Store token in localStorage as fallback
              if (typeof window !== "undefined") {
                localStorage.setItem('csrf-token', tokenData.csrfToken);
              }
              
              // Retry the original request with new token
              const originalRequest = error.config;
              originalRequest.headers['X-CSRF-Token'] = tokenData.csrfToken;
              
              console.log("[API] CSRF token refreshed, retrying request");
              return api(originalRequest);
            }
          }
        } catch (tokenError) {
          console.warn("[API] Failed to fetch CSRF token:", tokenError);
          // Continue with original error handling
        }
      }
      
      // If session expired (cookie missing), suggest re-login
      if (errorCode === 'SESSION_EXPIRED') {
        console.warn("[API] CSRF token expired - session may have expired");
        // Clear localStorage token as well
        if (typeof window !== "undefined") {
          localStorage.removeItem('csrf-token');
        }
        // Don't auto-redirect, let the component handle it
        return Promise.reject({
          ...error,
          isSessionExpired: true,
          message: errorMessage,
        });
      }
      
      // If CSRF token is missing or mismatched, suggest refresh
      if (errorCode === 'CSRF_TOKEN_MISSING' || errorCode === 'CSRF_TOKEN_MISMATCH') {
        console.warn("[API] CSRF token issue - user should refresh page");
        // Clear potentially stale token
        if (typeof window !== "undefined") {
          localStorage.removeItem('csrf-token');
        }
        // Suggest page refresh to get new token
        if (typeof window !== "undefined" && !window.location.pathname.includes('/login')) {
          // Only suggest refresh if not already on login page
          return Promise.reject({
            ...error,
            needsRefresh: true,
            message: errorMessage,
          });
        }
      }
    }
    
    // Handle session expiration - DO NOT immediately logout
    // Let React Query and useAuth handle 401 errors with retry logic
    if (error.response?.status === 401) {
      console.warn("[API] 401 Unauthorized - letting useAuth handle retry/refresh");
      
      // Only log the error, don't clear tokens or redirect
      // React Query will retry, and useAuth will handle logout if retry fails
      const errorMessage = error.response?.data?.message || "Unauthorized";
      console.warn(`[API] Auth error: ${errorMessage}`);
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
