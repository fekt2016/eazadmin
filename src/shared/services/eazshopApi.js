import api from './api';

export const eazshopService = {
  // Get all EazShop products
  getEazShopProducts: async () => {
    try {
      const response = await api.get('/eazshop/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching EazShop products:', error);
      throw error;
    }
  },

  // Create EazShop product
  createEazShopProduct: async (formData) => {
    try {
      const response = await api.post('/eazshop/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating EazShop product:', error);
      throw error;
    }
  },

  // Update EazShop product
  updateEazShopProduct: async (id, formData) => {
    try {
      const response = await api.patch(`/eazshop/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating EazShop product:', error);
      throw error;
    }
  },

  // Toggle EazShop product status
  toggleEazShopProduct: async (id) => {
    try {
      const response = await api.patch(`/eazshop/products/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling EazShop product:', error);
      throw error;
    }
  },

  // Get EazShop orders
  getEazShopOrders: async () => {
    try {
      const response = await api.get('/eazshop/orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching EazShop orders:', error);
      throw error;
    }
  },

  // Get EazShop shipping fees
  getEazShopShippingFees: async () => {
    try {
      const response = await api.get('/eazshop/shipping-fees');
      return response.data;
    } catch (error) {
      console.error('Error fetching EazShop shipping fees:', error);
      throw error;
    }
  },

  // Update EazShop shipping fees
  updateEazShopShippingFees: async (fees) => {
    try {
      const response = await api.patch('/eazshop/shipping-fees', fees);
      return response.data;
    } catch (error) {
      console.error('Error updating EazShop shipping fees:', error);
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

  // Mark product as EazShop product
  markProductAsEazShop: async (id) => {
    try {
      const response = await api.patch(`/eazshop/products/${id}/mark-eazshop`);
      return response.data;
    } catch (error) {
      console.error('Error marking product as EazShop:', error);
      throw error;
    }
  },

  // Unmark product as EazShop product
  unmarkProductAsEazShop: async (id) => {
    try {
      const response = await api.patch(`/eazshop/products/${id}/unmark-eazshop`);
      return response.data;
    } catch (error) {
      console.error('Error unmarking product as EazShop:', error);
      throw error;
    }
  },
};

