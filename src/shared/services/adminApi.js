import api from "./api";
export const authApi = {
  login: (credentials) => api.post("/admin/login", credentials),
  register: (userData) => api.post("/admin/register", userData),
  // Use shared device-session logout for admin.
  // Backend route: DELETE /api/v1/sessions/admin/logout-all
  // This clears the admin_jwt cookie and blacklists the current token.
  logout: () => api.delete("/sessions/admin/logout-all"),
  getCurrentUser: async () => {
    // Increase timeout for auth endpoint as it may take longer
    const response = await api.get("/admin/me", {
      timeout: 30000, // 30 seconds for auth endpoints
    });
    return response;
  },
  // ==================================================
  // UNIFIED EMAIL-ONLY PASSWORD RESET FLOW
  // ==================================================
  
  /**
   * Request Password Reset (Email Only)
   * POST /api/v1/admin/forgot-password
   * Body: { email: "admin@example.com" }
   */
  requestPasswordReset: async (email) => {
    const response = await api.post("/admin/forgot-password", { email });
    return response.data;
  },

  /**
   * Reset Password with Token
   * POST /api/v1/admin/reset-password
   * Body: { token: "reset_token", newPassword: "newpass123", confirmPassword: "newpass123" }
   */
  resetPasswordWithToken: async (token, newPassword, confirmPassword) => {
    const response = await api.post("/admin/reset-password", {
      token,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  // Legacy endpoints (kept for backward compatibility)
  forgotPassword: (email) => api.post("/admin/forgotPassword", { email }),
  resetPassword: ({ token, password }) =>
    api.post(`/admin/reset-password/${token}`, { password }),
};
