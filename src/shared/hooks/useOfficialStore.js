import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { officialStoreService } from '../services/officialStoreApi';

export const useOfficialStore = () => {
  const queryClient = useQueryClient();

  // Get Official Store products
  const useGetOfficialStoreProducts = () =>
    useQuery({
      queryKey: ['official-store', 'products'],
      queryFn: async () => {
        try {
          const response = await officialStoreService.getOfficialStoreProducts();

          if (response?.data?.products && Array.isArray(response.data.products)) {
            console.log('✅ [useOfficialStore] Found products at response.data.products:', response.data.products.length);
            return response.data.products;
          }
          // Fallback: maybe response.data is the products array directly
          if (response?.data && Array.isArray(response.data)) {
            console.log('✅ [useOfficialStore] Response.data is array:', response.data.length);
            return response.data;
          }
          // Fallback: nested data.data.products
          if (response?.data?.data?.products && Array.isArray(response.data.data.products)) {
            console.log('✅ [useOfficialStore] Found products at response.data.data.products:', response.data.data.products.length);
            return response.data.data.products;
          }
          // Fallback: response is array
          if (Array.isArray(response)) {
            console.log('✅ [useOfficialStore] Response is array:', response.length);
            return response;
          }
          // Fallback: direct products property
          if (response?.products && Array.isArray(response.products)) {
            console.log('✅ [useOfficialStore] Found products at response.products:', response.products.length);
            return response.products;
          }
          console.warn('⚠️ [useOfficialStore] No products found in response structure:', {
            response,
            hasData: !!response?.data,
            dataType: typeof response?.data,
            dataKeys: response?.data ? Object.keys(response.data) : [],
          });
          return [];
        } catch (error) {
          console.error('❌ [useOfficialStore] Failed to fetch Official Store products:', error);
          const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load Saiisai products';
          const statusCode = error?.response?.status;
          console.error('❌ [useOfficialStore] Error details:', {
            message: errorMessage,
            status: statusCode,
            url: error?.config?.url,
            response: error?.response?.data,
          });
          throw new Error(errorMessage);
        }
      },
      staleTime: 1000 * 60 * 5,
      retry: 2,
    });

  // Create Official Store product
  const useCreateOfficialStoreProduct = () =>
    useMutation({
      mutationFn: async (formData) => {
        return await officialStoreService.createOfficialStoreProduct(formData);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['official-store', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    });

  // Update Official Store product
  const useUpdateOfficialStoreProduct = () =>
    useMutation({
      mutationFn: async ({ id, formData }) => {
        return await officialStoreService.updateOfficialStoreProduct(id, formData);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['official-store', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    });

  // Toggle Official Store product status
  const useToggleOfficialStoreProduct = () =>
    useMutation({
      mutationFn: async (id) => {
        return await officialStoreService.toggleOfficialStoreProduct(id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['official-store', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    });

  // Get Official Store orders
  const useGetOfficialStoreOrders = () =>
    useQuery({
      queryKey: ['official-store', 'orders'],
      queryFn: async () => {
        try {
          const response = await officialStoreService.getOfficialStoreOrders();
          // Backend shape: { status, results, data: { orders: [...] } }
          return response?.data?.orders ?? response?.data?.data?.orders ?? response?.orders ?? [];
        } catch (error) {
          console.error('Failed to fetch Official Store orders:', error);
          throw new Error('Failed to load Saiisai orders');
        }
      },
      staleTime: 1000 * 60 * 2,
      retry: 2,
    });

  // Official Store analytics (credits split)
  const useGetOfficialStoreAnalytics = ({ range = 30, page = 1, limit = 10 } = {}) =>
    useQuery({
      queryKey: ['official-store', 'analytics', range, page, limit],
      queryFn: async () => {
        const res = await officialStoreService.getOfficialStoreAnalytics({
          range,
          page,
          limit,
        });
        // Expected backend shape: { status, data: { summary, orders, pagination } }
        return res?.data || res;
      },
      staleTime: 1000 * 60 * 5,
      retry: 2,
    });

  // Get Official Store shipping fees
  const useGetOfficialStoreShippingFees = () =>
    useQuery({
      queryKey: ['official-store', 'shipping-fees'],
      queryFn: async () => {
        try {
          const response = await officialStoreService.getOfficialStoreShippingFees();
          return response.data?.fees || null;
        } catch (error) {
          console.error('Failed to fetch Official Store shipping fees:', error);
          throw new Error('Failed to load Saiisai shipping fees');
        }
      },
      staleTime: 1000 * 60 * 10,
      retry: 2,
    });

  // Update Official Store shipping fees
  const useUpdateOfficialStoreShippingFees = () =>
    useMutation({
      mutationFn: async (fees) => {
        return await officialStoreService.updateOfficialStoreShippingFees(fees);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['official-store', 'shipping-fees'] });
      },
    });

  // Get pickup centers
  const useGetPickupCenters = (city) =>
    useQuery({
      queryKey: ['official-store', 'pickup-centers', city],
      queryFn: async () => {
        try {
          const response = await officialStoreService.getPickupCenters(city);
          return response.data?.pickupCenters || [];
        } catch (error) {
          console.error('Failed to fetch pickup centers:', error);
          throw new Error('Failed to load pickup centers');
        }
      },
      staleTime: 1000 * 60 * 10,
      retry: 2,
    });

  // Mark product as Official Store product
  const useMarkProductAsOfficial = () =>
    useMutation({
      mutationFn: async (id) => {
        return await officialStoreService.markProductAsOfficial(id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['official-store', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    });

  // Unmark product as Official Store product
  const useUnmarkProductAsOfficial = () =>
    useMutation({
      mutationFn: async (id) => {
        return await officialStoreService.unmarkProductAsOfficial(id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['official-store', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    });

  return {
    useGetOfficialStoreProducts,
    useCreateOfficialStoreProduct,
    useUpdateOfficialStoreProduct,
    useToggleOfficialStoreProduct,
    useGetOfficialStoreOrders,
    useGetOfficialStoreAnalytics,
    useGetOfficialStoreShippingFees,
    useUpdateOfficialStoreShippingFees,
    useGetPickupCenters,
    useMarkProductAsOfficial,
    useUnmarkProductAsOfficial,
  };
};

