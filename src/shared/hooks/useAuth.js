import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from '../services/adminApi';
import { markRecentLogin } from '../services/api';

// SECURITY: Cookie-only authentication - no token storage
// Tokens are in HTTP-only cookies set by backend
// No localStorage, sessionStorage, or any client-side token storage

function clearAuthData() {
  // SECURITY: No token storage to clear - cookies are managed by backend
  // Backend logout endpoint clears the cookie
  // Only clear non-sensitive localStorage items if needed
  if (typeof window !== "undefined") {
    localStorage.removeItem("current_role"); // Non-sensitive role preference only
  }
}

// Public/auth pages where the admin cookie is not expected to exist.
// The auth query must NOT auto-fetch on these pages; doing so creates an
// in-flight GET /admin/me (no cookie → 401) that can arrive at the axios
// interceptor *after* the user has navigated to /dashboard, triggering the
// "session expired" redirect even though login succeeded.
const AUTH_PAGE_PATHS = ['/', '/login', '/forgot-password', '/reset-password'];

function isAuthPage() {
  if (typeof window === 'undefined') return false;
  const p =
    typeof window.location?.pathname === 'string'
      ? window.location.pathname
      : '';
  return AUTH_PAGE_PATHS.some(ap => p === ap || p.startsWith(ap + '/'));
}

export default function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1️⃣ Fetch current admin user
  // SECURITY: Cookie-only authentication - no token check needed
  // Backend reads from HTTP-only cookie automatically
  const {
    data: adminData,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetch: refetchAuth,
  } = useQuery({
    queryKey: ["adminAuth"],
    queryFn: async ({ signal }) => {
      try {
        const response = await authApi.getCurrentUser({ signal });
        return response; // Return user object directly
      } catch (error) {
        // Cancelled queries (e.g. via cancelQueries after login): re-throw so
        // React Query discards the result without updating the cache.
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
          throw error;
        }
        // 401 = cookie expired/missing; 403 = wrong role – treat as unauthenticated
        if (error.response?.status === 401 || error.response?.status === 403) {
          return null;
        }
        throw error;
      }
    },
    // Do NOT auto-fetch on login/forgot-password pages.
    // There is no admin cookie on those pages so the fetch would return 401.
    // If that in-flight 401 response arrives after the user navigates to
    // /dashboard, the axios interceptor fires the "session expired" redirect.
    enabled: !isAuthPage(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      // Never retry on 401/403 or on cancelled requests
      if (error?.response?.status === 401 || error?.response?.status === 403) return false;
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return false;
      return failureCount < 2; // Retry transient network errors
    },
    refetchOnWindowFocus: false, // Prevent frequent refetches
  });

  // 2️⃣ LOGIN mutation
  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      // SECURITY: Token is in HTTP-only cookie, NOT in response
      // Backend sets cookie automatically - no token storage needed
      const user = response.data?.user || response.data?.data?.user || response.data;

      // Store non-sensitive role preference only
      if (typeof window !== "undefined") {
        localStorage.setItem("current_role", "admin");
      }

      // Activate grace period to suppress spurious "session expired" redirects
      // that can occur during the brief window right after login completes.
      markRecentLogin();

      // Cancel any in-flight GET /admin/me request from the login page.
      // Without this, a 401 response arriving after navigation to /dashboard
      // triggers the interceptor redirect ("session expired") even though login succeeded.
      queryClient.cancelQueries({ queryKey: ["adminAuth"] });
      queryClient.setQueryData(["adminAuth"], user); // Set user object directly
    },
  });

  // 3️⃣ LOGOUT mutation
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuthData();
      queryClient.removeQueries(["adminAuth"]);
      queryClient.clear();
      // After successful logout, redirect to admin login page
      navigate("/login");
    },
    onError: () => {
      clearAuthData();
      queryClient.removeQueries(["adminAuth"]);
      queryClient.clear();
      // Even if backend logout fails, send user to login to force fresh auth
      navigate("/login");
    },
  });

  // ==================================================
  // UNIFIED EMAIL-ONLY PASSWORD RESET FLOW
  // ==================================================
  
  /**
   * Request Password Reset (Email Only)
   * Sends reset link to admin's email
   */
  const requestPasswordReset = useMutation({
    mutationFn: async (email) => {
      const response = await authApi.requestPasswordReset(email);
      return response;
    },
    onSuccess: (data) => {
      if (import.meta.env.DEV) {
        console.debug("[useAuth] Password reset request sent:", data);
      }
    },
    onError: (error) => {
      console.error("[useAuth] Error requesting password reset:", error);
    },
  });

  /**
   * Reset Password with Token
   * Resets password using token from email link
   */
  const resetPasswordWithToken = useMutation({
    mutationFn: async ({ token, newPassword, confirmPassword }) => {
      const response = await authApi.resetPasswordWithToken(
        token,
        newPassword,
        confirmPassword
      );
      return response;
    },
    onSuccess: (data) => {
      if (import.meta.env.DEV) {
        console.debug("[useAuth] Password reset successful:", data);
      }
      // Navigate to login page with success message
      navigate("/login", {
        state: {
          message:
            "Password reset successfully. Please login with your new password.",
        },
      });
    },
    onError: (error) => {
      console.error("[useAuth] Error resetting password:", error);
    },
  });

  return {
    adminData,
    isLoading,
    isFetching,
    isError,
    error: queryError,
    refetchAuth,
    login,
    logout,
    requestPasswordReset,
    resetPasswordWithToken,
  };
}
