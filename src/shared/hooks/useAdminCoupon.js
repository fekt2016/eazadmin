import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminCouponApi from '../services/adminCouponApi';

export const useGetAllCoupons = (params = {}) => {
  return useQuery({
    queryKey: ['adminCoupons', params],
    queryFn: () => adminCouponApi.getAllCoupons(params),
  });
};

export const useGetCouponById = (couponId) => {
  return useQuery({
    queryKey: ['adminCoupon', couponId],
    queryFn: () => adminCouponApi.getCouponById(couponId),
    enabled: !!couponId,
  });
};

export const useCreateGlobalCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponData) => adminCouponApi.createGlobalCoupon(couponData),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCoupons']);
    },
  });
};

export const useDeactivateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (couponId) => adminCouponApi.deactivateCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminCoupons']);
    },
  });
};

export const useGetCouponAnalytics = (params = {}) => {
  return useQuery({
    queryKey: ['adminCouponAnalytics', params],
    queryFn: () => adminCouponApi.getCouponAnalytics(params),
  });
};

