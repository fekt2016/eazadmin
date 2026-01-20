import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eazshopService } from '../services/eazshopApi';

export const useEazShop = () => {
  const queryClient = useQueryClient();

  // Get EazShop products
  const useGetEazShopProducts = () =>
    useQuery({
      queryKey: ['eazshop', 'products'],
      queryFn: async () => {
        try {
          const response = await eazshopService.getEazShopProducts();

          
         
          if (response?.data?.products && Array.isArray(response.data.products)) {
            console.log('✅ [useEazShop] Found products at response.data.products:', response.data.products.length);
            return response.data.products;
          }
          // Fallback: maybe response.data is the products array directly
          if (response?.data && Array.isArray(response.data)) {
            console.log('✅ [useEazShop] Response.data is array:', response.data.length);
            return response.data;
          }
          // Fallback: nested data.data.products
          if (response?.data?.data?.products && Array.isArray(response.data.data.products)) {
            console.log('✅ [useEazShop] Found products at response.data.data.products:', response.data.data.products.length);
            return response.data.data.products;
          }
          // Fallback: response is array
          if (Array.isArray(response)) {
            console.log('✅ [useEazShop] Response is array:', response.length);
            return response;
          }
          // Fallback: direct products property
          if (response?.products && Array.isArray(response.products)) {
            console.log('✅ [useEazShop] Found products at response.products:', response.products.length);
            return response.products;
          }
          console.warn('⚠️ [useEazShop] No products found in response structure:', {
            response,
            hasData: !!response?.data,
            dataType: typeof response?.data,
            dataKeys: response?.data ? Object.keys(response.data) : [],
          });
          return [];
        } catch (error) {
          console.error('❌ [useEazShop] Failed to fetch EazShop products:', error);
          const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load EazShop products';
          const statusCode = error?.response?.status;
          console.error('❌ [useEazShop] Error details:', {
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

  // Create EazShop product
  const useCreateEazShopProduct = () =>
    useMutation({
      mutationFn: async (formData) => {
        return await eazshopService.createEazShopProduct(formData);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['eazshop', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    });

  // Update EazShop product
  const useUpdateEazShopProduct = () =>
    useMutation({
      mutationFn: async ({ id, formData }) => {
        return await eazshopService.updateEazShopProduct(id, formData);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['eazshop', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    });

  // Toggle EazShop product status
  const useToggleEazShopProduct = () =>
    useMutation({
      mutationFn: async (id) => {
        return await eazshopService.toggleEazShopProduct(id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['eazshop', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    });

  // Get EazShop orders
  const useGetEazShopOrders = () =>
    useQuery({
      queryKey: ['eazshop', 'orders'],
      queryFn: async () => {
        try {
          const response = await eazshopService.getEazShopOrders();
          return response.data?.orders || [];
        } catch (error) {
          console.error('Failed to fetch EazShop orders:', error);
          throw new Error('Failed to load EazShop orders');
        }
      },
      staleTime: 1000 * 60 * 2,
      retry: 2,
    });

  // Get EazShop shipping fees
  const useGetEazShopShippingFees = () =>
    useQuery({
      queryKey: ['eazshop', 'shipping-fees'],
      queryFn: async () => {
        try {
          const response = await eazshopService.getEazShopShippingFees();
          return response.data?.fees || null;
        } catch (error) {
          console.error('Failed to fetch EazShop shipping fees:', error);
          throw new Error('Failed to load EazShop shipping fees');
        }
      },
      staleTime: 1000 * 60 * 10,
      retry: 2,
    });

  // Update EazShop shipping fees
  const useUpdateEazShopShippingFees = () =>
    useMutation({
      mutationFn: async (fees) => {
        return await eazshopService.updateEazShopShippingFees(fees);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['eazshop', 'shipping-fees'] });
      },
    });

  // Get pickup centers
  const useGetPickupCenters = (city) =>
    useQuery({
      queryKey: ['eazshop', 'pickup-centers', city],
      queryFn: async () => {
        try {
          const response = await eazshopService.getPickupCenters(city);
          return response.data?.pickupCenters || [];
        } catch (error) {
          console.error('Failed to fetch pickup centers:', error);
          throw new Error('Failed to load pickup centers');
        }
      },
      staleTime: 1000 * 60 * 10,
      retry: 2,
    });

  // Mark product as EazShop product
  const useMarkProductAsEazShop = () =>
    useMutation({
      mutationFn: async (id) => {
        return await eazshopService.markProductAsEazShop(id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['eazshop', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    });

  // Unmark product as EazShop product
  const useUnmarkProductAsEazShop = () =>
    useMutation({
      mutationFn: async (id) => {
        return await eazshopService.unmarkProductAsEazShop(id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['eazshop', 'products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      },
    });

  return {
    useGetEazShopProducts,
    useCreateEazShopProduct,
    useUpdateEazShopProduct,
    useToggleEazShopProduct,
    useGetEazShopOrders,
    useGetEazShopShippingFees,
    useUpdateEazShopShippingFees,
    useGetPickupCenters,
    useMarkProductAsEazShop,
    useUnmarkProductAsEazShop,
  };
};

