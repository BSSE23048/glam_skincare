import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { money } from "../config/business";
import { products as catalogProducts } from "../data/catalog";
import type { Product } from "../types";

export function recordRecentlyViewed(productId: string) {
  try {
    const key = "glam_recently_viewed";
    const existing = JSON.parse(localStorage.getItem(key) || "[]") as string[];
    const filtered = existing.filter((id) => id !== productId);
    const updated = [productId, ...filtered].slice(0, 4);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}

export function RecentlyViewed({ currentId }: { currentId?: string }) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const key = "glam_recently_viewed";
      const stored = JSON.parse(localStorage.getItem(key) || "[]") as string[];
      const filtered = stored.filter((id) => id !== currentId);
      const matches = catalogProducts.filter((p) => filtered.includes(p.id));
      setItems(matches);
    } catch {
      setItems([]);
    }
  }, [currentId]);

  if (!items.length) return null;

  return (
    <section className="section container" style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>CURATED FOR YOU</p>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: "1.5rem", color: "#302E2A" }}>
          Recently Viewed Essentials
        </h3>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {items.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.slug}`}
            style={{
              display: "block",
              background: "#FFF",
              border: "1px solid #EFEAE3",
              borderRadius: "12px",
              padding: "1rem",
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            <img
              src={p.images[0]}
              alt={p.name}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "0.75rem",
              }}
            />
            <h4 style={{ fontSize: "1rem", fontFamily: "Georgia, serif", color: "#302E2A", marginBottom: "0.25rem" }}>
              {p.name}
            </h4>
            <p style={{ fontSize: "0.85rem", color: "#685F57", marginBottom: "0.5rem" }}>
              {p.subtitle}
            </p>
            <strong style={{ fontSize: "0.95rem", color: "#302E2A" }}>{money(p.price)}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
