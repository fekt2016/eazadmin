import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from '../services/productApi';
// import api from '../../shared/services/api';

const useProduct = () => {
  const queryClient = useQueryClient();

  // Get all products
  const getProducts = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        return await productService.getAllProducts();
      } catch (error) {
        console.error("Failed to fetch products:", error);
        throw new Error("Failed to load products");
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
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
      queryClient.getQueryData(["product"]);
      console.log("product deleted successfully!!!");
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
    mutationFn: ({ productId, notes }) => productService.approveProduct(productId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["pendingProducts"] });
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
