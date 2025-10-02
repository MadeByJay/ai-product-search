import Link from "next/link";
import { headers } from "next/headers";
import { CATEGORIES } from "../lib/constants";

/** Read current URL params on the server so we can preserve them in links */
async function getCurrentParams() {
  const requestHeaders = await headers();
  const url = new URL(
    requestHeaders.get("x-forwarded-proto")
      ? `${requestHeaders.get("x-forwarded-proto")}://${requestHeaders.get("host")}${requestHeaders.get("x-invoke-path") || "/"}`
      : `http://${requestHeaders.get("host")}${requestHeaders.get("x-invoke-path") || "/"}`,
  );
  // Fallback for environments that don't set x-invoke-path; Next exposes full URL in request in prod.
  // We only need q, priceMax, limit — category will be set by the chip.
  const search = new URLSearchParams(url.search);
  const q = search.get("q") || "";
  const priceMax = search.get("priceMax") || "";
  const limit = search.get("limit") || "24";
  return { q, priceMax, limit };
}

export default async function CategoriesPage() {
  const { q: query, priceMax, limit } = await getCurrentParams();

  const baseParams = (extra?: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (priceMax) params.set("priceMax", priceMax);
    if (limit) params.set("limit", limit);

    if (extra?.category) {
      params.set("category", extra.category);
    }

    const queryString = params.toString();
    return queryString ? `/?${queryString}` : "/";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Browse Categories</h1>
        {/* Clear category but preserve q/limit/priceMax */}
        <Link
          href={baseParams({ category: "" })}
          className="rounded-md border border-blue-500 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
        >
          All
        </Link>
      </div>

      {/* Helpful context */}
      {(query || priceMax) && (
        <p className="text-sm text-gray-600">
          Current filters:&nbsp;
          {query && (
            <span className="font-medium text-gray-900">“{query}”</span>
          )}
          {query && (priceMax ? " · " : "")}
          {priceMax && (
            <>
              ≤ <span className="font-medium text-gray-900">${priceMax}</span>
            </>
          )}
        </p>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={baseParams({ category: cat })}
            className="group rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-2 h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-blue-500 opacity-90" />
            <div className="font-medium">{cat}</div>
            <div className="text-xs text-gray-500 group-hover:text-gray-600">
              Explore {cat.toLowerCase()}
            </div>
          </Link>
        ))}
      </div>

      {/* CTA back to search */}
      <div>
        <Link
          href={baseParams()}
          className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-3 py-2 text-white hover:bg-orange-600"
        >
          ← Back to Search
        </Link>
      </div>
    </div>
  );
}
