import { headers } from "next/headers";
import HeroBanner from "../app/components/hero-banner";
import FiltersSidebar from "./components/filters-sidebar";
import ProductCard from "./components/product-card";
import { Product, SearchResponse } from "./lib/types";
import { searchProducts } from "./lib/api";
import { getOrSyncUserId } from "./lib/user";
import { getRequestOrigin } from "./lib/origin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

async function fetchSavedIdSetByIds(
  userId: string,
  productIds: string[],
): Promise<Set<string>> {
  if (!productIds.length) return new Set();

  const origin = await getRequestOrigin();
  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? "";

  const params = new URLSearchParams({ ids: productIds.join(",") });

  const response = await fetch(
    `${origin}/api/profile/${userId}/saved/check?${params.toString()}`,
    {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    },
  );

  if (!response.ok) return new Set();

  const { saved } = (await response.json()) as { saved: string[] };

  return new Set(saved);
}
function readParam(
  searchParams: Record<string, string | string[] | null>,
  name: string,
): string {
  const value = searchParams[name];
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] }>;
}) {
  // URL params from navbar/hero/categories
  const sp = await searchParams;

  const userId = await getOrSyncUserId(); // null if unauthenticated

  const queryText = readParam(sp, "q");
  const category = readParam(sp, "category");
  const priceMaxRaw = readParam(sp, "priceMax");
  const limit = Math.max(1, Number(readParam(sp, "limit")) || 24);

  const pageRaw = readParam(sp, "page");
  const page = Math.max(1, Number(pageRaw) || 1);
  const offset = (page - 1) * limit;

  // Compose query for embeddings + send filters with offset
  const composed = composeQuery(queryText, category, priceMaxRaw);
  const priceMax = priceMaxRaw ? Number(priceMaxRaw) : undefined;

  // Fetch search results (and saved IDs, if logged in) in parallel
  const searchResponse = await searchProducts(
    composed,
    limit,
    {
      priceMax,
      category,
    },
    null,
    offset,
  );

  const { results, error, meta } = searchResponse;
  const visibleIds = results.map((product) => product.id);

  const savedIdSet = userId
    ? await fetchSavedIdSetByIds(userId, visibleIds)
    : await Promise.resolve(new Set<string>()); // TODO - double check this

  const hasPrev = page > 1;
  const hasNext = results.length === limit;

  function buildPageHref(nextPage: number) {
    const params = new URLSearchParams();

    if (queryText) params.set("q", queryText);
    if (category) params.set("category", category);
    if (priceMaxRaw) params.set("priceMax", priceMaxRaw);

    params.set("limit", String(limit));
    params.set("page", String(nextPage));

    return "/?" + params.toString();
  }

  return (
    <div className="space-y-4">
      {/* Hero */}
      <HeroBanner />

      {/* Main two-column layout */}
      <div className="flex gap-6">
        {/* Sidebar */}

        <FiltersSidebar
          q={queryText}
          currentCategory={category}
          currentPriceMax={priceMax}
          limit={limit}
        />

        {/* Results */}
        <main className="min-h-[60vh] flex-1">
          {/* Search summary / status line */}
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {queryText || category || priceMax ? (
                <>
                  Showing results for&nbsp;
                  <span className="font-medium text-gray-900">
                    {queryText || "your query"}
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
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {results.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    userId={userId}
                    initialSaved={savedIdSet.has(product.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <a
                  aria-disabled={!hasPrev}
                  href={hasPrev ? buildPageHref(page - 1) : ""}
                  className={`rounded-md border px-3 py-1 text-sm ${
                    hasPrev
                      ? "border-blue-500 text-blue-600 hover:bg-blue-50"
                      : "cursor-not-allowed border-gray-200 text-gray-400"
                  }`}
                >
                  Previous
                </a>

                <div className="text-sm text-gray-600">
                  Page <span className="font-medium">{page}</span>
                </div>

                <a
                  aria-disabled={!hasNext}
                  href={hasNext ? buildPageHref(page + 1) : ""}
                  className={`rounded-md border px-3 py-1 text-sm ${
                    hasNext
                      ? "border-blue-500 text-blue-600 hover:bg-blue-50"
                      : "cursor-not-allowed border-gray-200 text-gray-400"
                  }`}
                >
                  Next
                </a>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
