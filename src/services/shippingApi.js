import api from '../shared/services/api';

/**
 * Get all shipping charges (paginated & filtered)
 */
export const getAllShippingCharges = async (params = {}) => {
    const response = await api.get('/admin/shipping/charges', { params });
    return response.data;
};

/**
 * Get a specific shipping charge by order ID
 */
export const getShippingChargeByOrder = async (orderId) => {
    const response = await api.get(`/admin/shipping/charges/order/${orderId}`);
    return response.data;
};

/**
 * Get summary of shipping charges collected, payouts, and platform cut
 */
export const getShippingChargesSummary = async (params = {}) => {
    const response = await api.get('/admin/shipping/charges/summary', { params });
    return response.data;
};

/**
 * Get the current active platform shipping rate
 */
export const getShippingRate = async () => {
    const response = await api.get('/admin/shipping/rate');
    return response.data;
};

/**
 * Update the platform shipping rate
 */
export const updateShippingRate = async (data) => {
    const response = await api.put('/admin/shipping/rate', data);
    return response.data;
};

/**
 * Mark a shipping charge (dispatcher payout) as settled
 */
export const settleShippingCharge = async (id) => {
    const response = await api.patch(`/admin/shipping/charges/${id}/settle`);
    return response.data;
};
