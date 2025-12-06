import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminDiscountApi from '../services/adminDiscountApi';

export const useGetAllDiscounts = () => {
  return useQuery({
    queryKey: ['adminDiscounts'],
    queryFn: () => adminDiscountApi.getAllDiscounts(),
  });
};

export const useGetDiscountById = (discountId) => {
  return useQuery({
    queryKey: ['adminDiscount', discountId],
    queryFn: () => adminDiscountApi.getDiscountById(discountId),
    enabled: !!discountId,
  });
};

export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (discountId) => adminDiscountApi.deleteDiscount(discountId),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminDiscounts']);
    },
  });
};

export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminDiscountApi.updateDiscount({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminDiscounts']);
    },
  });
};

