export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api";
export const NEXTAUTH_API_BASE =
  process.env.NEXTAUTH_URL || "http://localhost:3000";

if (!API_BASE) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE is not set. Define it in .env.local (e.g. http://localhost:3001 or http://localhost:3001/api).",
  );
}

export const API_PATHS = {
  search: "/search",
  analytics: {
    summary: "/analytics/summary",
    topQueries: (limit = 10) => `/analytics/top-queries?limit=${limit}`,
    daily: (days = 7) => `/analytics/daily?days=${days}`,
  },
};

export const CATEGORIES = [
  "Furniture",
  "Office",
  "Lighting",
  "Decor",
  "Storage",
  "Bedroom",
  "Living Room",
  "Dining",
];

export const DEMO_USER = "00000000-0000-0000-0000-000000000001"; // demo user id
