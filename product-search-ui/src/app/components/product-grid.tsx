import { Product } from "../lib/types";
import ProductCard from "./product-card";

type ProductGridProps = {
  products: Product[];
  userId?: string | null;
  savedIdSet?: Set<string>;
};

export default function ProductGrid({
  products,
  userId,
  savedIdSet,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          userId={userId}
          initialSaved={savedIdSet?.has(p.id) ?? false}
        />
      ))}
    </div>
  );
}
