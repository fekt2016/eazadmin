import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from '../services/categoryApi';
import api from '../services/api';

const useCategory = () => {
  const queryClient = useQueryClient();

  // Get all categories - fetch all 112 categories in one request
  const getCategories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        console.log('[useCategory] Fetching all categories with limit 200...');
        
        // Request a high limit to get all categories in one call
        // Backend now allows up to 1000 per page for categories
        const response = await categoryService.getAllCategories({
          page: 1,
          limit: 200, // Request 200 to ensure we get all 112 categories
        });
        
        // Handle different response structures
        const categories = response?.data?.results || 
                          response?.data?.data?.results || 
                          response?.data?.data || 
                          response?.results || 
                          response?.data || 
                          [];
        
        const meta = response?.data?.meta || response?.meta || {};
        const total = meta.total || categories.length;
        
        console.log('[useCategory] ✅ Categories fetched:', {
          categoriesReceived: categories.length,
          totalFromMeta: total,
          expected: 112,
          match: categories.length === 112 ? '✅ MATCH' : `❌ MISMATCH (expected 112, got ${categories.length})`,
          meta: meta,
        });
        
        // If we got fewer than expected, log a warning
        if (categories.length < 112 && total >= 112) {
          console.warn('[useCategory] ⚠️ Got fewer categories than expected. Total in DB:', total, 'Received:', categories.length);
        }
        
        // Return in the expected format
        return {
          data: {
            results: categories,
            total: total || categories.length,
            meta: meta,
          }
        };
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        throw error; // Re-throw to let React Query handle it
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  // Custom hook to get single category by ID
  const useCategoryById = (id) =>
    useQuery({
      queryKey: ["category", id],
      queryFn: async () => {
        console.log("useCategory", id);
        if (!id) return null;
        try {
          const { data } = await categoryService.getCategory(id);
          console.log(data);
          return data || null;
        } catch (error) {
          console.error(`Failed to fetch category ${id}:`, error);
          throw new Error(`Failed to load category: ${error.message}`);
        }
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    });

  // Create category mutation
  const createCategory = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post(
        "categories", // Your API endpoint
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      console.log("Category created successfully!!!");
    },
  });

  // Update category mutation
  const updateCategory = useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await api.patch(`/categories/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", variables.id] });
      console.log("Category updated successfully!!!");
    },
  });

  // Delete category mutation
  const deleteCategory = useMutation({
    mutationFn: async (id) => {
      console.log(id);
      await api.delete(`/categories/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.removeQueries({ queryKey: ["category", deletedId] });
      console.log("Category deleted successfully!!!");
    },
  });
  const getParentCategories = useQuery({
    queryKey: ["parentCategories"],
    queryFn: async () => {
      try {
        const response = await categoryService.getParentCategories();

        return response;
      } catch (error) {
        console.error("Failed to fetch parent categories:", error.mess);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  return {
    getCategories,
    getParentCategories,
    useCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};

export default useCategory;
