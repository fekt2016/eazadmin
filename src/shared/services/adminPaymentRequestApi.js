import api from './api';

const adminPaymentRequestApi = {
  // Get all pending payment requests (admin)
  getPendingRequests: async () => {
    const response = await api.get('/paymentrequest/admin/pending');
    return response;
  },

  // Process a payment request (approve or reject)
  processPaymentRequest: async (requestId, data) => {
    const response = await api.put(`/paymentrequest/admin/${requestId}/process`, data);
    return response;
  },

  // Get all payment requests (with filters)
  getAllPaymentRequests: async (params = {}) => {
    const response = await api.get('/paymentrequest/admin/pending', { params });
    return response;
  },

  // Get a single payment request by ID (admin)
  getPaymentRequestById: async (requestId) => {
    const response = await api.get(`/paymentrequest/admin/${requestId}`);
    return response;
  },
};

export default adminPaymentRequestApi;

