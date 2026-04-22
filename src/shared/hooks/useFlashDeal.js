import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import flashDealApi from "../services/flashDealApi";

export function useGetFlashDeals(params) {
  return useQuery({
    queryKey: ["flashDeals", params],
    queryFn: async () => {
      const res = await flashDealApi.getFlashDeals(params);
      return res?.flashDeals ?? [];
    },
  });
}

export function useGetFlashDeal(id) {
  return useQuery({
    queryKey: ["flashDeal", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await flashDealApi.getFlashDeal(id);
      return res;
    },
  });
}

export function useCreateFlashDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => flashDealApi.createFlashDeal(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashDeals"] });
    },
  });
}

export function useUpdateFlashDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => flashDealApi.updateFlashDeal(id, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["flashDeals"] });
      if (vars?.id) qc.invalidateQueries({ queryKey: ["flashDeal", vars.id] });
    },
  });
}

export function useDeleteFlashDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => flashDealApi.deleteFlashDeal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashDeals"] });
    },
  });
}

export function useCancelFlashDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => flashDealApi.cancelFlashDeal(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["flashDeals"] });
      if (id) qc.invalidateQueries({ queryKey: ["flashDeal", id] });
    },
  });
}

export function useGetSubmissions(id, params) {
  return useQuery({
    queryKey: ["flashDealSubmissions", id, params],
    enabled: !!id,
    queryFn: async () => {
      const res = await flashDealApi.getSubmissions(id, params);
      return res?.submissions ?? [];
    },
  });
}

export function useReviewSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, data }) =>
      flashDealApi.reviewSubmission(submissionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flashDealSubmissions"] });
      qc.invalidateQueries({ queryKey: ["flashDeal"] });
      qc.invalidateQueries({ queryKey: ["flashDeals"] });
    },
  });
}

export function useUploadBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }) => flashDealApi.uploadBanner(id, file),
    onSuccess: (_d, vars) => {
      if (vars?.id) qc.invalidateQueries({ queryKey: ["flashDeal", vars.id] });
      qc.invalidateQueries({ queryKey: ["flashDeals"] });
    },
  });
}
