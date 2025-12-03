import api from './api';

const adminPayoutApi = {
  // Get all withdrawal requests
  getAllWithdrawalRequests: async (params = {}) => {
    try {
      const response = await api.get('/admin/payout/requests', { params });
      return response.data;
    } catch (error) {
      console.error('[adminPayoutApi] Error fetching withdrawal requests:', error);
      throw error;
    }
  },

  // Get single withdrawal request
  getWithdrawalRequest: async (requestId) => {
    try {
      const response = await api.get(`/admin/payout/request/${requestId}`);
      return response.data;
    } catch (error) {
      console.error('[adminPayoutApi] Error fetching withdrawal request:', error);
      throw error;
    }
  },

  // Approve withdrawal request
  approveWithdrawalRequest: async (requestId) => {
    try {
      const response = await api.post(`/admin/payout/request/${requestId}/approve`);
      return response.data;
    } catch (error) {
      console.error('[adminPayoutApi] Error approving withdrawal request:', error);
      throw error;
    }
  },

  // Reject withdrawal request
  rejectWithdrawalRequest: async (requestId, reason) => {
    try {
      const response = await api.post(`/admin/payout/request/${requestId}/reject`, { reason });
      return response.data;
    } catch (error) {
      console.error('[adminPayoutApi] Error rejecting withdrawal request:', error);
      throw error;
    }
  },

  // Verify transfer status
  verifyTransferStatus: async (requestId) => {
    try {
      const response = await api.post(`/admin/payout/request/${requestId}/verify`);
      return response.data;
    } catch (error) {
      console.error('[adminPayoutApi] Error verifying transfer status:', error);
      throw error;
    }
  },
};

export default adminPayoutApi;

