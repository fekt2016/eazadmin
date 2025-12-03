import api from './api';

export const neighborhoodService = {
  /**
   * Get all neighborhoods (admin view with pagination and filtering)
   * GET /api/v1/admin/neighborhoods
   */
  getAllNeighborhoods: async (params = {}) => {
    const { page = 1, limit = 50, ...otherParams } = params;
    const response = await api.get('/admin/neighborhoods', {
      params: { page, limit, ...otherParams },
    });
    return response.data;
  },

  /**
   * Get neighborhood statistics
   * GET /api/v1/admin/neighborhoods/statistics
   */
  getStatistics: async () => {
    const response = await api.get('/admin/neighborhoods/statistics');
    return response.data;
  },

  /**
   * Get a single neighborhood
   * GET /api/v1/admin/neighborhoods/:id
   */
  getNeighborhood: async (id) => {
    const response = await api.get(`/admin/neighborhoods/${id}`);
    return response.data;
  },

  /**
   * Create a new neighborhood
   * POST /api/v1/admin/neighborhoods
   */
  createNeighborhood: async (data) => {
    const response = await api.post('/admin/neighborhoods', data);
    return response.data;
  },

  /**
   * Update a neighborhood
   * PATCH /api/v1/admin/neighborhoods/:id
   */
  updateNeighborhood: async (id, data) => {
    const response = await api.patch(`/admin/neighborhoods/${id}`, data);
    return response.data;
  },

  /**
   * Delete a neighborhood
   * DELETE /api/v1/admin/neighborhoods/:id
   */
  deleteNeighborhood: async (id) => {
    const response = await api.delete(`/admin/neighborhoods/${id}`);
    return response.data;
  },

  /**
   * Refresh coordinates for a neighborhood
   * POST /api/v1/admin/neighborhoods/:id/refresh-coordinates
   */
  refreshCoordinates: async (id) => {
    const response = await api.post(`/admin/neighborhoods/${id}/refresh-coordinates`);
    return response.data;
  },

  /**
   * Recalculate distance and zone for a neighborhood
   * PATCH /api/v1/admin/neighborhoods/:id/recalculate
   */
  recalculateNeighborhood: async (id) => {
    const response = await api.patch(`/admin/neighborhoods/${id}/recalculate`);
    return response.data;
  },

  /**
   * Toggle neighborhood active status
   * PATCH /api/v1/admin/neighborhoods/:id/toggle-active
   */
  toggleActive: async (id) => {
    const response = await api.patch(`/admin/neighborhoods/${id}/toggle-active`);
    return response.data;
  },

  /**
   * Get Google Maps embed URL for route from HQ to neighborhood
   * GET /api/v1/neighborhoods/:id/map-url
   */
  getMapUrl: async (id) => {
    const response = await api.get(`/neighborhoods/${id}/map-url`);
    return response.data;
  },
};

