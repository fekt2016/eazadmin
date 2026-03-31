import api from "./api";

/**
 * Status videos API — same as buyer app.
 * GET /api/v1/statuses returns feed of status groups (seller + statuses).
 * Used by admin to list all status videos; no auth role check on backend for this route.
 *
 * Response: { status: 'success', data: groups }
 * Group: { seller: { _id, name, shopName, avatar, isVerified }, statuses: Status[], hasUnseen }
 * Status: { _id, videoUrl, thumbnailUrl, caption, duration, product, viewCount, createdAt, expiresAt }
 */
export const getStatusFeed = async () => {
  const response = await api.get("/statuses");
  return response.data;
};

/**
 * Mark a status as viewed (same as buyer app).
 * POST /api/v1/statuses/:id/view
 * When watchTimeSeconds >= 3 the backend increments Status.views.
 */
export const markStatusViewed = async (statusId, { watchTimeSeconds = 3, completionRate = 100 } = {}) => {
  const response = await api.post(`/statuses/${statusId}/view`, {
    watchTimeSeconds,
    completionRate,
  });
  return response.data;
};
