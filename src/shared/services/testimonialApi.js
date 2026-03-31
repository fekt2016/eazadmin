import api from "./api";

export const testimonialService = {
  getAll: async (params = {}) => {
    const response = await api.get("/admin/testimonials", { params });
    return response.data;
  },

  approve: async (id) => {
    const response = await api.patch(`/admin/testimonials/${id}/approve`);
    return response.data;
  },

  reject: async (id, note) => {
    const response = await api.patch(`/admin/testimonials/${id}/reject`, { note });
    return response.data;
  },

  unpublish: async (id) => {
    const response = await api.patch(`/admin/testimonials/${id}/unpublish`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/admin/testimonials/${id}`);
    return response.data;
  },
};
