// Search
export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
};

export type SearchResponse = {
  results: Product[];
  meta?: { latency_ms: number; count: number };
  error?: string;
};

// useSearch
export type UseSearchOpts = {
  initialQuery?: string;
  delay?: number;
  limit?: number;
  minLength?: number; // NEW
  compose?: (q: string, category?: string, priceMax?: string) => string;
};

// Analytics
export type Summary = {
  total_queries: number;
  today_queries: number;
  avg_latency_ms: number;
  avg_results: number;
};

export type TopQuery = {
  query: string;
  hits: number;
};

export type DailyQueryCount = {
  day: string;
  hits: number;
};

export type SearchFilters = {
  priceMax?: number;
  category?: string;
};

// Profiles
export type UserPreferences = {
  default_category?: string;
  price_max?: number;
  page_limit?: number;
  theme?: string;
};

export type SavedItem = Product & { created_at?: string };
