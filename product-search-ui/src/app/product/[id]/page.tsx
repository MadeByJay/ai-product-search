import { NEST_API_BASE } from "@/app/lib/constants";
import { Product } from "@/app/lib/types";
import { getOrSyncUserId } from "@/app/lib/user";
import SaveProductClient from "../../components/save-product-client";
import { getRequestOrigin } from "@/app/lib/origin";
import { headers } from "next/headers";
import SimilarItemsSection from "./similar-section";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchProduct(id: string): Promise<Product | null> {
  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? "";

  const response = await fetch(`${NEST_API_BASE}/products/${id}`, {
    headers: { cookie },
    cache: "no-store",
  }).catch(() => null);

  if (!response || !response.ok) return null;

  return (await response.json()) as Product;
}

async function fetchSavedIdSet(userId: string): Promise<Set<string>> {
  const origin = await getRequestOrigin();
  const headerStore = await headers();
  const cookie = headerStore.get("cookie") ?? "";

  const response = await fetch(`${NEST_API_BASE}/profile/${userId}/saved`, {
    headers: { cookie },
    cache: "no-store",
  });

  if (!response.ok) return new Set();

  const items = (await response.json()) as Product[];

  return new Set(items.map((p) => p.id));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getOrSyncUserId();
  const product = await fetchProduct(id);

  if (!product) {
    return <div className="p-6">Product not found.</div>;
  }

  const savedIdSet = userId ? await fetchSavedIdSet(userId) : new Set<string>();
  const initialSaved = userId ? savedIdSet.has(product.id) : false;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border bg-gray-100">
        <img
          src={product.image_url || "https://via.placeholder.com/1200x675"}
          alt={product.title}
          className="h-full w-full object-cover"
        />
      </div>
      <div>
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <div className="mt-1 text-gray-600">
          ${product.price} · {product.category || "General"}
        </div>
        <p className="mt-4 text-gray-700">{product.description}</p>
      </div>

      <div className="flex gap-3">
        <SaveProductClient
          productId={product.id}
          userId={userId}
          initialSaved={initialSaved}
        />
      </div>
      <SimilarItemsSection productId={id} />
    </div>
  );
}
