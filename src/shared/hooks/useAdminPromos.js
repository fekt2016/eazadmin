import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import adminPromoApi from '../services/adminPromoApi';

const extractListPayload = (payload) => {
  const items =
    payload?.promos ||
    payload?.items ||
    payload?.data?.promos ||
    payload?.data?.items ||
    [];

  return {
    promos: Array.isArray(items) ? items : [],
    total: payload?.total || payload?.data?.total || 0,
    page: payload?.page || payload?.data?.page || 1,
    totalPages: payload?.totalPages || payload?.data?.totalPages || 1,
  };
};

export const useAdminPromos = (params) =>
  useQuery({
    queryKey: ['adminPromos', params],
    queryFn: async () => {
      const response = await adminPromoApi.getPromos(params);
      return extractListPayload(response);
    },
  });

export const useAdminPromo = (id) =>
  useQuery({
    queryKey: ['adminPromo', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await adminPromoApi.getPromoById(id);
      return response?.promo || response?.data?.promo || response;
    },
  });

export const useCreateAdminPromo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => adminPromoApi.createPromo(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPromos'] });
    },
  });
};

export const useUpdateAdminPromo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => adminPromoApi.updatePromo(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminPromos'] });
      if (variables?.id) {
        queryClient.invalidateQueries({
          queryKey: ['adminPromo', variables.id],
        });
      }
    },
  });
};

export const useCancelAdminPromo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => adminPromoApi.cancelPromo(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['adminPromos'] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ['adminPromo', id] });
      }
    },
  });
};

export const usePromoSubmissions = (id, params) =>
  useQuery({
    queryKey: ['promoSubmissions', id, params],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await adminPromoApi.getPromoSubmissions(id, params);
      return (
        response?.submissions ||
        response?.data?.submissions ||
        response?.items ||
        []
      );
    },
  });

export const useReviewPromoSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, payload }) =>
      adminPromoApi.reviewPromoSubmission(submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['adminPromo'] });
      queryClient.invalidateQueries({ queryKey: ['adminPromos'] });
    },
  });
};

export const usePromoSlugAvailability = () =>
  useMutation({
    mutationFn: (slug) => adminPromoApi.checkSlugAvailability(slug),
  });

export const useUploadPromoBanner = () =>
  useMutation({
    mutationFn: (file) => adminPromoApi.uploadPromoBanner(file),
  });
