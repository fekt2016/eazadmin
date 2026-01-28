import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from '../services/adminApi';

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

export default function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 1️⃣ Fetch current admin user
  // SECURITY: Cookie-only authentication - no token check needed
  // Backend reads from HTTP-only cookie automatically
  const {
    data: adminData,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["adminAuth"],
    queryFn: async () => {
      try {
        const response = await authApi.getCurrentUser();
        return response; // Return user object directly
      } catch (error) {
        // 401 is expected when cookie is expired/missing - not an error, just unauthenticated state
        if (error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: (failureCount, error) => {
      // Retry up to 2 times, but not on 401 (server confirmed auth failure)
      if (error?.response?.status === 401) {
        return false; // Don't retry 401s
      }
      return failureCount < 2; // Retry network errors
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
      
      queryClient.setQueryData(["adminAuth"], user); // Set user object directly
    },
  });

  // 3️⃣ REGISTER mutation
  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      // SECURITY: Token is in HTTP-only cookie, NOT in response
      const user = response.data?.user || response.data?.data?.user || response.data;
      
      // Store non-sensitive role preference only
      if (typeof window !== "undefined") {
        localStorage.setItem("current_role", "admin");
      }
      
      queryClient.setQueryData(["adminAuth"], user); // Set user object directly
    },
  });

  // 4️⃣ LOGOUT mutation
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
    adminData, // User object (or null)
    isLoading, // Loading state
    isError, // Error state
    error: queryError, // Error object from query
    // isAuthenticated: !!data, // True if user exists
    // isAdmin: data?.role === "admin",
    login,
    register,
    logout,
    // Unified email-only password reset
    requestPasswordReset,
    resetPasswordWithToken,
  };
}
