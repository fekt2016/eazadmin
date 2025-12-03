import api from './api';

export const shippingZoneService = {
  /**
   * Get all shipping zones
   * GET /api/v1/shipping-zones
   */
  getAllShippingZones: async (filters = {}) => {
    // Remove empty string values from filters
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    const params = new URLSearchParams();
    if (cleanFilters.isActive !== undefined && cleanFilters.isActive !== '') {
      params.append('isActive', cleanFilters.isActive);
    }
    
    const queryString = params.toString();
    const url = queryString ? `/shipping-zones?${queryString}` : '/shipping-zones';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Get shipping zone by ID
   * GET /api/v1/shipping-zones/:id
   */
  getShippingZone: async (id) => {
    const response = await api.get(`/shipping-zones/${id}`);
    return response.data;
  },

  /**
   * Create shipping zone
   * POST /api/v1/shipping-zones
   */
  createShippingZone: async (data) => {
    const response = await api.post('/shipping-zones', data);
    return response.data;
  },

  /**
   * Update shipping zone
   * PATCH /api/v1/shipping-zones/:id
   */
  updateShippingZone: async (id, data) => {
    const response = await api.patch(`/shipping-zones/${id}`, data);
    return response.data;
  },

  /**
   * Delete shipping zone
   * DELETE /api/v1/shipping-zones/:id
   */
  deleteShippingZone: async (id) => {
    const response = await api.delete(`/shipping-zones/${id}`);
    return response.data;
  },

  /**
   * Toggle shipping zone active status
   * PATCH /api/v1/shipping-zones/:id/toggle
   */
  toggleShippingZone: async (id) => {
    const response = await api.patch(`/shipping-zones/${id}/toggle`);
    return response.data;
  },
};

