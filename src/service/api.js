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

    // Seller subdomain handling
    const subdomain = hostParts[0];
    if (subdomain === "admin") {
      return "https://admin.api.yourdomain.com/api/v1";
    }

    // Default production API
    return "https://api.yourdomain.com/api/v1";
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
    console.error("No authentication token found for protected endpoint");
    return Promise.reject(new Error("Authentication required"));
  }

  // Add authorization headers
  config.headers.Authorization = `Bearer ${token}`;
  config.headers["X-User-Role"] = role;

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
    // Handle session expiration
    if (error.response?.status === 401) {
      console.warn("Session expired, redirecting to login");

      // Determine redirect based on user role
      const role = error.config.headers["X-User-Role"] || "admin";
      const redirectPath = role === "admin" ? "/" : "";

      // Clear relevant tokens
      localStorage.removeItem(`${role}_token`);
      localStorage.removeItem("current_role");

      if (typeof window !== "undefined") {
        window.location.href = redirectPath;
      }
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Request failed";

    console.error(`API Error: ${errorMessage}`, {
      url: error.config?.url,
      status: error.response?.status,
    });

    return Promise.reject(error);
  }
);

export default api;
