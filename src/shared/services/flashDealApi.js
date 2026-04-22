import api from "./api";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

const flashDealApi = {
  async createFlashDeal(data) {
    const response = await api.post("/admin/flash-deals", data);
    return unwrap(response);
  },

  async getFlashDeals(params = {}) {
    const response = await api.get("/admin/flash-deals", { params });
    return unwrap(response);
  },

  async getFlashDeal(id) {
    const response = await api.get(`/admin/flash-deals/${id}`);
    return unwrap(response);
  },

  async updateFlashDeal(id, data) {
    const response = await api.patch(`/admin/flash-deals/${id}`, data);
    return unwrap(response);
  },

  async deleteFlashDeal(id) {
    const response = await api.delete(`/admin/flash-deals/${id}`);
    return unwrap(response);
  },

  async cancelFlashDeal(id) {
    const response = await api.patch(`/admin/flash-deals/${id}/cancel`);
    return unwrap(response);
  },

  async getSubmissions(id, params = {}) {
    const response = await api.get(`/admin/flash-deals/${id}/submissions`, {
      params,
    });
    return unwrap(response);
  },

  async reviewSubmission(submissionId, data) {
    const response = await api.patch(
      `/admin/flash-deals/submissions/${submissionId}`,
      data
    );
    return unwrap(response);
  },

  async uploadBanner(id, file) {
    const formData = new FormData();
    formData.append("banner", file);

    const response = await api.post(
      `/admin/flash-deals/${id}/banner`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return unwrap(response);
  },
};

export default flashDealApi;
