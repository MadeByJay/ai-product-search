import { Suspense } from "react";
import { fetchSimilarProducts, fetchSavedIdSetByIds } from "./similar.data";
import { getOrSyncUserId } from "@/app/lib/user";
import ProductGrid from "@/app/components/product-grid";
import { Product } from "@/app/lib/types";
import ProductGridSkeleton from "@/app/components/product-grid.skeleton";

/** Inner async renderer so Suspense can be used from the page */
async function SimilarItemsInner({ productId }: { productId: string }) {
  const [userId, similar] = await Promise.all([
    getOrSyncUserId(),
    fetchSimilarProducts(productId, 12),
  ]);

  let savedIdSet: Set<string> | undefined;
  if (userId && similar.length) {
    const ids = similar.map((p) => p.id);

    savedIdSet = await fetchSavedIdSetByIds(userId, ids);
  }

  if (!similar.length) {
    return (
      <div className="rounded-md border bg-gray-50 p-4 text-sm text-gray-600">
        No similar items found.
      </div>
    );
  }

  return (
    <ProductGrid
      products={similar as Product[]}
      userId={userId}
      savedIdSet={savedIdSet}
    />
  );
}

/** Export a wrapper that the page can mount with Suspense */
export default function SimilarItemsSection({
  productId,
}: {
  productId: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Similar items</h2>
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <SimilarItemsInner productId={productId} />
      </Suspense>
    </section>
  );
}
