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
  getUserDetails: (userId) => api.get(`/user/${userId}`),
  deleteUser: (userId) => api.delete(`/user/${userId}`),
};
export default adminUserApi;
