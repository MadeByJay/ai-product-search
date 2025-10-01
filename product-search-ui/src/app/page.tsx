"use client";
import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

type Product = {
  id: string;
  title: string;
  description?: string;
  price?: number;
  category?: string;
  image_url?: string;
};

export default function Page() {
  const [q, setQ] = useState("modern walnut dining table under $600");
  const [results, setResults] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/search`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q, limit: 12 }),
      });
      const data = await resp.json();
      setResults(data.results || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>AI Product Search</h1>
      <form
        onSubmit={onSearch}
        style={{ display: "flex", gap: 8, marginBottom: 16 }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe what you're looking for..."
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #d1d5db",
            borderRadius: 10,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #111827",
            background: "#111827",
            color: "#fff",
          }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {results && results.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            gap: 16,
          }}
        >
          {results.map((r) => (
            <div
              key={r.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  r.image_url ||
                  "https://via.placeholder.com/300x140?text=Product"
                }
                alt=""
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 8,
                  background: "#f3f4f6",
                }}
              />
              <div style={{ fontWeight: 600, marginTop: 8 }}>{r.title}</div>
              <div style={{ color: "#6b7280" }}>
                {r.price ? `$${r.price} · ` : ""}
                {r.category || "General"}
              </div>
              <div style={{ color: "#6b7280" }}>
                {(r.description || "").slice(0, 120)}...
              </div>
            </div>
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <p>No results. Try another prompt.</p>
      )}
    </div>
  );
}
