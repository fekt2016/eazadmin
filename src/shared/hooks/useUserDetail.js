import { useQuery } from "@tanstack/react-query";
import adminUserApi from '../services/adminUserApi';
import adminSellerApi from '../services/adminSellerApi';

/**
 * Hook to fetch a single user by ID
 * Handles users, sellers, and admins (from both User and Admin collections)
 */
export const useGetUserById = (userId) => {
  return useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Validate that userId is not a sequential number (like 1, 2, 3)
      // MongoDB ObjectIds are typically 24 character hex strings
      const isNumericId = !isNaN(userId) && parseInt(userId) < 1000;
      if (isNumericId && (typeof userId === 'string' && userId.length <= 3)) {
        const error = new Error(`Invalid user ID format: "${userId}". Expected MongoDB ObjectId (24 character hex string).`);
        error.status = 400;
        throw error;
      }

      // Try endpoints in order: users, admin, seller
      // Users collection can contain users with role='user', 'seller', or 'admin'
      // Admin collection contains separate admin records
      // Seller collection contains seller records
      
      let lastError = null;
      
      // 1. Try users endpoint first (handles users and admins in User collection)
      try {
        const response = await adminUserApi.getUserDetails(userId);
        return response;
      } catch (userError) {
        lastError = userError;
        // If user endpoint fails with 404, try other endpoints
        if (userError.response?.status === 404 || (userError.response?.status === 400 && userError.response?.data?.message?.includes("not found"))) {
          // 2. Try seller endpoint first (more common than admin)
          try {
            const sellerResponse = await adminSellerApi.getSellerDetails(userId);
            return sellerResponse;
          } catch (sellerError) {
            // 3. Try admin endpoint (for admins in Admin collection)
            try {
              const adminResponse = await adminUserApi.getAdminDetails(userId);
              return adminResponse;
            } catch (adminError) {
              // All three endpoints failed
              const errorMessages = {
                user: userError.response?.data?.message || userError.message,
                seller: sellerError.response?.data?.message || sellerError.message,
                admin: adminError.response?.data?.message || adminError.message,
              };
              
              const combinedError = new Error(
                `User not found. Tried all endpoints (users, seller, admin). None found the user with ID: ${userId}`
              );
              combinedError.response = userError.response || sellerError.response || adminError.response;
              combinedError.status = 404;
              combinedError.details = errorMessages;
              throw combinedError;
            }
          }
        }
        // If it's not a 404, throw the original error
        throw userError;
      }
    },
    enabled: !!userId && userId !== '1' && userId !== 1, // Don't enable if ID is invalid
    retry: (failureCount, error) => {
      // Don't retry on 400 (Invalid ID format) or 404 errors
      if (
        error.response?.status === 400 ||
        error.response?.status === 404 ||
        error.message?.includes("Invalid user ID format") ||
        error.status === 400
      ) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

