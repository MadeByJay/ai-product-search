"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function Navbar() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const category = sp.get("category") ?? "";
  const priceMax = sp.get("priceMax") ?? "";
  const limit = sp.get("limit") ?? "24";

  const clearHref = q
    ? `/?q=${encodeURIComponent(q)}&limit=${limit}`
    : `/?limit=${limit}`;

  return (
    <header className="w-full border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-orange-500">
          AI Shop
        </Link>

        {/* Search Bar (preserves filters) */}
        <form
          action="/"
          method="get"
          className="mx-4 hidden flex-1 max-w-md sm:flex items-stretch gap-2"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search with AI..."
            className="w-full rounded-l-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {/* Preserve active filters */}
          {category ? (
            <input type="hidden" name="category" value={category} />
          ) : null}
          {priceMax ? (
            <input type="hidden" name="priceMax" value={priceMax} />
          ) : null}
          {limit ? <input type="hidden" name="limit" value={limit} /> : null}
          <button
            type="submit"
            className="rounded-r-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            Search
          </button>
          <Link
            href={clearHref}
            className="rounded-md border border-blue-500 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            aria-label="Clear filters (keep search text)"
          >
            Clear
          </Link>
        </form>

        {/* Nav Links */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/categories"
            className="text-gray-700 hover:text-blue-500"
          >
            Categories
          </Link>
          <Link href="/dashboard" className="text-gray-700 hover:text-blue-500">
            Dashboard
          </Link>
          <Link href="/profile" className="text-gray-700 hover:text-blue-500">
            Profile
          </Link>
          <Link
            href="/cart"
            className="rounded-md bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
          >
            Cart
          </Link>
        </nav>
      </div>
    </header>
  );
}
