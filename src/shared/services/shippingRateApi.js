import api from './api';

export const shippingRateService = {
  // Get all shipping rates
  getAllShippingRates: async (params = {}) => {
    // Remove empty string values from params to avoid sending them as query parameters
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
  
    const response = await api.get('/shipping-rates', { params: cleanParams });
    return response;
  },

  // Get rates by zone
  getRatesByZone: async (zone, params = {}) => {
    const response = await api.get(`/shipping-rates/zone/${zone}`, { params });
    return response.data;
  },

  // Create shipping rate
  createShippingRate: async (data) => {
    const response = await api.post('/shipping-rates', data);
    return response.data;
  },

  // Update shipping rate
  updateShippingRate: async (id, data) => {
    const response = await api.patch(`/shipping-rates/${id}`, data);
    return response.data;
  },

  // Delete shipping rate
  deleteShippingRate: async (id) => {
    const response = await api.delete(`/shipping-rates/${id}`);
    return response.data;
  },

  // Toggle shipping rate active status
  toggleShippingRate: async (id) => {
    const response = await api.patch(`/shipping-rates/${id}/toggle`);
    return response.data;
  },

  // Calculate shipping fee
  calculateFee: async ({ weight, shippingType, zone }) => {
    const response = await api.post('/shipping-rates/calculate', {
      weight,
      shippingType,
      zone,
    });
    return response.data;
  },
};

