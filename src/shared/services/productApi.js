import api from "./api";

export const productService = {
  getProductById: async (id) => {
    try {
      // Example implementation - replace with your actual API call
      const response = await api.get(`/product/${id}`);

      return response;
    } catch (err) {
      console.error("Error fetching product by ID:", err);
      throw err; // Re-throw to allow calling code to handle
    }
  },

  // Additional common product service methods
  getAllProducts: async () => {
    const response = await api.get("/product");
    return response.data;
  },

  getAllProductsBySeller: async () => {
    const response = await api.get("/seller/me/products");
    return response.data;
  },
  createProduct: async (formData) => {
    try {
      const response = await api.post("product", formData, {
        timeout: 60000,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status < 200 || response.status >= 300) {
        const errorData = response.data?.error || response.data;
        const error = new Error(
          errorData?.message || `Request failed with status ${response.status}`
        );
        error.details = errorData?.errors;
        throw error;
      }

      return response.data;
    } catch (err) {
      console.log("Product creation error:", err);

      const apiError = new Error(err.response?.data?.message || err.message);
      apiError.status = err.response?.status || 500;
      apiError.details = err.response?.data?.errors;
      throw apiError;
    }
  },
  updateProduct: async (id, productData) => {
    try {
      const response = await api.patch(
        `/seller/me/products/${id}`,
        productData
      );

      // Axios handles status codes differently than Fetch API
      if (response.status < 200 || response.status >= 300) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Axios response data is in response.data
      return response.data;
    } catch (err) {
      console.error("Error updating product:", err);
      throw err; // Re-throw for error boundary handling
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`seller/me/products/${id}`);

      if (response.status === 204 || !response.data) {
        return { success: true }; // Return dummy object
      }

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      if (
        response.status === 204 ||
        response.headers.get("Content-Length") === "0"
      ) {
        return { success: true };
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      throw err;
    }
  },

  searchProducts: async (query) => {
    try {
      const response = await fetch(
        `/api/products/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.error("Error searching products:", err);
      throw err;
    }
  },
  getProductCountByCategory: async () => {
    const response = await api.get("/product/category-counts");
    return response.data;
  },
  getAllPublicProductsBySeller: async (sellerId) => {
    const response = await api.get(`/product/${sellerId}/public`);
    return response.data;
  },
  getProductsByCategory: async (categoryId, queryParams) => {
    const response = await api.get(
      `/product/category/${categoryId}?${queryParams.toString()}`
    );
    return response.data;
  },
};
