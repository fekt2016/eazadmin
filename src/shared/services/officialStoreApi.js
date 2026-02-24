import api from './api';

export const officialStoreService = {
  // Get all Official Store products
  getOfficialStoreProducts: async () => {
    try {
      const response = await api.get('/eazshop/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching Official Store products:', error);
      throw error;
    }
  },

  // Create Official Store product
  createOfficialStoreProduct: async (formData) => {
    try {
      const response = await api.post('/eazshop/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating Official Store product:', error);
      throw error;
    }
  },

  // Update Official Store product
  updateOfficialStoreProduct: async (id, formData) => {
    try {
      const response = await api.patch(`/eazshop/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating Official Store product:', error);
      throw error;
    }
  },

  // Toggle Official Store product status
  toggleOfficialStoreProduct: async (id) => {
    try {
      const response = await api.patch(`/eazshop/products/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling Official Store product:', error);
      throw error;
    }
  },

  // Get Official Store orders
  getOfficialStoreOrders: async () => {
    try {
      const response = await api.get('/eazshop/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching Official Store orders:', error);
      throw error;
    }
  },

  // Get Official Store shipping fees
  getOfficialStoreShippingFees: async () => {
    try {
      const response = await api.get('/eazshop/shipping-fees');
      return response.data;
    } catch (error) {
      console.error('Error fetching Official Store shipping fees:', error);
      throw error;
    }
  },

  // Update Official Store shipping fees
  updateOfficialStoreShippingFees: async (fees) => {
    try {
      const response = await api.patch('/eazshop/shipping-fees', fees);
      return response.data;
    } catch (error) {
      console.error('Error updating Official Store shipping fees:', error);
      throw error;
    }
  },

  // Get pickup centers
  getPickupCenters: async (city) => {
    try {
      const params = city ? { city } : {};
      const response = await api.get('/eazshop/pickup-centers', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching pickup centers:', error);
      throw error;
    }
  },

  // Mark product as Official Store product
  markProductAsOfficial: async (id) => {
    try {
      const response = await api.patch(`/eazshop/products/${id}/mark-official`);
      return response.data;
    } catch (error) {
      console.error('Error marking product as Official Store:', error);
      throw error;
    }
  },

  // Unmark product as Official Store product
  unmarkProductAsOfficial: async (id) => {
    try {
      const response = await api.patch(`/eazshop/products/${id}/unmark-official`);
      return response.data;
    } catch (error) {
      console.error('Error unmarking product as Official Store:', error);
      throw error;
    }
  },
};

