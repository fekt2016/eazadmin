import api from "./api";
const adminSellerApi = {
  getAllSellers: (params) => {
    const validatedParams = {
      page: params?.page || 1,
      limit: params?.limit || 10,
      search: params?.search || undefined,
      sort: params?.sort || "createdAt:desc",
      verificationStatus: params?.verificationStatus || undefined,
      onboardingStage: params?.onboardingStage || undefined,
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
  getSellerDetails: (sellerId, config = {}) => api.get(`/seller/${sellerId}`, config),
  deleteSeller: (sellerId) => api.delete(`/seller/${sellerId}`),
  approveSellerVerification: (sellerId) => api.patch(`/seller/${sellerId}/approve-verification`),
  rejectSellerVerification: (sellerId, reason) => api.patch(`/seller/${sellerId}/reject-verification`, { reason }),
  // Payout verification endpoints (already added above)
  updateDocumentStatus: (sellerId, documentType, status) => 
    api.patch(`/seller/${sellerId}/document-status`, { documentType, status }, {
      timeout: 30000, // 30 seconds timeout for document status updates
    }),
  getSellerBalance: (sellerId) => api.get(`/admin/seller/${sellerId}/balance`),
  resetSellerBalance: (sellerId, data) => api.patch(`/admin/seller/${sellerId}/reset-balance`, data),
  resetLockedBalance: (sellerId, data) => api.patch(`/admin/seller/${sellerId}/reset-locked-balance`, data),
  // Payout verification endpoints (NEW SEPARATED ROUTES)
  approveSellerPayout: (sellerId, data) => api.patch(`/admin/sellers/${sellerId}/payout/approve`, data),
  rejectSellerPayout: (sellerId, reason) => api.patch(`/admin/sellers/${sellerId}/payout/reject`, { reason }),
  getPayoutVerificationDetails: (sellerId) => api.get(`/admin/sellers/${sellerId}/payout`, {
    timeout: 20000, // 20 seconds timeout for payment method details
  }),
};
export default adminSellerApi;
