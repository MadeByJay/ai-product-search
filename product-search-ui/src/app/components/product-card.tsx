"use client";

import Link from "next/link";

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="flex flex-col rounded-lg border bg-white shadow-sm hover:shadow-md">
      <img
        src={product.image_url || "https://via.placeholder.com/300x200"}
        alt={product.title}
        className="h-40 w-full rounded-t-lg object-cover"
      />
      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-semibold">{product.title}</h3>
        <p className="flex-1 truncate text-xs text-gray-500">
          {product.description}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-orange-600 font-bold">${product.price}</span>
          <span className="text-xs text-gray-400">{product.category}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="flex-1 rounded-md bg-orange-500 px-2 py-1 text-sm text-white hover:bg-orange-600">
            Add to Cart
          </button>
          <Link
            href={`/product/${product.id}`}
            className="flex-1 rounded-md border border-blue-500 px-2 py-1 text-center text-sm text-blue-500 hover:bg-blue-50"
          >
            See Similar
          </Link>
        </div>
      </div>
    </div>
  );
}
