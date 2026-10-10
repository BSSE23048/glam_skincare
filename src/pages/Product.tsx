import { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Droplets,
  Heart,
  RefreshCw,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCatalog, useSettings } from "../contexts/SiteContext";
import { faqs } from "../data/catalog";
import {
  Accordion,
  Eyebrow,
  Modal,
  Quantity,
  WhatsAppLink,
  Empty,
} from "../components/ui";
import { money } from "../config/business";
import { useStore } from "../store";
import { Reviews } from "../components/Reviews";
import {
  RecentlyViewed,
  recordRecentlyViewed,
} from "../components/RecentlyViewed";
export default function ProductPage() {
  const settings = useSettings();
  const { slug = "bye-bye-makeup" } = useParams();
  const { getProduct, approvedReviews, loading, error } = useCatalog();
  const p = getProduct(slug);

  useEffect(() => {
    if (p?.id) {
      recordRecentlyViewed(p.id);
    }
  }, [p?.id]);

  const [params, setParams] = useSearchParams();
  const initialVariant =
    p?.variants.find((v) => v.id === params.get("colour")) || p?.variants[0];

  const [selected, setSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(false);
  const { add } = useStore();
  const navigate = useNavigate();

  if (loading)
    return (
      <div className="empty" role="status">
        Loading product?
      </div>
    );
  if (error)
    return (
      <div className="empty" role="alert">
        {error}
      </div>
    );
  if (!p || !initialVariant)
    return (
      <Empty
        title="This essential isn’t here."
        text="Let’s find your way back to the collection."
      />
    );

  const v = initialVariant;
  const currentImage =
    selected || (params.has("colour") ? v.image : p.images[0]);
  const index = Math.max(0, p.images.indexOf(currentImage));
  const cycle = (direction: number) =>
    setSelected(
      p.images[(index + direction + p.images.length) % p.images.length],
    );

  // Filter approved reviews for this product
  const productReviews = approvedReviews.filter((r) => r.productId === p.id);

  return (
    <>
      <section className="container product-page">
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">The collection</Link>
          <span>/</span>
          <span>{p.name}</span>
        </div>
        <div className="product-layout">
          <div className="product-gallery">
            <button
              className="gallery-main"
              onClick={() => setZoom(true)}
              aria-label="Zoom product image"
            >
              <img src={currentImage} alt={`${p.name} — ${v.name}`} />
              <span>
                <ZoomIn size={21} />
              </span>
            </button>
            <div className="gallery-thumbnails">
              {p.images.map((src, i) => (
                <button
                  key={src}
                  className={currentImage === src ? "selected" : ""}
                  onClick={() => setSelected(src)}
                  aria-label={`View product photo ${i + 1}`}
                  aria-pressed={currentImage === src}
                >
                  <img src={src} alt={`Product view ${i + 1}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="product-info">
            <Eyebrow>YOUR EVERYDAY, ONLY SOFTER</Eyebrow>
            <h1>{p.name}</h1>
            <p className="product-subtitle">{p.subtitle}</p>
            <a className="review-link" href="#reviews">
              {productReviews.length
                ? `${productReviews.length} verified review${productReviews.length === 1 ? "" : "s"}`
                : "A new favourite in the making"}
            </a>
            <div className="product-price">
              <strong>{money(v.priceOverride ?? p.price)}</strong>
              {p.compareAt && p.compareAt > p.price && (
                <>
                  <del>{money(p.compareAt)}</del>
                  <span>
                    Save {Math.round((1 - p.price / p.compareAt) * 100)}%
                  </span>
                </>
              )}
            </div>
            <p className="product-description">{p.description}</p>
            <div className="variant-picker">
              <p>
                Colour — <strong>{v.name}</strong>
              </p>
              <div>
                {p.variants.map((variant) => (
                  <button
                    key={variant.id}
                    className={variant.id === v.id ? "chosen" : ""}
                    aria-label={variant.name}
                    aria-pressed={variant.id === v.id}
                    onClick={() => {
                      setParams({ colour: variant.id }, { replace: true });
                      setSelected(variant.image);
                      setQuantity(1);
                    }}
                  >
                    <span style={{ backgroundColor: variant.color }} />
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
            <p className="stock">
              <span className={v.stock > 0 ? "stock-dot" : "stock-dot sold"} />
              {v.stock > 0
                ? `In Stock (${v.stock} available)`
                : "Currently out of stock"}
              <span className="sku">{v.sku}</span>
            </p>
            <div className="product-purchase">
              <Quantity
                value={quantity}
                max={Math.min(10, v.stock)}
                onChange={setQuantity}
              />
              <button
                className="button"
                disabled={!v.stock}
                onClick={() => add(p.id, v.id, quantity)}
              >
                Add to bag
                <ArrowRight size={18} />
              </button>
            </div>
            <button
              className="button secondary full"
              disabled={!v.stock}
              onClick={() => {
                add(p.id, v.id, quantity, false);
                navigate("/checkout");
              }}
            >
              Buy now
              <ArrowUpRight size={18} />
            </button>
            <WhatsAppLink
              message={`Hi Glam Skincare! I have a question about ${p.name}.`}
            >
              A question before you glow?
            </WhatsAppLink>
            <div className="product-perks">
              <span>
                <Droplets size={20} />
                Just add water
              </span>
              <span>
                <Heart size={20} />
                Gentle touch
              </span>
              <span>
                <RefreshCw size={20} />
                Wash & reuse
              </span>
            </div>
            <Accordion
              items={[
                {
                  question: "The thoughtful details",
                  answer: `Material: ${p.material}. A reusable pad designed to pair with warm water in your makeup-removal routine.`,
                },
                {
                  question: "Your simple ritual",
                  answer:
                    (p as unknown as { usage?: string }).usage ||
                    "Saturate with warm water. Gently sweep in circular motions. Hold briefly on heavier eye makeup before wiping. Rinse with soap, then hang to dry.",
                },
                { question: "Care for your essential", answer: p.care },
                {
                  question: "Delivery & returns",
                  answer: `${settings.shipping.estimatedDays}. Free shipping from ${money(settings.shipping.freeAbove)}. ${settings.returnsPolicy}`,
                },
              ]}
            />
          </div>
        </div>
      </section>
      <section className="product-story">
        <div className="container">
          <Eyebrow>NOT ANOTHER COMPLICATED STEP</Eyebrow>
          <h2>
            Just a little water.
            <br />
            <em>And a little you-time.</em>
          </h2>
          <p>
            Take a breath. Let your day go. The best routines are the ones that
            feel like second nature.
          </p>
          <Link className="text-link" to="/how-it-works">
            Find your rhythm
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <section className="container section faq-preview">
        <div>
          <Eyebrow>GET TO KNOW YOUR PAD</Eyebrow>
          <h2>
            A little more <em>clarity.</em>
          </h2>
        </div>
        <Accordion items={faqs.slice(0, 4)} />
      </section>

      {productReviews.length > 0 && (
        <Reviews
          reviews={productReviews.map((r) => ({
            id: r.id,
            author: r.author || "Valued Customer",
            rating: r.rating,
            body: r.body,
            publishedAt: r.createdAt?.toDate?.().toISOString() || "",
            verifiedPurchase: r.verifiedPurchase,
          }))}
        />
      )}

      <section className="container pairing">
        <img
          src={
            v.id === "blush"
              ? "/images/white-ritual.jpeg"
              : "/images/pink-ritual.jpeg"
          }
          alt="The other shade of Bye-Bye Makeup"
          loading="lazy"
        />
        <div>
          <Eyebrow>SAME SOFTNESS. ANOTHER SHADE.</Eyebrow>
          <h2>
            A fresh one <em>in the rotation.</em>
          </h2>
          <p>Keep a clean, dry pad ready while the other is being washed.</p>
          <button
            className="text-link"
            onClick={() => {
              setParams({ colour: v.id === "blush" ? "ivory" : "blush" });
              setSelected(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Explore {v.id === "blush" ? "Soft White" : "Blush Pink"}
            <ArrowUpRight size={17} />
          </button>
        </div>
      </section>
      <div className="mobile-buy">
        <span>
          {p.name}
          <strong>{money(v.priceOverride ?? p.price)}</strong>
        </span>
        <button
          className="button"
          disabled={!v.stock}
          onClick={() => add(p.id, v.id, quantity)}
        >
          Add to bag
          <ArrowRight size={16} />
        </button>
      </div>
      <RecentlyViewed currentId={p.id} />
      {zoom && (
        <Modal
          title={`${p.name} — a closer look`}
          onClose={() => setZoom(false)}
          className="zoom-modal"
        >
          <img src={currentImage} alt="Enlarged product photograph" />
          <div className="zoom-controls">
            <button
              className="icon-button"
              aria-label="Previous image"
              onClick={() => cycle(-1)}
            >
              <ChevronLeft />
            </button>
            <span>
              {index + 1} / {p.images.length}
            </span>
            <button
              className="icon-button"
              aria-label="Next image"
              onClick={() => cycle(1)}
            >
              <ChevronRight />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
