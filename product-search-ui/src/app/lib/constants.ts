export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export const API_PATHS = {
  search: "/search",
  analytics: {
    summary: "/analytics/summary",
    topQueries: (limit = 10) => `/analytics/top-queries?limit=${limit}`,
    daily: (days = 7) => `/analytics/daily?days=${days}`,
  },
};
