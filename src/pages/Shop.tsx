import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { useCatalog } from "../contexts/SiteContext";
import { PageHeading, ProductCard } from "../components/ui";

export default function Shop() {
  const { products } = useCatalog();
  const [params, setParams] = useSearchParams();

  const q = params.get("q") || "";
  const category = params.get("category") || "all";
  const sort = params.get("sort") || "featured";
  const stock = params.get("stock") === "true";
  const colour = params.get("colour") || "all";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const filtered = products
    .filter(
      (p) =>
        `${p.name} ${p.subtitle} ${p.description}`
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (category === "all" || p.category === category) &&
        (!stock || p.variants.some((v) => v.stock > 0)) &&
        (colour === "all" || p.variants.some((v) => v.id === colour)),
    )
    .sort((a, b) =>
      sort === "price-asc"
        ? a.price - b.price
        : sort === "price-desc"
          ? b.price - a.price
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : 0,
    );

  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <section className="container page-space">
      <PageHeading eyebrow="THE GLAM COLLECTION" title="Less, but lovelier.">
        Thoughtful essentials. Simple rituals. A little more care for your everyday.
      </PageHeading>
      <div className="shop-toolbar">
        <div className="search-field">
          <Search size={19} />
          <input
            aria-label="Search products"
            placeholder="Find your essential…"
            value={q}
            onChange={(e) => update("q", e.target.value)}
          />
        </div>
        <label className="sort-label">
          Sort by
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </label>
      </div>
      <div className="shop-layout">
        <aside className="shop-filters">
          <h2>
            <SlidersHorizontal size={17} />
            Refine your ritual
          </h2>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="all">All essentials</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Colour
            <select
              value={colour}
              onChange={(e) => update("colour", e.target.value)}
            >
              <option value="all">All colours</option>
              <option value="blush">Blush Pink</option>
              <option value="ivory">Soft White</option>
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={stock}
              onChange={(e) => update("stock", String(e.target.checked))}
            />
            In stock only
          </label>
          <button className="text-link" onClick={() => setParams({})}>
            Reset filters
          </button>
          <p className="fine-print">
            Everyday essentials crafted with intention.
          </p>
        </aside>
        <div>
          <p className="results-count" aria-live="polite">
            {filtered.length}{" "}
            {filtered.length === 1 ? "essential" : "essentials"}
          </p>
          {filtered.length ? (
            <div className="product-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Search size={35} />
              <h2>A fresh start?</h2>
              <p>We couldn’t find an essential matching those filters.</p>
              <button className="button" onClick={() => setParams({})}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
