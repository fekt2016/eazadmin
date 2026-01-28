import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "../services/reviewApi";
import { toast } from "react-toastify";
import useAuth from "./useAuth";

const useReview = () => {
  const queryClient = useQueryClient();

  /**
   * Get all reviews with pagination and filters
   * SECURITY: Only runs when admin is authenticated
   */
  const useGetAllReviews = (params = {}) => {
    const { adminData, isLoading: isAdminLoading } = useAuth();
    
    // Extract admin from nested response structure
    const admin = adminData?.data?.data?.data || 
                  adminData?.data?.data || 
                  adminData?.data || 
                  adminData || 
                  null;
    
    // Ensure enabled is always a boolean - check admin exists and has valid ID
    const hasValidAdmin = admin && 
                          typeof admin === 'object' && 
                          !Array.isArray(admin) &&
                          (admin.id || admin._id) &&
                          (admin.email || admin.name) &&
                          (admin.role === 'admin' || admin.role === 'superadmin' || admin.role === 'moderator');
    
    const isEnabled = Boolean(!isAdminLoading && hasValidAdmin);
    
    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.debug('[useGetAllReviews] Auth check:', {
        isAdminLoading,
        hasAdmin: !!admin,
        hasValidAdmin,
        isEnabled,
        adminId: admin?._id || admin?.id,
        adminRole: admin?.role,
      });
    }
    
    return useQuery({
      queryKey: ["reviews", params],
      queryFn: async () => {
        // Double-check authentication before making the request
        if (!admin || (!admin._id && !admin.id)) {
          console.warn('[useGetAllReviews] Query function called but admin not authenticated');
          return { results: [], total: 0 };
        }
        
        try {
          const response = await reviewService.getAllReviews(params);
          // Handle different response structures
          if (response?.data?.reviews) {
            return response.data;
          }
          if (response?.results) {
            return response;
          }
          if (Array.isArray(response)) {
            return { results: response, total: response.length };
          }
          return response;
        } catch (error) {
          // If 401, user is not authenticated - return empty data instead of throwing
          if (error?.response?.status === 401) {
            console.warn('[useGetAllReviews] 401 error - admin not authenticated', {
              adminId: admin?._id || admin?.id,
              isEnabled,
              isAdminLoading,
            });
            return { results: [], total: 0 };
          }
          console.error("Failed to fetch reviews:", error);
          throw new Error("Failed to load reviews");
        }
      },
      enabled: isEnabled, // Only run when authenticated
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401 errors (auth failure)
        if (error?.response?.status === 401) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useGetAllReviews] Not retrying 401 error');
          }
          return false;
        }
        return failureCount < 2;
      },
    });
  };

  /**
   * Get a single review by ID
   */
  const useGetReview = (id) => {
    return useQuery({
      queryKey: ["reviews", id],
      queryFn: async () => {
        if (!id) return null;
        try {
          const response = await reviewService.getReview(id);
          return response?.data?.review || response?.review || response;
        } catch (error) {
          console.error(`Failed to fetch review ${id}:`, error);
          throw new Error(`Failed to load review: ${error.message}`);
        }
      },
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
      retry: 2,
    });
  };

  /**
   * Update a review
   */
  const useUpdateReview = () => {
    return useMutation({
      mutationFn: async ({ id, data }) => {
        return await reviewService.updateReview(id, data);
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        queryClient.invalidateQueries({ queryKey: ["reviews", variables.id] });
        toast.success("Review updated successfully");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to update review");
      },
    });
  };

  /**
   * Delete a review
   */
  const useDeleteReview = () => {
    return useMutation({
      mutationFn: async (id) => {
        return await reviewService.deleteReview(id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        toast.success("Review deleted successfully");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to delete review");
      },
    });
  };

  /**
   * Approve a review (admin only)
   */
  const useApproveReview = () => {
    return useMutation({
      mutationFn: async ({ id, moderationNotes }) => {
        return await reviewService.approveReview(id, moderationNotes);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        toast.success("Review approved successfully");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to approve review");
      },
    });
  };

  /**
   * Reject a review (admin only)
   */
  const useRejectReview = () => {
    return useMutation({
      mutationFn: async ({ id, moderationNotes }) => {
        return await reviewService.rejectReview(id, moderationNotes);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        toast.success("Review rejected successfully");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to reject review");
      },
    });
  };

  /**
   * Flag a review (admin only)
   */
  const useFlagReview = () => {
    return useMutation({
      mutationFn: async ({ id, flaggedReason, moderationNotes }) => {
        return await reviewService.flagReview(id, flaggedReason, moderationNotes);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        toast.success("Review flagged successfully");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to flag review");
      },
    });
  };

  /**
   * Hide a review (admin only)
   */
  const useHideReview = () => {
    return useMutation({
      mutationFn: async ({ id, moderationNotes }) => {
        return await reviewService.hideReview(id, moderationNotes);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        toast.success("Review hidden successfully");
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Failed to hide review");
      },
    });
  };

  return {
    useGetAllReviews,
    useGetReview,
    useUpdateReview,
    useDeleteReview,
    useApproveReview,
    useRejectReview,
    useFlagReview,
    useHideReview,
  };
};

export default useReview;

