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
      return "https://eazworld.com/api/v1";
    }

    // Default production API
    return "https://eazworld.com/api/v1";
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
  // const method = config.method.toLowerCase();

  // Check if route is in the public list
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => normalizedPath === normalizePath(route)
  );

  // Skip authentication for public endpoints
  if (isPublicRoute) {
    console.log(`Public route: ${normalizedPath}, skipping authentication`);
    return config;
  }

  // Determine authentication token based on stored role
  const role = localStorage.getItem("current_role") || "admin";
  const tokenKey =
    role === "admin"
      ? "admin_token"
      : role === "seller"
      ? "seller_token"
      : "token";

  const token = localStorage.getItem(tokenKey);

  if (!token) {
    console.error(`No authentication token found for protected endpoint. Token key: ${tokenKey}, Role: ${role}`);
    console.error("Available localStorage keys:", Object.keys(localStorage));
    // Don't reject immediately - let the server handle 401
    // This allows the request to go through so we can see the actual error
  } else {
    // Add authorization headers only if token exists
    config.headers.Authorization = `Bearer ${token}`;
    config.headers["X-User-Role"] = role;
  }

  // Add subdomain information for seller context
  if (role === "admin") {
    config.headers["X-admin-Subdomain"] =
      window.location.hostname.split(".")[0] || "default";
  }

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration - DO NOT immediately logout
    // Let React Query and useAuth handle 401 errors with retry logic
    if (error.response?.status === 401) {
      console.warn("[API] 401 Unauthorized - letting useAuth handle retry/refresh");
      
      // Only log the error, don't clear tokens or redirect
      // React Query will retry, and useAuth will handle logout if retry fails
      const errorMessage = error.response?.data?.message || "Unauthorized";
      console.warn(`[API] Auth error: ${errorMessage}`);
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
