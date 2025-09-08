import api from "../service/api";

export const orderService = {
  // createOrder: async (data) => {
  //   const response = await api.post("/order", data);
  //   return response;
  // },
  getAllOrders: async () => {
    try {
      const response = await api.get("/order");

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
  // },
};
