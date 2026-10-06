import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useStore } from "../store";
import { getProduct } from "../data/catalog";
import { business, money } from "../config/business";
import { totals } from "../lib/commerce";
import { Modal, Quantity, WhatsAppLink } from "./ui";

export function CartLines() {
  const { cart, update } = useStore();
  return (
    <div className="cart-lines">
      {cart.map((line) => {
        const p = getProduct(line.productId)!;
        const v = p.variants.find((v) => v.id === line.variantId)!;
        return (
          <article className="cart-line" key={`${p.id}-${v.id}`}>
            <Link to={`/product/${p.slug}`}>
              <img src={v.image} alt={`${p.name}, ${v.name}`} />
            </Link>
            <div>
              <Link to={`/product/${p.slug}`} className="line-title">
                {p.name}
              </Link>
              <p>{v.name}</p>
              <Quantity
                value={line.quantity}
                max={v.stock}
                label={`${v.name} quantity`}
                onChange={(q) => update(p.id, v.id, q)}
              />
            </div>
            <div className="line-end">
              <strong>{money(p.price * line.quantity)}</strong>
              <button
                className="icon-button"
                aria-label={`Remove ${v.name}`}
                onClick={() => update(p.id, v.id, 0)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
export function OrderSummary({
  discountInput = false,
}: {
  discountInput?: boolean;
}) {
  const { cart } = useStore();
  const sums = totals(cart);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  return (
    <div className="order-summary">
      <h2>Your ritual, wrapped up.</h2>
      <div className="summary-row">
        <span>Subtotal</span>
        <span>{money(sums.subtotal)}</span>
      </div>
      <div className="summary-row">
        <span>Estimated delivery</span>
        <span>{sums.shipping ? money(sums.shipping) : "Complimentary"}</span>
      </div>
      {sums.discount > 0 && (
        <div className="summary-row">
          <span>Discount</span>
          <span>−{money(sums.discount)}</span>
        </div>
      )}
      {discountInput && (
        <form
          className="discount"
          onSubmit={(e) => {
            e.preventDefault();
            setError("No discount codes are active in this preview.");
          }}
        >
          <label className="sr-only" htmlFor="discount">
            Discount code
          </label>
          <div>
            <input
              id="discount"
              placeholder="Discount code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button type="submit">Apply</button>
          </div>
          {error && <p role="status">{error}</p>}
        </form>
      )}
      <div className="summary-row summary-total">
        <span>Estimated total</span>
        <strong>{money(sums.total)}</strong>
      </div>
      <p className="fine-print">
        Preview prices and delivery estimates. Final prices, stock and delivery
        terms await confirmation.
      </p>
    </div>
  );
}
export function CartDrawer() {
  const { drawer, setDrawer, cart } = useStore();
  if (!drawer) return null;
  const count = cart.reduce((n, l) => n + l.quantity, 0);
  return (
    <Modal
      title={`Your bag (${count})`}
      className="cart-drawer"
      onClose={() => setDrawer(false)}
    >
      {cart.length ? (
        <>
          <div className="delivery-progress">
            <p>
              {Math.max(
                0,
                business.shipping.freeAbove - totals(cart).subtotal,
              ) > 0
                ? `${money(business.shipping.freeAbove - totals(cart).subtotal)} away from complimentary delivery`
                : "A little extra care. Complimentary delivery."}
            </p>
            <progress
              max={business.shipping.freeAbove}
              value={totals(cart).subtotal}
              aria-label="Estimated free delivery progress"
            />
            <small>Illustrative delivery offer</small>
          </div>
          <div
            className="drawer-lines"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setDrawer(false);
            }}
          >
            <CartLines />
          </div>
          <div className="drawer-bottom">
            <OrderSummary />
            <Link
              to="/checkout"
              className="button full"
              onClick={() => setDrawer(false)}
            >
              Continue to checkout
              <ArrowRight size={18} />
            </Link>
            <Link
              className="center-link"
              to="/cart"
              onClick={() => setDrawer(false)}
            >
              View your bag
            </Link>
          </div>
        </>
      ) : (
        <div className="empty">
          <ShoppingBag size={42} strokeWidth={1} />
          <h3>A little room for self-care.</h3>
          <p>Your next everyday favourite is waiting.</p>
          <Link to="/shop" className="button" onClick={() => setDrawer(false)}>
            Explore the essentials
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </Modal>
  );
}
export function CartPage() {
  const { cart } = useStore();
  return (
    <section className="container page-space">
      <div className="page-heading">
        <p className="eyebrow">A MOMENT FOR YOU</p>
        <h1>Your bag.</h1>
      </div>
      {cart.length ? (
        <div className="commerce-layout">
          <div>
            <CartLines />
            <Link className="text-link" to="/shop">
              Continue exploring
              <ArrowRight size={16} />
            </Link>
          </div>
          <aside className="summary-panel">
            <OrderSummary discountInput />
            <Link to="/checkout" className="button full">
              Continue to checkout
              <ArrowRight size={16} />
            </Link>
            <WhatsAppLink>Need a hand?</WhatsAppLink>
          </aside>
        </div>
      ) : (
        <div className="empty">
          <ShoppingBag size={40} />
          <h2>Your ritual starts here.</h2>
          <p>There’s nothing in your bag just yet.</p>
          <Link to="/shop" className="button">
            Shop the essentials
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}
