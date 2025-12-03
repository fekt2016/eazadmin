import api from "./api";
const adminUserApi = {
  getAllUsers: (params) => {
    const validatedParams = {
      page: params?.page || 1,
      limit: params?.limit || 10,
      search: params?.search || undefined,
      sort: params?.sort || "createdAt:desc",
    };
    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(validatedParams).filter(([v]) => v !== undefined)
    );

    return api.get(`/users`, { params: cleanParams });
  },
  updateUserStatus: (status) => {
    const { userId, status: newStatus } = status;
    if (!userId || !newStatus) {
      throw new Error("sellerId and newStatus are required");
    }
    return api.patch(`/seller/${userId}/status`, { newStatus });
  },
  getUserDetails: (userId) => api.get(`/users/${userId}`),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  getAllAdmins: (params) => {
    const validatedParams = {
      page: params?.page || 1,
      limit: params?.limit || 10,
      search: params?.search || undefined,
      sort: params?.sort || "createdAt:desc",
    };
    // Remove undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(validatedParams).filter(([v]) => v !== undefined)
    );

    return api.get(`/admin`, { params: cleanParams });
  },
  getAdminDetails: (adminId) => api.get(`/admin/${adminId}`),
  updateAdmin: (adminId, data) => api.patch(`/admin/${adminId}`, data),
  deleteAdmin: (adminId) => api.delete(`/admin/${adminId}`),
};
export default adminUserApi;
