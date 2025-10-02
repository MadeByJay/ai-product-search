"use client";

import { useState } from "react";

const CATEGORIES = [
  "Furniture",
  "Office",
  "Lighting",
  "Decor",
  "Storage",
  "Bedroom",
  "Living Room",
  "Dining",
];

type Props = {
  /** Current full-text query to preserve across filter submits */
  q?: string;
  /** Selected category from URL (single-select for now) */
  currentCategory?: string;
  /** Selected priceMax from URL */
  currentPriceMax?: number;
  /** Result size to preserve */
  limit?: number;
};

export default function FiltersSidebar({
  q = "",
  currentCategory = "",
  currentPriceMax,
  limit = 24,
}: Props) {
  console.log(q, currentCategory, currentPriceMax, limit);
  // Initialize slider to match current URL or default
  const [price, setPrice] = useState<number>(currentPriceMax ?? 600);
  const minPrice = 50;
  const maxPrice = 2000;

  return (
    <aside className="w-64 shrink-0 border-r bg-gray-50 p-4">
      <h2 className="mb-4 text-lg font-semibold">Filters</h2>

      <form method="get" action="/" className="space-y-6">
        {/* Preserve q and limit so they don't get lost when filtering */}
        {q ? <input type="hidden" name="q" value={q} /> : null}
        {limit ? <input type="hidden" name="limit" value={limit} /> : null}

        {/* Category (single-select) */}
        <div>
          <h3 className="mb-2 font-medium text-gray-700">Category</h3>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="category"
                value=""
                defaultChecked={!currentCategory}
                className="accent-blue-500"
              />
              All
            </label>
            {CATEGORIES.map((cat) => (
              <label key={cat} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  defaultChecked={cat === currentCategory}
                  className="accent-blue-500"
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        {/* Price Max */}
        <div>
          <h3 className="mb-2 font-medium text-gray-700">
            Max Price: ${price}
          </h3>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={50}
            // This `name` is what lands in the URL as priceMax param
            name="priceMax"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>${minPrice}</span>
            <span>${maxPrice}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-md bg-orange-500 px-3 py-2 text-sm font-medium text-white hover:bg-orange-600"
            aria-label="Apply filters"
          >
            Apply Filters
          </button>

          {/* Clear filters but preserve q (if present) */}
          <a
            href={
              q
                ? `/?q=${encodeURIComponent(q)}&limit=${limit}`
                : `/?limit=${limit}`
            }
            className="flex-1 rounded-md border border-blue-500 px-3 py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-50"
            aria-label="Clear filters"
          >
            Clear
          </a>
        </div>
      </form>
    </aside>
  );
}
