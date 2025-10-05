"use client";

import Link from "next/link";
import { Product } from "../lib/types";
import { useState } from "react";

export default function ProductCard({
  product,
  userId,
}: {
  product: Product;
  userId?: string | null;
}) {
  const [saved, setSaved] = useState(false);

  async function onToggle() {
    if (!userId) return alert("Please sign in to save items.");

    setSaved((saved) => !saved); // optimistic

    await fetch(`/api/profile/${userId}/saved`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    }).catch(() => setSaved((saved) => !saved));
  }

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
          <button
            onClick={onToggle}
            className={`rounded-md px-2 py-1 text-sm ${saved ? "bg-blue-500 text-white" : "border border-blue-500 text-blue-600 hover:bg-blue-50"}`}
            aria-pressed={saved}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
