import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from '../services/orderApi'; // Adjust the import path as necessary
// import { useNavigate } from "react-router-dom";

export const getOrderStructure = (orderData) => {
  console.log("orderData structure", orderData);
  console.log("orderData structure", orderData);
  if (!orderData) return [];

  if (orderData?.data?.data?.data) {
    return orderData?.data?.data?.data;
  }
  if (orderData?.data?.data) {
    return orderData?.data?.data;
  }
};
// export const useGetSellerOrder = (orderId) => {
//   console.log("useGetSellerOrder called with orderId:", orderId);
//   return useQuery({
//     queryKey: ["sellerOrder", orderId],
//     queryFn: async () => {
//       if (!orderId) throw new Error("Order ID is required");

//       const response = await orderService.getSellerOrderById(orderId);
//       console.log("Order fetch response:", response);
//       return response;
//     },
//     enabled: !!orderId,
//     retry: (failureCount, error) => {
//       // Don't retry on 404 or 403 errors
//       if (
//         error.message.includes("404") ||
//         error.message.includes("403") ||
//         error.message.includes("Order not found")
//       ) {
//         return false;
//       }
//       return failureCount < 3;
//     },
//   });
// };

// export const useGetSellerOrders = () => {
//   const queryClient = new QueryClient();

//   return useQuery({
//     queryKey: ["seller-orders"], // Add query key for caching
//     queryFn: async () => {
//       // Fixed property name (queryFn instead of queryfn)
//       try {
//         const response = await orderService.getSellersOrders();
//         console.log("Order fetch response:", response);

//         // Check for valid response structure
//         if (!response || !response.data) {
//           throw new Error("Invalid server response structure");
//         }

//         return response;
//       } catch (error) {
//         // Log detailed error information
//         console.error("Order fetch error:", {
//           message: error.message,
//           response: error.response?.data,
//           status: error.response?.status,
//         });

//         // Throw meaningful error message
//         throw new Error(
//           error.response?.data?.message || "Failed to load orders"
//         );
//       }
//     },
//     onsuccess: (data) => {
//       console.log(data);
//       queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
//     },
//     retry: 2, // Add retry mechanism
//     staleTime: 1000 * 60 * 5, // 5 minutes cache
//     onError: (error) => {
//       console.error("Order fetch failed:", error.message);
//     },
//   });
// };
// export const useCreateOrder = () => {
//   const queryClient = new QueryClient();
//   // const navigate = useNavigate();
//   return useMutation({
//     queryKey: ["orders"],
//     mutationFn: async (data) => {
//       try {
//         const response = await orderService.createOrder(data);
//         console.log("Order fetch response:", response);
//         queryClient.invalidateQueries({ queryKey: ["orders"] });
//         return response;
//       } catch (error) {
//         console.error("Order fetch error:", error);
//         throw error;
//       }
//     },
//     onSuccess: (data) => {
//       console.log("order created successfully!!!", data);
//       queryClient.invalidateQueries({ queryKey: ["orders"] });
//     },
//     onError: (error) => {
//       console.error("Order fetch failed:", error.message);
//     },
//   });
// };

// export const useGetUserOrders = () => {
//   return useQuery({
//     queryKey: ["orders"],
//     queryFn: async () => {
//       const data = await orderService.getUserOrders();
//       return data;
//     },
//   });
// };
// export const useGetUserOrderById = (id) => {
//   return useQuery({
//     queryKey: ["order", id], // Include id in queryKey for unique caching
//     queryFn: async () => {
//       if (!id) return null; // Handle missing ID case
//       const response = await orderService.getUserOrderById(id);
//       return response.data; // Return just the data
//     },
//     enabled: !!id, // Only run query when id is available
//     // Optional: Add retry and stale time configurations
//     retry: 2,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// };

export const useGetAllOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await orderService.getAllOrders();
      console.log("hook Response - getAllOrders:", response);
      return response;
    },
  });

/**
 * Fetches order counts by status for admin order management cards.
 * Returns real totals from the database, not just the current page.
 */
export const useGetOrderStats = () =>
  useQuery({
    queryKey: ["orderStats"],
    queryFn: async () => {
      const response = await orderService.getOrderStats();
      return response;
    },
  });
export const useGetOrderById = (id) => {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await orderService.getOrderById(id);
      console.log("hook Response - getOrderById:", response);
      return response;
    },
    enabled: !!id,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch order by tracking number
 * @param {string} trackingNumber - The tracking number to search for
 * @returns {Object} Query result with order data, loading state, and error
 */
