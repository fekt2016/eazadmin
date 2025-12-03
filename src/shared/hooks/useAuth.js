import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from '../services/adminApi';

const TOKEN_KEY = "admin_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("current_role");
}

function validateToken(token) {
  if (!token) return false;
  try {
    const [, payloadB64] = token.split(".");
    const { exp } = JSON.parse(atob(payloadB64));
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function useAuth() {
  const queryClient = useQueryClient();
  const token = getToken();

  // 1️⃣ Fetch current admin user
  const {
    data: adminData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["adminAuth"],
    queryFn: async () => {
      // Only validate token if it exists - don't clear immediately on expiry
      // Let server validate and return proper error
      if (token && !validateToken(token)) {
        console.warn("[useAuth] Token expired client-side, but attempting server validation");
        // Don't clear token yet - let server confirm
      }
      
      try {
        const response = await authApi.getCurrentUser();
        return response; // Return user object directly
      } catch (error) {
        // Only clear token after server confirms 401 (not on network errors)
        if (error.response?.status === 401) {
          console.warn("[useAuth] Server confirmed 401 - clearing token");
          clearToken();
        }
        // Don't throw for 401 - return null to allow graceful handling
        if (error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!token,
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
      const { token: newToken, user } = response.data;
      if (!validateToken(newToken)) {
        throw new Error("Invalid token received");
      }
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem("current_role", "admin");
      queryClient.setQueryData(["adminAuth"], user); // Set user object directly
    },
  });

  // 3️⃣ REGISTER mutation
  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (response) => {
      const { token: newToken, user } = response.data;
      if (!validateToken(newToken)) {
        throw new Error("Invalid token received");
      }
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem("current_role", "admin");
      queryClient.setQueryData(["adminAuth"], user); // Set user object directly
    },
  });

  // 4️⃣ LOGOUT mutation
  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearToken();
      queryClient.removeQueries(["adminAuth"]);
    },
    onError: () => {
      clearToken();
      queryClient.removeQueries(["adminAuth"]);
    },
  });

  return {
    adminData, // User object (or null)
    isLoading, // Loading state
    isError, // Error state
    // isAuthenticated: !!data, // True if user exists
    // isAdmin: data?.role === "admin",
    login,
    register,
    logout,
  };
}
