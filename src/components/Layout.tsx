import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Instagram,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  MessageCircle,
  Check,
  Package,
} from "lucide-react";
import { OrderTrackerModal } from "./OrderTracker";
import { Brand, Modal, Eyebrow } from "./ui";
import { CartDrawer } from "./Cart";
import { useStore } from "../store";
import { useAuth } from "../contexts/AuthContext";
import { business, whatsappUrl } from "../config/business";
import { products } from "../data/catalog";
const nav = [
  ["/shop", "Shop"],
  ["/how-it-works", "The ritual"],
  ["/about", "Our story"],
];
export function Layout({ children }: { children: React.ReactNode }) {
  const { admin } = useAuth();
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [query, setQuery] = useState("");
  const { cart, setDrawer, message } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setMobile(false);
    setSearch(false);
    setDrawer(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, setDrawer]);
  const count = cart.reduce((n, l) => n + l.quantity, 0);
  const orderId =
    location.pathname.startsWith("/order-success/") ||
    location.pathname.startsWith("/account/orders/")
      ? location.pathname.split("/").at(-1)
      : null;
  const helpMessage = orderId
    ? `Hi Glam Skincare! I need help regarding order #${orderId}.`
    : location.pathname.startsWith("/product/")
      ? "Hi Glam Skincare! I have a question about Bye-Bye Makeup."
      : undefined;
  if (location.pathname.startsWith("/admin")) {
    return <main id="main">{children}</main>;
  }

  return (
    <>
      <div id="site-content">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="announcement">
          A little water. A little care. A whole new ritual.
          <span>
            Made for your everyday glow <span aria-hidden="true">✧</span>
          </span>
        </div>
        <header className="site-header">
          <div className="header-inner">
            <button
              className="icon-button mobile-toggle"
              aria-label="Open menu"
              onClick={() => setMobile(true)}
            >
              <Menu size={23} />
            </button>
            <nav className="desktop-nav" aria-label="Main navigation">
              {nav.map(([to, label]) => (
                <NavLink key={to} to={to}>
                  {label}
                </NavLink>
              ))}
            </nav>
            <Link to="/" className="brand-link" aria-label="Glam Skincare home">
              <Brand />
            </Link>
            <div className="header-actions">
              <button
                className="icon-button"
                aria-label="Track your order"
                title="Track your order"
                onClick={() => setShowTracker(true)}
              >
                <Package size={21} />
              </button>
              <button
                className="icon-button"
                aria-label="Search products"
                onClick={() => setSearch(true)}
              >
                <Search size={21} />
              </button>
              <Link
                className="icon-button account-icon"
                to={admin ? "/admin" : "/account"}
                aria-label={admin ? "Admin portal" : "My account"}
                title={admin ? "Admin portal" : "My account"}
              >
                <UserRound size={21} />
              </Link>
              <button
                className="icon-button bag-button"
                aria-label={`Open bag, ${count} items`}
                onClick={() => setDrawer(true)}
              >
                <ShoppingBag size={21} />
                <span>{count}</span>
              </button>
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <Newsletter />
        <Footer />
        <a
          href={whatsappUrl(helpMessage)}
          className={`floating-whatsapp ${location.pathname.startsWith("/product/") ? "above-purchase" : ""}`}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with Glam Skincare on WhatsApp"
        >
          <MessageCircle size={23} />
          <span>Here to help</span>
        </a>
      </div>
      {showTracker && <OrderTrackerModal onClose={() => setShowTracker(false)} />}
      {mobile && (
        <Modal
          title="Make yourself at home."
          onClose={() => setMobile(false)}
          className="mobile-menu"
        >
          <Link to="/" onClick={() => setMobile(false)}>
            <Brand />
          </Link>
          <nav aria-label="Mobile navigation">
            {[
              ["/", "Home"],
              ...nav,
              ["/faq", "Your questions"],
              ["/contact", "Get in touch"],
              ["/account", "My account"],
              ["/account/orders", "My orders"],
            ].map(([to, label]) => (
              <Link to={to} key={to} onClick={() => setMobile(false)}>
                {label}
                <ArrowUpRight size={19} />
              </Link>
            ))}
          </nav>
          <p>Glow. Care. Confidence.</p>
        </Modal>
      )}
      {search && (
        <Modal
          title="Find your next favourite."
          onClose={() => setSearch(false)}
          className="search-modal"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(false);
              navigate(`/shop?q=${encodeURIComponent(query)}`);
            }}
            className="search-field"
          >
            <Search size={21} />
            <input
              aria-label="Search the collection"
              placeholder="Search the collection…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="icon-button" aria-label="Submit search">
              <ArrowRight size={20} />
            </button>
          </form>
          <Eyebrow>{query ? "SEARCH RESULTS" : "MEET YOUR ESSENTIAL"}</Eyebrow>
          {products
            .filter((p) =>
              `${p.name} ${p.subtitle}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((p) => (
              <Link
                className="search-result"
                key={p.id}
                to={`/product/${p.slug}`}
                onClick={() => setSearch(false)}
              >
                <img src={p.images[0]} alt={p.name} />
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.subtitle}</p>
                </div>
                <ArrowUpRight size={20} />
              </Link>
            ))}
          {!products.some((p) =>
            `${p.name} ${p.subtitle}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ) && <p>No matches yet. Try “makeup” or “pad”.</p>}
        </Modal>
      )}
      <CartDrawer />
      <div
        className={`toast ${message ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message && (
          <>
            <Check size={18} />
            {message}
          </>
        )}
      </div>
    </>
  );
}
function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <section className="newsletter">
      <div className="container newsletter-inner">
        <div>
          <Eyebrow>A LITTLE GLAM IN YOUR INBOX</Eyebrow>
          <h2>
            Good things. <em>Gently delivered.</em>
          </h2>
          <p>New rituals, thoughtful tips, and first looks.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <label className="sr-only" htmlFor="newsletter-email">
            Your email address
          </label>
          <div className="newsletter-input">
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="Your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSubmitted(false);
              }}
            />
            <button aria-label="Join the newsletter" type="submit">
              <ArrowRight size={23} />
            </button>
          </div>
          <p className="fine-print" role="status">
            {submitted
              ? "Thanks for your interest! Subscriptions open at launch; your email has not been stored."
              : "A little care, never clutter. Newsletter sign-ups open at launch."}
          </p>
        </form>
      </div>
    </section>
  );
}
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link to="/" aria-label="Glam Skincare home">
            <Brand />
          </Link>
          <p>
            Thoughtfully simple essentials.
            <br />
            For your skin. For your everyday.
          </p>
          <a
            href={`https://www.instagram.com/${business.instagram}/`}
            target="_blank"
            rel="noreferrer"
            className="text-link"
          >
            <Instagram size={18} />@{business.instagram}
          </a>
        </div>
        <div>
          <h3>Find your glow</h3>
          <Link to="/shop">Shop all</Link>
          <Link to="/product/bye-bye-makeup">Bye-Bye Makeup</Link>
          <Link to="/how-it-works">The ritual</Link>
          <Link to="/about">Our story</Link>
        </div>
        <div>
          <h3>A little help</h3>
          <Link to="/faq">FAQs</Link>
          <Link to="/contact">Contact us</Link>
          <Link to="/shipping">Shipping & returns</Link>
          <Link to="/account/orders">My orders</Link>
        </div>
        <div>
          <h3>Let’s stay close</h3>
          <p>
            Questions about your ritual?
            <br />
            We’re a message away.
          </p>
          <a
            className="text-link"
            href={whatsappUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp
            <ArrowUpRight size={16} />
          </a>
          <span className="footer-tagline">Glow. Care. Confidence.</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Glam Skincare. All rights reserved.
        </span>
        <div>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <span>PAKISTAN · PKR</span>
        </div>
      </div>
    </footer>
  );
}
