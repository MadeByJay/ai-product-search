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
