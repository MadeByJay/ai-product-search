"use client";

import { useSearchParams } from "next/navigation";
import { Product, SearchResponse, UseSearchOpts } from "../types";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchProducts } from "../api";

/**
 * Client-only callback that composes a natural-language query
 * from UI inputs. This is not a Server Action.
 */
function composeQuery(baseQ: string, category?: string, priceMax?: string) {
  const parts: string[] = [];
  if (baseQ) parts.push(baseQ);
  if (category) parts.push(`Category: ${category}`);
  if (priceMax) parts.push(`Price under $${priceMax}`);
  return parts.join(". ");
}

/**
 * Debounced, abortable search that respects URL filters (category, priceMax, limit).
 * Skips API calls when query length < minLength.
 */
export function useSearch({
  initialQuery = "",
  delay = 300,
  limit = 8,
  minLength = 2,
  compose = composeQuery,
}: UseSearchOpts = {}) {
  const sp = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const timer = useRef<number | null>(null);
  const controller = useRef<AbortController | null>(null);

  const category = sp.get("category")!;
  const priceMaxRaw = sp.get("priceMax") ?? undefined;
  const pageLimit = Number(sp.get("limit") ?? "") || limit;
  const composed = useMemo(
    () => compose(query, category, priceMaxRaw),
    [query, category, priceMaxRaw, compose],
  );

  useEffect(() => {
    // Gate by min length
    if (!query.trim() || query.trim().length < minLength) {
      setResults([]);
      setError("");
      setLoading(false);
      if (controller.current) controller.current.abort();
      if (timer.current) window.clearTimeout(timer.current);
      return;
    }

    setLoading(true);
    setError("");

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      if (controller.current) controller.current.abort();
      controller.current = new AbortController();

      try {
        const res: SearchResponse = await searchProducts(
          composed,
          pageLimit,
          { category, priceMax: priceMaxRaw ? Number(priceMaxRaw) : undefined },
          controller.current.signal,
        );
        setResults(res.results || []);
        setError(res.error);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setError(err?.message || "Search failed");
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, delay) as unknown as number;

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [composed, category, priceMaxRaw, pageLimit, delay, minLength, query]);

  return { query, setQuery, results, loading, error };
}
