"use client";

import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-400 to-blue-500 opacity-90" />
      <div className="relative z-10 px-6 py-12 text-white sm:px-10 sm:py-16">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Find anything with AI search
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/90 sm:text-base">
          Describe what you want in your own words — we’ll surface the most
          relevant products and similar items instantly.
        </p>

        {/* Example prompts */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            "modern walnut dining table under $600",
            "ergonomic office chair with lumbar support",
            "minimalist floor lamp for living room",
          ].map((ex) => (
            <Link
              key={ex}
              href={{ pathname: "/", query: { q: ex } }}
              className="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur hover:bg-white/25"
            >
              {ex}
            </Link>
          ))}
        </div>
      </div>

      {/* Decorative angle */}
      <svg
        className="absolute -right-10 -top-10 h-40 w-40 text-white/20"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <polygon points="0,0 100,0 100,100" />
      </svg>
    </section>
  );
}
