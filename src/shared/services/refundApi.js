import api from './api';

/**
 * Admin Refund API Service
 * Handles all refund-related API calls for admin
 */
export const refundService = {
  /**
   * Get all refunds with filters and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getAllRefunds: async (params = {}) => {
    const {
      status,
      page = 1,
      limit = 10,
      search = '',
      startDate = '',
      endDate = '',
      buyerEmail = '',
      sellerName = '',
      orderId = '',
    } = params;

    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (search) queryParams.append('search', search);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (buyerEmail) queryParams.append('buyerEmail', buyerEmail);
    if (sellerName) queryParams.append('sellerName', sellerName);
    if (orderId) queryParams.append('orderId', orderId);

    const response = await api.get(`/admin/refunds?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get a single refund by ID
   * @param {string} refundId - Refund ID
   * @returns {Promise} API response
   */
  getRefundById: async (refundId) => {
    const response = await api.get(`/admin/refunds/${refundId}`);
    return response.data;
  },

  /**
   * Approve a full refund
   * @param {string} refundId - Refund ID
   * @param {Object} data - Approval data (notes, etc.)
   * @returns {Promise} API response
   */
  approveRefund: async (refundId, data = {}) => {
    const response = await api.post(`/admin/refunds/${refundId}/approve`, data);
    return response.data;
  },

  /**
   * Approve a partial refund
   * @param {string} refundId - Refund ID
   * @param {Object} data - Partial refund data (amount, notes, etc.)
   * @returns {Promise} API response
   */
  approvePartialRefund: async (refundId, data) => {
    const response = await api.post(`/admin/refunds/${refundId}/approve-partial`, data);
    return response.data;
  },

  /**
   * Reject a refund request
   * @param {string} refundId - Refund ID
   * @param {Object} data - Rejection data (reason, notes, etc.)
   * @returns {Promise} API response
   */
  rejectRefund: async (refundId, data) => {
    const response = await api.post(`/admin/refunds/${refundId}/reject`, data);
    return response.data;
  },

  /**
   * Update refund status or add admin notes
   * @param {string} refundId - Refund ID
   * @param {Object} data - Update data
   * @returns {Promise} API response
   */
  updateRefund: async (refundId, data) => {
    const response = await api.patch(`/admin/refunds/${refundId}`, data);
    return response.data;
  },
};

export default refundService;

