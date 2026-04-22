import api from './api';

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const adminPromoApi = {
  async getPromos(params = {}) {
    const response = await api.get('/admin/promos', { params });
    return unwrap(response);
  },

  async getPromoById(id) {
    const response = await api.get(`/admin/promos/${id}`);
    return unwrap(response);
  },

  async createPromo(payload) {
    const response = await api.post('/admin/promos', payload);
    return unwrap(response);
  },

  async updatePromo(id, payload) {
    const response = await api.patch(`/admin/promos/${id}`, payload);
    return unwrap(response);
  },

  async cancelPromo(id) {
    const response = await api.patch(`/admin/promos/${id}/cancel`);
    return unwrap(response);
  },

  async getPromoSubmissions(id, params = {}) {
    const response = await api.get(`/admin/promos/${id}/submissions`, {
      params,
    });
    return unwrap(response);
  },

  async reviewPromoSubmission(submissionId, payload) {
    const response = await api.patch(
      `/admin/promos/submissions/${submissionId}`,
      payload,
    );
    return unwrap(response);
  },

  async checkSlugAvailability(slug) {
    const response = await api.get('/admin/promos/slug-availability', {
      params: { slug },
    });
    return unwrap(response);
  },

  async uploadPromoBanner(file) {
    const formData = new FormData();
    formData.append('banner', file);

    try {
      const response = await api.post('/admin/promos/upload-banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return unwrap(response);
    } catch (error) {
      const response = await api.post('/admin/promos/banner/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return unwrap(response);
    }
  },
};

export default adminPromoApi;
