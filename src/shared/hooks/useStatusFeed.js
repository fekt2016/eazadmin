import { useQuery } from "@tanstack/react-query";
import { getStatusFeed } from "../services/statusApi";

const unwrapData = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw?.data != null) {
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.data.data)) return raw.data.data;
  }
  return [];
};

const getViewCount = (s) => {
  if (s == null) return 0;
  const v = s.viewCount ?? s.views;
  return Math.max(0, Number(v) || 0);
};

/** Normalize so every status has numeric viewCount (from backend views/viewCount). */
const normalizeFeed = (groups) => {
  if (!Array.isArray(groups)) return [];
  return groups.map((g) => ({
    ...g,
    statuses: (g.statuses || []).map((s) => ({
      ...s,
      viewCount: getViewCount(s),
      views: getViewCount(s),
    })),
  }));
};

/**
 * useGetStatusFeed — same as buyer app.
 * Fetches all seller status groups (GET /api/v1/statuses).
 * queryKey: ['statuses', 'feed']
 */
export const useGetStatusFeed = () => {
  return useQuery({
    queryKey: ["statuses", "feed"],
    queryFn: async () => {
      const data = await getStatusFeed();
      const groups = unwrapData(data);
      return normalizeFeed(groups);
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
};
