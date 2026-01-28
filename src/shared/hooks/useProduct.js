import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from '../services/productApi';
// import api from '../../shared/services/api';

const useProduct = () => {
  const queryClient = useQueryClient();

  // Get all products - CRITICAL: Use pagination, do NOT fetch all products at once
  // This prevents server lockup from large queries
  const getProducts = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        // CRITICAL: Fetch only first page (200 products max) to prevent timeout
        // Frontend pagination should handle additional pages
        const response = await productService.getAllProducts({ page: 1, limit: 200 });
        
        // Handle different response structures
        const products = response?.data?.data || 
                        response?.data?.products || 
                        response?.data || 
                        response?.results || 
                        [];
        
        const total = response?.total || response?.data?.total || products.length;
        
        return {
          status: 'success',
          results: products.length,
          total: total,
          data: {
            data: products,
          },
        };
      } catch (error) {
        console.error("[useProduct] ❌ Failed to fetch products:", {
          message: error.message,
          status: error.response?.status,
        });
        
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            "Failed to load products";
        
        const enhancedError = new Error(errorMessage);
        enhancedError.originalError = error;
        enhancedError.status = error.response?.status;
        enhancedError.responseData = error.response?.data;
        
        throw enhancedError;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1, // Reduced retries to prevent accumulation
  });

  // Get single product by ID
  const useGetProductById = (id) =>
    useQuery({
      queryKey: ["products", id],
      queryFn: async () => {
        if (!id) return null;
        try {
          const res = await productService.getProductById(id);

          return res.data;
        } catch (error) {
          console.error(`Failed to fetch product ${id}:`, error);
          throw new Error(`Failed to load product: ${error.message}`);
        }
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
      retry: 2,
    });

  // Get all products by seller
  const useGetAllProductBySeller = (sellerId) => {
    console.log(" product hooksellerId", sellerId);
    return useQuery({
      queryKey: ["products", sellerId],
      queryFn: async () => {
        if (!sellerId) return null;
        try {
          return await productService.getAllProductsBySeller(sellerId);
        } catch (error) {
          throw new Error(`Failed to load seller products: ${error.message}`);
        }
      },
      enabled: !!sellerId,
      staleTime: 1000 * 60 * 2, // 2 minutes
    });
  };
  const useGetAllPublicProductBySeller = (sellerId) => {
    return useQuery({
      queryKey: ["products", sellerId],
      queryFn: async () => {
        if (!sellerId) return [];
        try {
          const response = await productService.getAllPublicProductsBySeller(
            sellerId
          );

          // Handle different response structures
          return response.products || response.data?.products || response;
        } catch (error) {
          console.error("Error fetching products:", error);
          return [];
        }
      },
      enabled: !!sellerId,
      staleTime: 1000 * 60 * 2, // 2 minutes
      // Add retry logic
      retry: (failureCount, error) => {
        if (error.message.includes("404")) return false;
        return failureCount < 2;
      },
    });
  };
  // Create product mutation
  const createProduct = useMutation({
    mutationFn: (formData) => productService.createProduct(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => productService.updateProduct(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries(["product"]);
      console.log("product updated successfully!!!");
    },
    onError: (error) => {
      console.error("Update error:", error);
    },
  });
  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: (id) => productService.deleteProduct(id),
    onSuccess: () => {
      // CRITICAL: Only invalidate, do NOT refetch immediately
      // This prevents accumulation of overlapping requests
      // React Query will refetch when component needs the data
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      console.log("product deleted successfully!!!");
    },
    onError: (error) => {
      console.error("Delete product error:", error);
    },
  });

  const getProductCountByCategory = useQuery({
    queryKey: ["productCountByCategory"],
    queryFn: () => productService.getProductCountByCategory(),
    onSuccess: () => {
      queryClient.invalidateQueries(["productCountByCategory"]);
      console.log("product count by category updated successfully!!!");
    },
  });

  const useSimilarProduct = (categoryId, currentProductId) => {
    return useQuery({
      queryKey: ["similarProducts", categoryId, currentProductId],
      queryFn: async () => {
        try {
          if (!categoryId || !currentProductId) return null;
          const res = await productService.getSimilarProducts(
            categoryId,
            currentProductId
          );
          return res.data.filter((product) => product.id !== currentProductId);
          // return await productService.getSimilarProducts();
        } catch (error) {
          throw new Error(`Failed to load similar products: ${error.message}`);
        }
      },
      enabled: !!categoryId && !!currentProductId,
    });
  };
  const useGetProductsByCategory = (categoryId, params = {}) => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (key === "subcategories" && Array.isArray(value)) {
        // Send as comma-separated string
        queryParams.set(key, value.join(","));
      } else if (value !== undefined && value !== null) {
        queryParams.set(key, value);
      }
    });

    return useQuery({
      queryKey: ["products", params],
      queryFn: async () => {
        if (!categoryId) return null;
        try {
          return await productService.getProductsByCategory(
            categoryId,
            queryParams
          );
        } catch (error) {
          throw new Error(
            `Failed to load products by category: ${error.message}`
          );
        }
      },
      enabled: !!categoryId,
    });
  };

  // Approve product mutation
  const approveProduct = useMutation({
    mutationFn: async ({ productId, notes }) => {
      console.log('[useProduct] Approving product:', { productId, notes });
      try {
        const result = await productService.approveProduct(productId, notes);
        console.log('[useProduct] ✅ Product approved successfully:', result);
        return result;
      } catch (error) {
        console.error('[useProduct] ❌ Error approving product:', {
          productId,
          error: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log('[useProduct] Approval success, invalidating queries:', variables);
      // Invalidate and refetch products to get updated data
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["pendingProducts"] });
      queryClient.refetchQueries({ queryKey: ["products"] });
    },
    onError: (error, variables) => {
      console.error('[useProduct] Approval mutation error:', {
        productId: variables.productId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    },
  });

  // Reject product mutation
  const rejectProduct = useMutation({
    mutationFn: ({ productId, notes, reason }) => productService.rejectProduct(productId, notes, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["pendingProducts"] });
    },
  });

  // Get pending products query
  const getPendingProducts = (params = {}) => {
    return useQuery({
      queryKey: ["pendingProducts", params],
      queryFn: () => productService.getPendingProducts(params),
      staleTime: 1000 * 60 * 2, // 2 minutes
    });
  };

  return {
    getProducts,
    useGetProductById,
    useGetProductsByCategory,
    useGetAllProductBySeller,
    useGetAllPublicProductBySeller,
    getProductCountByCategory,
    useSimilarProduct,
    getPendingProducts,
    createProduct: {
      mutate: createProduct.mutate,
      isPending: createProduct.isPending,
      error: createProduct.error,
    },
    updateProduct: {
      mutate: updateProduct.mutate,
      isPending: updateProduct.isPending,
      error: updateProduct.error,
    },
    deleteProduct: {
      mutate: deleteProduct.mutate,
      mutateAsync: deleteProduct.mutateAsync,
      isPending: deleteProduct.isPending,
      isLoading: deleteProduct.isLoading,
      error: deleteProduct.error,
    },
    approveProduct: {
      mutate: approveProduct.mutate,
      mutateAsync: approveProduct.mutateAsync,
      isPending: approveProduct.isPending,
      error: approveProduct.error,
    },
    rejectProduct: {
      mutate: rejectProduct.mutate,
      mutateAsync: rejectProduct.mutateAsync,
      isPending: rejectProduct.isPending,
      error: rejectProduct.error,
    },
  };
};

export default useProduct;
