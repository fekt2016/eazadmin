import api from "./api";
export const authApi = {
  login: (credentials) => api.post("/admin/login", credentials),
  /** Bootstrap / first admin (public `POST /api/v1/admin/signup`). */
  register: (userData) => api.post("/admin/signup", userData),
  /** Superadmin creates another admin (`POST /api/v1/admin/register`, requires session + CSRF). */
  registerSubAdmin: (userData) => api.post("/admin/register", userData),
  // Use shared device-session logout for admin.
  // Backend route: DELETE /api/v1/sessions/admin/logout-all
  // This clears the admin_jwt cookie and blacklists the current token.
  logout: () => api.delete("/sessions/admin/logout-all"),
  getCurrentUser: async (options = {}) => {
    // Increase timeout for auth endpoint as it may take longer
    const response = await api.get("/admin/me", {
      timeout: 30000, // 30 seconds for auth endpoints
      ...options,
    });
    return response;
  },
  /**
   * Change password while logged in (requires CSRF + admin cookie).
   * PATCH /api/v1/admin/me/password
   */
  updateMyPassword: ({ currentPassword, newPassword, passwordConfirm }) =>
    api.patch("/admin/me/password", {
      currentPassword,
      newPassword,
      passwordConfirm,
    }),
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
