import { useState } from "react";
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
import { getProduct, faqs } from "../data/catalog";
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
export default function ProductPage() {
  const { slug = "bye-bye-makeup" } = useParams();
  const p = getProduct(slug);
  const [params, setParams] = useSearchParams();
  const initialVariant =
    p?.variants.find((v) => v.id === params.get("colour")) || p?.variants[0];
  const [selected, setSelected] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(false);
  const { add } = useStore();
  const navigate = useNavigate();
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
              <img
                src={currentImage}
                alt={`${p.name} — ${currentImage.includes("care") ? "packaging care instructions" : currentImage.includes("white") ? "Soft White" : "Blush Pink"}`}
              />
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
            <h1>
              {p.name}
              <span>Clean Sponge</span>
            </h1>
            <p className="product-subtitle">{p.subtitle}</p>
            <a className="review-link" href="#reviews">
              A new favourite in the making · No reviews yet
            </a>
            <div className="product-price">
              <strong>{money(p.price)}</strong>
              {p.compareAt && p.compareAt > p.price && (
                <>
                  <del>{money(p.compareAt)}</del>
                  <span>
                    Save {Math.round((1 - p.price / p.compareAt) * 100)}%
                  </span>
                </>
              )}
            </div>
            <p className="fine-print">
              Preview pricing · final price and stock to be confirmed.
            </p>
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
              <span className={v.stock ? "stock-dot" : "stock-dot sold"} />
              {v.stock ? "Available in this preview" : "Currently out of stock"}
              <span className="sku">{v.sku}</span>
            </p>
            <div className="product-purchase">
              <Quantity value={quantity} max={v.stock} onChange={setQuantity} />
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
                    "Saturate with warm water. Gently sweep in circular motions. Hold briefly on heavier eye makeup before wiping. Rinse with soap, then hang to dry.",
                },
                { question: "Care for your essential", answer: p.care },
                {
                  question: "Delivery & returns",
                  answer:
                    "Delivery and return policies are being finalised before launch. Checkout delivery costs are estimates. Reach out on WhatsApp for help.",
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
      <Reviews reviews={p.reviews} />
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
          <strong>{money(p.price)}</strong>
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
