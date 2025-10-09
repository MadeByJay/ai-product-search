import { NEST_API_BASE } from "@/app/lib/constants";
import { Product } from "@/app/lib/types";
import { headers } from "next/headers";

export async function fetchSimilarProducts(
  productId: string,
  limit = 12,
): Promise<Product[]> {
  const response = await fetch(
    `${NEST_API_BASE}/products/${productId}/similar?limit=${limit}`,
    {
      cache: "no-store",
    },
  ).catch(() => null);

  if (!response || !response.ok) return [];

  return (await response.json()) as Product[];
}

/** Ask proxy which of these IDs are saved (compact, only visible ids) */
export async function fetchSavedIdSetByIds(
  userId: string,
  productIds: string[],
): Promise<Set<string>> {
  if (!productIds.length) return new Set();

  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? "";
  const params = new URLSearchParams({ ids: productIds.join(",") });

  const response = await fetch(
    `${NEST_API_BASE}/profile/${userId}/saved/check?${params.toString()}`,
    {
      headers: { cookie: cookie },
      cache: "no-store",
    },
  );

  if (!response.ok) return new Set();

  const { saved } = (await response.json()) as { saved: string[] };

  return new Set(saved);
}