export const useGetOrderByTrackingNumber = (trackingNumber) => {
  return useQuery({
    queryKey: ["order", "tracking", trackingNumber],
    queryFn: async () => {
      if (!trackingNumber) {
        throw new Error("Tracking number is required");
      }
      
      try {
        const response = await orderService.getOrderByTrackingNumber(trackingNumber);
        // Service returns response.data, extract order from it
        return response?.data?.order || response?.order || response;
      } catch (error) {
        // Enhanced error handling
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('CONNECTION_REFUSED')) {
          throw new Error("Unable to connect to the server. Please ensure the backend server is running on port 4000.");
        } else if (error.response?.status === 404) {
          throw new Error("Order not found with this tracking number. Please verify the tracking number is correct.");
        } else {
          throw new Error(error.response?.data?.message || error.message || "Failed to load tracking information");
        }
      }
    },
    enabled: !!trackingNumber,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.message?.includes("404") || error.message?.includes("not found")) {
        return false;
      }
      // Don't retry on network errors more than once
      if (error.message?.includes("Unable to connect")) {
        return failureCount < 1;
      }
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to add tracking update to an order
 * @returns {Object} Mutation object with mutate function and state
 */
export const useAddTrackingUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, trackingData }) => {
      if (!orderId) {
        throw new Error("Order ID is required");
      }
      if (!trackingData?.status || !trackingData?.message?.trim()) {
        throw new Error("Status and message are required");
      }
      
      return await orderService.addTrackingUpdate(orderId, trackingData);
    },
    onSuccess: (data, variables) => {
      // Invalidate tracking query to refetch updated data
      if (variables.trackingNumber) {
        queryClient.invalidateQueries({ 
          queryKey: ["order", "tracking", variables.trackingNumber] 
        });
      }
      // Also invalidate order queries
      queryClient.invalidateQueries({ 
        queryKey: ["order", variables.orderId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["orders"] 
      });
    },
    onError: (error) => {
      console.error("Error adding tracking update:", error);
    },
  });
};

/**
 * Hook for admin to hard-delete an order.
 * Backend will:
 *  - backup the order
 *  - deduct revenue if it was previously added
 * For safety, we only expose this in the admin app and
 * the UI will restrict it to unpaid orders.
 */
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      if (!orderId) throw new Error("Order ID is required");
      return await orderService.deleteOrder(orderId);
    },
    onSuccess: (_data, orderId) => {
      // Optimistically remove the deleted order from the cached list
      queryClient.setQueryData(["orders"], (oldData) => {
        if (!oldData) return oldData;

        const body = oldData.data ?? oldData;
        const list =
          body?.data?.results ??
          body?.data?.data ??
          body?.results ??
          body?.data ??
          [];

        if (!Array.isArray(list)) return oldData;

        const filtered = list.filter((o) => {
          const id = o._id ?? o.id;
          return id?.toString?.() !== orderId?.toString?.();
        });

        // Preserve original envelope shape while swapping the list
        if (body?.data?.results) {
          return {
            ...oldData,
            data: {
              ...body,
              data: {
                ...body.data,
                results: filtered,
              },
            },
          };
        }

        if (body?.data?.data && Array.isArray(body.data.data)) {
          return {
            ...oldData,
            data: {
              ...body,
              data: {
                ...body.data,
                data: filtered,
              },
            },
          };
        }

        if (body?.results && Array.isArray(body.results)) {
          return {
            ...oldData,
            data: {
              ...body,
              results: filtered,
            },
          };
        }

        // Fallback: if orders are directly in data or root
        if (Array.isArray(body)) {
          return {
            ...oldData,
            data: filtered,
          };
        }

        return oldData;
      });

      // Also invalidate to refetch from server and refresh stats
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orderStats"] });
    },
  });
};

/**
 * Hook to confirm payment for bank transfer or cash on delivery orders
 * @returns {Object} Mutation object with mutate function and state
 */
export const useConfirmPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId) => {
      if (!orderId) {
        throw new Error("Order ID is required");
      }
      return await orderService.confirmPayment(orderId);
    },
    onSuccess: (data, orderId) => {
      // Invalidate order queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ["order", orderId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["orders"] 
      });
      console.log("Payment confirmed successfully:", data);
    },
    onError: (error) => {
      console.error("Error confirming payment:", error);
    },
  });
};
