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
  getAllProducts: async (params = {}) => {
    // SECURITY: Cookie-only authentication - no token storage
    // Cookies are automatically sent via withCredentials: true in api.js
    // For admins, request a higher limit to see all products
    const queryParams = {
      limit: params.limit || 1000, // Request up to 1000 products for admins
      page: params.page || 1,
      ...params, // Allow other params to be passed
    };
    
    try {
      console.log('[productApi] Fetching products with params:', queryParams);
      
      // Increase timeout for product list requests (may take longer with many products)
      const response = await api.get("/product", { 
        params: queryParams,
        timeout: 30000, // 30 seconds for product list requests
      });
      
      console.log('[productApi] ✅ Response received:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        results: response.data?.results,
        total: response.data?.total,
        hasNestedData: !!response.data?.data,
        nestedDataType: response.data?.data ? (Array.isArray(response.data.data) ? 'array' : typeof response.data.data) : 'null',
        nestedDataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'not array',
      });
      
      // The backend returns: { status: 'success', results: number, total: number, data: { data: products[] } }
      return response.data;
    } catch (error) {
      console.error("❌ [productApi] Error in getAllProducts:", {
        message: error.message,
        url: error.config?.url,
        params: queryParams,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        stack: error.stack,
      });
      throw error;
    }
  },

  // Admin/seller: use shared GET /product (supports ?seller= for admin viewing a seller's products)
  getAllProductsBySeller: async (sellerId) => {
    const params = sellerId ? { seller: sellerId, limit: 500 } : { limit: 500 };
    const response = await api.get("/product", { params });
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
        `/product/${id}`,
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

  deleteProduct: async (id, options = {}) => {
    try {
      // Validate ID
      if (!id) {
        throw new Error("Product ID is required");
      }

      // Admin uses the admin-specific route for product removal (soft delete/archive)
      // Route: DELETE /api/v1/admin/products/:productId
      const requestBody = {};
      if (options.reason) {
        requestBody.reason = options.reason;
      }
      if (options.forceDelete === true) {
        requestBody.forceDelete = true;
      }

      const response = await api.delete(`/admin/products/${id}`, {
        data: Object.keys(requestBody).length > 0 ? requestBody : undefined,
      });

      // Handle 200 OK with data (soft delete returns success message)
      if (response.status === 200) {
        return response.data || { success: true };
      }

      // Handle 204 No Content (if hard delete is performed)
      if (response.status === 204) {
        return { success: true, message: "Product permanently deleted" };
      }

      // Handle other success statuses
      if (response.status >= 200 && response.status < 300) {
        return response.data || { success: true };
      }

      // If we get here, it's an error
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (err) {
      console.error("Error deleting product:", {
        id,
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error?.message || 
                          err.message || 
                          "Failed to delete product";
      
      const apiError = new Error(errorMessage);
      apiError.status = err.response?.status || 500;
      apiError.response = err.response;
      throw apiError;
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
  
  // Admin product moderation functions
  approveProduct: async (productId, notes) => {
    try {
      console.log('[productApi] Approving product:', { productId, notes, url: `/admin/products/${productId}/approve` });
      const response = await api.patch(`/admin/products/${productId}/approve`, {
        notes: notes || "",
      });
      console.log('[productApi] ✅ Approval response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[productApi] ❌ Approval error:', {
        productId,
        url: `/admin/products/${productId}/approve`,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },
  
  rejectProduct: async (productId, notes, reason) => {
    const response = await api.patch(`/admin/products/${productId}/reject`, {
      notes,
      reason,
    });
    return response.data;
  },
  
  getPendingProducts: async (params = {}) => {
    const { page = 1, limit = 20 } = params;
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    const response = await api.get(`/admin/products/pending?${queryParams.toString()}`);
    return response.data;
  },
};
