import api from "./api";
export const authApi = {
  login: (credentials) => api.post("/admin/login", credentials),
  register: (userData) => api.post("/admin/register", userData),
  logout: () => api.post("/admin/logout"),
  getCurrentUser: async () => {
    const response = await api.get("/admin/me");
    return response;
  },
  forgotPassword: (email) => api.post("/admin/forgot-password", { email }),
  resetPassword: ({ token, password }) =>
    api.post(`/admin/reset-password/${token}`, { password }),
};
