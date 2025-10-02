import Link from "next/link";
import HeroBanner from "../app/components/hero-banner";
import FiltersSidebar from "./components/filters-sidebar";
import ProductCard from "./components/product-card";
import { Product, SearchResponse } from "./lib/types";
import { API_BASE } from "./lib/constants";
import { searchProducts } from "./lib/api";

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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] }>;
}) {
  // URL params from navbar/hero/categories
  const {
    q: query,
    category: categoryParam,
    priceMax: priceMaxParam,
    limit: limitParam,
  } = await searchParams;

  const pick = (value?: string | string[]) =>
    (Array.isArray(value) ? value[0] : value) ?? "";

  const q = pick(query);

  const category = pick(categoryParam);

  const priceMaxRaw = pick(priceMaxParam);

  const priceMax = priceMaxRaw ? Number(priceMaxRaw) : 600;

  const limit = Number() || 24;

  const composed = composeQuery(q, category, priceMaxRaw);

  let results: Product[] = [];
  let error: string = "";
  let meta: SearchResponse["meta"];

  try {
    const res = await searchProducts(composed, limit, { priceMax, category });
    results = res.results;
    meta = res.meta;
  } catch (err: any) {
    error = err?.message || "Search Failed";
  }

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
