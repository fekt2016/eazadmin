import api from "./api";
const adminSellerApi = {
  getAllSellers: (params) => {
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

    return api.get(`/seller`, { params: cleanParams });
  },
  updateSellerStatus: (status) => {
    const { sellerId, status: newStatus } = status;
    if (!sellerId || !newStatus) {
      throw new Error("sellerId and newStatus are required");
    }
    return api.patch(`/seller/${sellerId}/status`, { newStatus });
  },
  updateSeller: (sellerId, data) => api.patch(`/seller/${sellerId}`, data),
  getSellerDetails: (sellerId) => api.get(`/seller/${sellerId}`),
  deleteSeller: (sellerId) => api.delete(`/seller/${sellerId}`),
  approveSellerVerification: (sellerId) => api.patch(`/seller/${sellerId}/approve-verification`),
  rejectSellerVerification: (sellerId, reason) => api.patch(`/seller/${sellerId}/reject-verification`, { reason }),
  updateDocumentStatus: (sellerId, documentType, status) => 
    api.patch(`/seller/${sellerId}/document-status`, { documentType, status }),
  getSellerBalance: (sellerId) => api.get(`/admin/seller/${sellerId}/balance`),
  resetSellerBalance: (sellerId, data) => api.patch(`/admin/seller/${sellerId}/reset-balance`, data),
  resetLockedBalance: (sellerId, data) => api.patch(`/admin/seller/${sellerId}/reset-locked-balance`, data),
};
export default adminSellerApi;
