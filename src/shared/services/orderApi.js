import api from '../services/api';

export const orderService = {
  // createOrder: async (data) => {
  //   const response = await api.post("/order", data);
  //   return response;
  // },
  getAllOrders: async () => {
    try {
      const response = await api.get("/order");
      console.log("API Response - getAllOrders:", response);
      
      return response;
    } catch (error) {
      console.log("API Error - getAllOrders:", error);
    }
  },
  getOrderById: async (id) => {
    try {
      const response = await api.get(`/order/${id}`);
      console.log("API Response - getOrderById:", response);
      return response;
    } catch (error) {
      console.log("API Error - getOrderById:", error);
    }
  },
  getOrderByTrackingNumber: async (trackingNumber) => {
    try {
      if (!trackingNumber) {
        throw new Error("Tracking number is required");
      }
      const response = await api.get(`/order/track/${trackingNumber}`);
      // Return the full response structure for consistency
      return response.data;
    } catch (error) {
      console.error("Error fetching order by tracking number:", error);
      // Re-throw with enhanced error information
      throw error;
    }
  },
  addTrackingUpdate: async (orderId, trackingData) => {
    try {
      if (!orderId) {
        throw new Error("Order ID is required");
      }
      if (!trackingData || !trackingData.status || !trackingData.message?.trim()) {
        throw new Error("Status and message are required");
      }
      const response = await api.post(`/order/${orderId}/tracking`, trackingData);
      return response.data;
    } catch (error) {
      console.error("Error adding tracking update:", error);
      throw error;
    }
  },
  confirmPayment: async (orderId) => {
    try {
      if (!orderId) {
        throw new Error("Order ID is required");
      }
      const response = await api.patch(`/order/${orderId}/confirm-payment`);
      return response.data;
    } catch (error) {
      console.error("Error confirming payment:", error);
      throw error;
    }
  },
  // getSellersOrders: async () => {
  //   const response = await api.get("/order/get-seller-orders");
  //   return response;
  // },
  // getSellerOrderById: async (orderId) => {
  //   try {
  //     const response = await api.get(`/order/seller-order/${orderId}`);
  //     console.log("API Response - getSellerOrderById:", response);
  //     return response;
  //   } catch (error) {
  //     console.log("API Error - getSellerOrderById:", {
  //       url: error.config?.url,
  //       status: error.response?.status,
  //       message: error.message,
  //     });
  //     throw new Error(error.response?.data?.message || "Failed to fetch order");
  //   }
  // },
  // getUserOrderById: async (id) => {
  //   console.log(id);
  //   try {
  //     const response = await api.get(`/order/get-user-order/${id}`);
  //     return response.data;
  //   } catch (error) {
  //     console.log("API Error - getUserOrderById:", {
  //       url: error.config?.url,
  //       status: error.response?.status,
  //       message: error.message,
  //     });
  //     throw new Error(error.response?.data?.message || "Failed to fetch order");
  //   }
  // },
  // getUserOrders: async () => {
  //   try {
  //     const response = await api.get(`/order/get-user-orders`);
  //     return response.data;
  //   } catch (error) {
  //     console.log("API Error - getUserOrderById:", {
  //       url: error.config?.url,
  //       status: error.response?.status,
  //       message: error.message,
  //     });
  //     throw new Error(error.response?.data?.message || "Failed to fetch order");
  //   }
  //   },
  updateOrder: async (orderId, updateData) => {
    try {
      if (!orderId) {
        throw new Error("Order ID is required");
      }
      const response = await api.patch(`/order/${orderId}`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },
};
