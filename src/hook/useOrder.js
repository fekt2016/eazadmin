import { QueryClient, useQuery } from "@tanstack/react-query";
import { orderService } from "../service/orderApi"; // Adjust the import path as necessary
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
export const useGetOrderById = (id) => {
  return useQuery({
    queryKey: ["order"],
    queryFn: async () => {
      const response = await orderService.getOrderById(id);
      console.log("hook Response - getOrderById:", response);
      return response;
    },
  });
};
