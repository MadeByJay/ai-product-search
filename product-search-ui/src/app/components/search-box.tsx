"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useSearch } from "../lib/hooks/useSearch";
import { Product } from "../lib/types";

export default function SearchBox() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Preserve filters on navigation
  const category = searchParams.get("category") ?? "";
  const priceMax = searchParams.get("priceMax") ?? "";
  const limit = searchParams.get("limit") ?? "24";

  // Read current URL q so we can sync the input when the URL changes
  const qParam = searchParams.get("q") ?? "";

  // Hook with minLength gate
  const { query, setQuery, results, loading, error } = useSearch({
    initialQuery: qParam, // seed from URL on first mount
    delay: 250,
    limit: 8,
    minLength: 2,
  });

  // Keep the input synchronized with URL (?q=...) when it changes
  useEffect(() => {
    if (qParam !== query) setQuery(qParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam]);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Open when we have results or loading or error; close when empty/short
  const showPanel = useMemo(
    () => open && (loading || error || results.length > 0),
    [open, loading, error, results.length],
  );

  function navToSelection(product: Product) {
    // Reflect selection in the input immediately
    setQuery(product.title);
    // Focus/keep focus on input for continuity
    inputRef.current?.focus();

    const params = new URLSearchParams();
    params.set("q", product.title);
    if (category) params.set("category", category);
    if (priceMax) params.set("priceMax", priceMax);
    if (limit) params.set("limit", limit);

    router.push(`/?${params.toString()}`);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPanel) return;

    const max = results.length - 1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((index) => (index < max ? index + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((index) => (index > 0 ? index - 1 : max));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex <= max) {
        e.preventDefault();
        navToSelection(results[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-controls={listId}
        aria-activedescendant={
          activeIndex >= 0 && results[activeIndex]
            ? `${listId}-opt-${activeIndex}`
            : ""
        }
        placeholder="Search with AI…"
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-autocomplete="list"
      />

      {/* Suggestions dropdown */}
      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-white shadow"
        >
          {loading && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching…</div>
          )}
          {error && !loading && (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && results.length > 0 && (
            <ul>
              {results.map((result, index) => {
                const active = index === activeIndex;
                return (
                  <li
                    id={`${listId}-opt-${index}`}
                    key={result.id}
                    role="option"
                    aria-selected={active}
                    className={`cursor-pointer px-3 py-2 text-sm ${
                      active ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()} // prevent input blur before click
                    onClick={() => navToSelection(result)}
                  >
                    <div className="font-medium">{result.title}</div>
                    <div className="text-xs text-gray-500">
                      ${result.price} · {result.category}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">
              No suggestions
            </div>
          )}
        </div>
      )}
    </div>
  );
}
