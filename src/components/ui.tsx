import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Minus,
  Plus,
  X,
  MessageCircle,
  Droplets,
  Leaf,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { whatsappUrl, money } from "../config/business";
import { steps } from "../data/catalog";
import type { Product } from "../types";
import { useStore } from "../store";

export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -30px 0px" }}
      transition={{ duration: reduced ? 0 : 0.55 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
export function Brand() {
  return (
    <span className="brand logo logo-text">
      <span>
        glam<span className="brand-dot">.</span>
      </span>
      <small>SKINCARE</small>
    </span>
  );
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}
export function WhatsAppLink({
  children = "Let’s chat on WhatsApp",
  message,
  className = "text-link",
}: {
  children?: ReactNode;
  message?: string;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={whatsappUrl(message)}
      target="_blank"
      rel="noreferrer"
    >
      <MessageCircle size={18} />
      {children}
      <ArrowUpRight size={16} />
    </a>
  );
}
export function Quantity({
  value,
  max = 20,
  onChange,
  label = "Quantity",
}: {
  value: number;
  max?: number;
  onChange: (n: number) => void;
  label?: string;
}) {
  return (
    <div className="quantity" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={14} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
export function Modal({
  children,
  title,
  onClose,
  className = "",
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const root = document.getElementById("site-content");
    root?.setAttribute("inert", "");
    const el = ref.current!;
    const focusable = () =>
      Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]',
        ),
      ).filter((n) => n.getClientRects().length > 0);
    (focusable()[0] || el).focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (!first) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      root?.removeAttribute("inert");
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: 25 }}
        animate={{ opacity: 1, x: 0 }}
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        tabIndex={-1}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        {children}
      </motion.div>
    </div>,
    document.body,
  );
}
export function Accordion({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  return (
    <div className="accordion">
      {items.map((item) => (
        <details key={item.question}>
          <summary>
            {item.question}
            <Plus size={17} />
          </summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
export function RitualSteps() {
  const icons = [Droplets, Sparkles, RefreshCw, Leaf];
  return (
    <div className="steps-grid">
      {steps.map((step, index) => {
        const Icon = icons[index];
        return (
          <Reveal className="step" key={step.title}>
            <div className="step-top">
              <span>0{index + 1}</span>
              <Icon size={26} strokeWidth={1.25} />
            </div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </Reveal>
        );
      })}
    </div>
  );
}
export function ProductCard({ product }: { product: Product }) {
  const { add } = useStore();
  return (
    <article className="product-card">
      <Link to={`/product/${product.slug}`} className="product-card-photo">
        <img
          src={product.images[0]}
          alt={`${product.name} in Blush Pink beside a vase`}
          loading="lazy"
        />
        <span className="photo-tag">THE EVERYDAY ESSENTIAL</span>
        <span className="round-arrow">
          <ArrowUpRight size={22} />
        </span>
      </Link>
      <div className="card-title">
        <Link to={`/product/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        <span>{money(product.price)}</span>
      </div>
      <p>{product.subtitle}</p>
      <div className="card-bottom">
        <div className="swatches">
          {product.variants.map((v) => (
            <Link
              aria-label={`Shop ${v.name}`}
              key={v.id}
              to={`/product/${product.slug}?colour=${v.id}`}
              style={{ backgroundColor: v.color }}
            />
          ))}
        </div>
        <button
          className="text-link"
          disabled={!product.variants[0].stock}
          onClick={() => add(product.id, product.variants[0].id)}
        >
          {product.variants[0].stock ? "Quick add" : "Sold out"}
          <Plus size={15} />
        </button>
      </div>
    </article>
  );
}
export function Empty({
  title,
  text,
  action = "Discover your ritual",
  to = "/shop",
}: {
  title: string;
  text: string;
  action?: string;
  to?: string;
}) {
  return (
    <div className="empty">
      <Sparkles size={40} strokeWidth={1} />
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="button" to={to}>
        {action}
        <ArrowUpRight size={17} />
      </Link>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
