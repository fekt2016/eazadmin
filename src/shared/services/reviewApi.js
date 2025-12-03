import api from "./api";

export const reviewService = {
  /**
   * Get all reviews (admin only)
   * GET /api/v1/review
   */
  getAllReviews: async (params = {}) => {
    try {
      const { page = 1, limit = 50, ...otherParams } = params;
      const response = await api.get("/review", {
        params: { page, limit, ...otherParams },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      throw error;
    }
  },

  /**
   * Get a single review by ID
   * GET /api/v1/review/:id
   */
  getReview: async (id) => {
    try {
      const response = await api.get(`/review/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching review ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update a review
   * PATCH /api/v1/review/:id
   */
  updateReview: async (id, data) => {
    try {
      const response = await api.patch(`/review/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating review ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a review
   * DELETE /api/v1/review/:id
   */
  deleteReview: async (id) => {
    try {
      const response = await api.delete(`/review/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting review ${id}:`, error);
      throw error;
    }
  },

  /**
   * Approve a review (admin only)
   * PATCH /api/v1/admin/reviews/:id/approve
   */
  approveReview: async (id, moderationNotes) => {
    try {
      const response = await api.patch(`/admin/reviews/${id}/approve`, {
        moderationNotes,
      });
      return response.data;
    } catch (error) {
      console.error(`Error approving review ${id}:`, error);
      throw error;
    }
  },

  /**
   * Reject a review (admin only)
   * PATCH /api/v1/admin/reviews/:id/reject
   */
  rejectReview: async (id, moderationNotes) => {
    try {
      const response = await api.patch(`/admin/reviews/${id}/reject`, {
        moderationNotes,
      });
      return response.data;
    } catch (error) {
      console.error(`Error rejecting review ${id}:`, error);
      throw error;
    }
  },

  /**
   * Flag a review (admin only)
   * PATCH /api/v1/admin/reviews/:id/flag
   */
  flagReview: async (id, flaggedReason, moderationNotes) => {
    try {
      const response = await api.patch(`/admin/reviews/${id}/flag`, {
        flaggedReason,
        moderationNotes,
      });
      return response.data;
    } catch (error) {
      console.error(`Error flagging review ${id}:`, error);
      throw error;
    }
  },

  /**
   * Hide a review (admin only)
   * PATCH /api/v1/admin/reviews/:id/hide
   */
  hideReview: async (id, moderationNotes) => {
    try {
      const response = await api.patch(`/admin/reviews/${id}/hide`, {
        moderationNotes,
      });
      return response.data;
    } catch (error) {
      console.error(`Error hiding review ${id}:`, error);
      throw error;
    }
  },
};

