"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import InlineToast, { InlineToastKind } from "./inline-toast";
import { Product } from "../lib/types";

function StarRating({
  rating = 0,
  count = 0,
}: {
  rating?: number;
  count?: number;
}) {
  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${clamped} out of 5 stars`}
    >
      <div className="flex">
        {Array.from({ length: full }).map((_, i) => (
          <svg
            key={`full-${i}`}
            className="h-4 w-4 text-yellow-500"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.175 0L6.659 16.3c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.025 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.024-3.292z" />
          </svg>
        ))}
        {hasHalf && (
          <div className="relative h-4 w-4">
            <svg
              className="absolute inset-0 h-4 w-4 text-yellow-500"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <defs>
                <linearGradient id="halfStar" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.175 0L6.659 16.3c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.025 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.024-3.292z"
                fill="url(#halfStar)"
              />
            </svg>
            <svg
              className="absolute inset-0 h-4 w-4 text-gray-300"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.175 0L6.659 16.3c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.025 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.024-3.292z" />
            </svg>
          </div>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <svg
            key={`empty-${i}`}
            className="h-4 w-4 text-gray-300"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.175 0L6.659 16.3c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.025 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.024-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-500" aria-label={`${count} reviews`}>
        {count.toLocaleString()}
      </span>
    </div>
  );
}

type ProductCardProps = {
  product: Product & {
    brand?: string | null;
    list_price?: number | null; // optional strike-through
    rating?: number | null; // 0...5
    review_count?: number | null;
    fast_shipping?: boolean | null; // "Prime"/2-day vibe
    pickup_available?: boolean | null;
    badges?: string[] | null; // e.g. ["Best Seller","Limited Stock"]
  };
  userId?: string | null;
  initialSaved?: boolean;
};

export default function ProductCard({
  product,
  userId,
  initialSaved = false,
}: ProductCardProps) {
  const [isSaved, setIsSaved] = useState<boolean>(initialSaved);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [toastKey, setToastKey] = useState<number>(0);
  const [toastKind, setToastKind] = useState<InlineToastKind | null>(null);
  const [toastMessage, setToastMessage] = useState<string>("");

  const hasSale = useMemo(
    () =>
      typeof product.list_price === "number" &&
      product.list_price > Number(product.price),
    [product.list_price, Number(product.price)],
  );
  const savings = useMemo(
    () =>
      hasSale && product.list_price
        ? Math.max(0, product.list_price - Number(product.price))
        : 0,
    [hasSale, product.list_price, product.price],
  );

  function showToast(kind: InlineToastKind, message: string) {
    setToastKind(kind);
    setToastMessage(message);
    setToastKey((k) => k + 1);
  }

  async function handleToggleSave() {
    if (!userId) {
      showToast("info", "Please sign in to save items.");
      return;
    }
    const previous = isSaved;
    setIsSubmitting(true);
    setIsSaved(!previous); // optimistic

    try {
      const response = await fetch(`/api/profile/${userId}/saved`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      if (!response.ok) {
        setIsSaved(previous); // rollback
        showToast("error", "Could not update saved state. Tap to dismiss.");
      } else {
        showToast(
          "success",
          previous ? "Removed from saved." : "Saved to profile.",
        );
      }
    } catch {
      setIsSaved(previous);
      showToast("error", "Network error. Tap to dismiss.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md"
      aria-label={product.title}
    >
      {/* Image area */}
      <Link
        href={`/product/${product.id}`}
        className="block"
        aria-label={`View details for ${product.title}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
          <img
            src={product.image_url || "https://via.placeholder.com/480x360"}
            alt={product.title}
            className="h-full w-full object-contain transition-transform duration-150 group-hover:scale-[1.02]"
          />

          {/* Badges (top-left) */}
          {product.badges && product.badges.length > 0 && (
            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
              {product.badges.slice(0, 2).map((badge, idx) => (
                <span
                  key={`${badge}-${idx}`}
                  className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Fast shipping / pickup badges (top-right) */}
          <div className="absolute right-2 top-2 flex gap-1">
            {product.fast_shipping && (
              <span className="rounded bg-green-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                Fast Shipping
              </span>
            )}
            {product.pickup_available && (
              <span className="rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                Pickup Available
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Content area */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Brand (subtle) */}
        {product.brand && (
          <div className="text-[11px] uppercase tracking-wide text-gray-500">
            {product.brand}
          </div>
        )}

        {/* Title */}
        <Link
          href={`/product/${product.id}`}
          className="line-clamp-2 text-sm font-semibold text-gray-900 hover:underline"
        >
          {product.title}
        </Link>

        {/* Ratings */}
        {(product.rating || product.review_count) && (
          <StarRating
            rating={product.rating ?? 0}
            count={product.review_count ?? 0}
          />
        )}

        {/* Price block */}
        <div className="flex items-baseline gap-2">
          <div className="text-lg font-bold text-gray-900">
            ${Number(product.price).toFixed(2)}
          </div>
          {hasSale && product.list_price && (
            <>
              <div className="text-sm text-gray-400 line-through">
                ${product.list_price.toFixed(2)}
              </div>
              {savings > 0 && (
                <div className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700">
                  Save ${savings.toFixed(2)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action row */}
        <div className="mt-auto grid grid-cols-2 gap-2">
          {/* Save / Saved (wishlist) */}
          <button
            onClick={handleToggleSave}
            disabled={isSubmitting}
            className={`rounded-md px-2 py-1 text-sm transition ${
              isSaved
                ? "bg-blue-600 text-white"
                : "border border-blue-600 text-blue-600 hover:bg-blue-50"
            } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
            aria-pressed={isSaved}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Saving…" : isSaved ? "Saved" : "Save"}
          </button>

          {/* Add to Cart (stub—wire to your cart later) */}
          <button
            type="button"
            className="rounded-md bg-orange-600 px-2 py-1 text-sm font-medium text-white hover:bg-orange-700"
            aria-label={`Add ${product.title} to cart`}
            onClick={(e) => {
              e.preventDefault();
              // Cart wiring goes here; for now, show a toast
              setToastKind("success");
              setToastMessage("Added to cart (demo)");
              setToastKey((k) => k + 1);
            }}
          >
            Add to Cart
          </button>
        </div>

        {/* Secondary actions */}
        <div className="mt-2">
          <Link
            href={`/product/${product.id}`}
            className="text-xs text-blue-700 hover:underline"
          >
            Details
          </Link>
        </div>
      </div>

      {/* Mini toast (bottom-right) */}
      {toastKind && (
        <div
          key={toastKey}
          className="pointer-events-none absolute bottom-2 right-2"
        >
          <InlineToast
            kind={toastKind}
            message={toastMessage}
            onClose={() => {}}
          />
        </div>
      )}
    </article>
  );
}
