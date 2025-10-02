import Link from "next/link";
import HeroBanner from "../app/components/hero-banner";
import FiltersSidebar from "./components/filters-sidebar";
import ProductCard from "./components/product-card";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
};

type SearchResponse = {
  results: Product[];
  meta?: { latency_ms: number; count: number };
  error?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

/**
 * Compose a natural language query for the embeddings service while
 * honoring simple filters coming from the UI (category, priceMax).
 */
function composeQuery(baseQ: string, category?: string, priceMax?: string) {
  const parts: string[] = [];
  if (baseQ) parts.push(baseQ);
  if (category) parts.push(`Category: ${category}`);
  if (priceMax) parts.push(`Price under $${priceMax}`);
  return parts.join(". ");
}

async function fetchProducts(
  query: string,
  limit: number,
): Promise<SearchResponse> {
  console.log(query);
  try {
    const res = await fetch(`${API_BASE}/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, limit }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { results: [], error: `API ${res.status}: ${text}` };
    }
    return (await res.json()) as SearchResponse;
  } catch (err: any) {
    return { results: [], error: err?.message || "Network error" };
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // URL params from navbar/hero/categories
  const {
    q: query,
    category: categoryParam,
    priceMax: priceMaxParam,
    limit: limitParam,
  } = await searchParams;

  const q =
    (Array.isArray(query) ? query[0] : query) || "ergonomic office chair";
  const category = Array.isArray(categoryParam)
    ? categoryParam[0]
    : categoryParam;

  const priceMaxRaw = Array.isArray(priceMaxParam)
    ? priceMaxParam[0]
    : priceMaxParam;

  const priceMax = priceMaxRaw ? Number(priceMaxRaw) : 600;

  const limit =
    Number(Array.isArray(limitParam) ? limitParam[0] : limitParam) || 24;

  const composed = composeQuery(q, category, priceMaxRaw);
  const { results, meta, error } = await fetchProducts(composed, limit);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <HeroBanner />

      {/* Main two-column layout */}
      <div className="flex gap-6">
        {/* Sidebar (collapsible would be a later enhancement) */}

        <FiltersSidebar
          q={q}
          currentCategory={category}
          currentPriceMax={priceMax}
          limit={limit}
        />

        {/* Results */}
        <main className="min-h-[60vh] flex-1">
          {/* Search summary / status line */}
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {q || category || priceMax ? (
                <>
                  Showing results for&nbsp;
                  <span className="font-medium text-gray-900">
                    {q || "your query"}
                  </span>
                  {category ? (
                    <>
                      <span className="font-medium text-gray-900">
                        {` in ${category}`}
                      </span>
                    </>
                  ) : null}
                  {priceMax ? (
                    <>
                      <span className="font-medium text-gray-900">
                        {` (>= $${priceMax})`}
                      </span>
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  Use the search bar above or click an example prompt to get
                  started.
                </>
              )}
            </div>

            {/* Link to dashboard */}
            <a
              href="/dashboard"
              className="rounded-md border border-blue-500 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
            >
              View Analytics
            </a>
          </div>

          {/* Error / Empty states */}
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-md border bg-gray-50 p-6 text-center text-sm text-gray-600">
              No results yet. Try a broader prompt or remove filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
