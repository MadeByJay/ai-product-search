import { API_BASE } from "./constants";
import {
  SearchResponse,
  Summary,
  TopQuery,
  DailyQueryCount,
  SearchFilters,
} from "./types";

const fetchOpts: RequestInit = {
  cache: "no-store", // this is the default but including it as a stub for now
};

async function httpJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...fetchOpts, ...init });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || "Request failed"}`);
  }
  return response.json() as Promise<T>;
}

export async function searchProducts(
  query: string,
  limit: number,
  filters?: SearchFilters,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  return httpJson<SearchResponse>(`${API_BASE}/search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query,
      limit,
      priceMax: filters?.priceMax,
      category: filters?.category,
    }),
    signal,
  });
}

export async function getSummary(signal?: AbortSignal): Promise<Summary> {
  return httpJson<Summary>(`${API_BASE}/analytics/summary`, { signal });
}

export async function getTopQueries(
  limit = 10,
  signal?: AbortSignal,
): Promise<TopQuery[]> {
  const data = await httpJson<{ items: TopQuery[] }>(
    `${API_BASE}/analytics/top-queries?limit=${limit}`,
    { signal },
  );
  return data.items;
}

export async function getDailyCounts(
  days = 7,
  signal?: AbortSignal,
): Promise<DailyQueryCount[]> {
  const data = await httpJson<{ items: DailyQueryCount[] }>(
    `${API_BASE}/analytics/daily?days=${days}`,
    { signal },
  );
  return data.items;
}
