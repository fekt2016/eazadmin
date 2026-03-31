import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { testimonialService } from "../services/testimonialApi";
import { toast } from "react-toastify";

const useTestimonial = () => {
  const queryClient = useQueryClient();

  const useGetAllTestimonials = (params = {}) => {
    return useQuery({
      queryKey: ["admin-testimonials", params],
      queryFn: async () => {
        const body = await testimonialService.getAll(params);
        return body?.data?.testimonials || [];
      },
      staleTime: 1000 * 60 * 2,
    });
  };

  const useApproveTestimonial = () =>
    useMutation({
      mutationFn: (id) => testimonialService.approve(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
        toast.success("Testimonial approved and published");
      },
      onError: (err) => toast.error(err.response?.data?.message || "Failed to approve"),
    });

  const useRejectTestimonial = () =>
    useMutation({
      mutationFn: ({ id, note }) => testimonialService.reject(id, note),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
        toast.success("Testimonial rejected");
      },
      onError: (err) => toast.error(err.response?.data?.message || "Failed to reject"),
    });

  const useUnpublishTestimonial = () =>
    useMutation({
      mutationFn: (id) => testimonialService.unpublish(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
        toast.success("Testimonial removed from homepage");
      },
      onError: (err) => toast.error(err.response?.data?.message || "Failed to unpublish"),
    });

  const useDeleteTestimonial = () =>
    useMutation({
      mutationFn: (id) => testimonialService.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
        toast.success("Testimonial deleted");
      },
      onError: (err) => toast.error(err.response?.data?.message || "Failed to delete"),
    });

  return {
    useGetAllTestimonials,
    useApproveTestimonial,
    useRejectTestimonial,
    useUnpublishTestimonial,
    useDeleteTestimonial,
  };
};

export default useTestimonial;
