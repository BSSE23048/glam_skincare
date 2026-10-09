import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  CreditCard,
  ShieldCheck,
  Truck,
  PackageCheck,
  Copy,
  MessageCircle,
  AlertCircle,
  Building2,
  Wallet,
} from "lucide-react";
import { useStore } from "../store";
import { useAuth } from "../contexts/AuthContext";
import { business, money, whatsappMessages, buildWhatsAppUrl } from "../config/business";
import { totals } from "../lib/commerce";
import { useCatalog, useSettings } from "../contexts/SiteContext";
import { Empty, Eyebrow, WhatsAppLink } from "../components/ui";
import { OrderSummary } from "../components/Cart";
import type { Customer, Order } from "../types";
import { firebase } from "../services/firebase";
import { createOrder, newOrderId } from "../services/orders";

const provinces = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Azad Jammu and Kashmir",
  "Gilgit-Baltistan",
];

function Field({
  label,
  name,
  type = "text",
  required = true,
  autoComplete,
  placeholder,
  pattern,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  pattern?: string;
  defaultValue?: string;
}) {
  return (
    <label className="field">
      {label}
      {!required && <span className="optional"> (optional)</span>}
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        pattern={pattern}
        maxLength={300}
        defaultValue={defaultValue}
      />
    </label>
  );
}

export default function Checkout() {
  const { user, admin, loading: authLoading } = useAuth();
  const { cart, clear, saveOrder } = useStore();
  const { getProduct } = useCatalog();
  const navigate = useNavigate();

  if (!authLoading && user && admin) {
    return <Navigate to="/admin" replace />;
  }
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "manual_online_payment">("cod");
  const [selectedOnlineOption, setSelectedOnlineOption] = useState<string>("bank_transfer");
  const [different, setDifferent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setError("");

    const form = new FormData(e.currentTarget);
    const customer: Customer = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      whatsapp: different ? String(form.get("whatsapp") || "").trim() : String(form.get("phone") || "").trim(),
      address: String(form.get("address") || "").trim(),
      apartment: String(form.get("apartment") || "").trim(),
      area: String(form.get("area") || "").trim(),
      city: String(form.get("city") || "").trim(),
      province: String(form.get("province") || "").trim(),
      postalCode: String(form.get("postalCode") || "").trim(),
      instructions: String(form.get("instructions") || "").trim(),
    };

    const cleanPhone = customer.phone.replace(/[\s()-]/g, "");
    if (!/^(?:\+92|0092|0)?3\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid Pakistani mobile number, for example 0300 1234567.");
      return;
    }

    if (different) {
      const cleanWa = customer.whatsapp.replace(/[\s()-]/g, "");
      if (!/^(?:\+92|0092|0)?3\d{9}$/.test(cleanWa)) {
        setError("Please enter a valid WhatsApp mobile number.");
        return;
      }
    }

    if (!customer.name || !customer.address || !customer.area || !customer.city || !customer.province) {
      setError("Please complete all required delivery details.");
      return;
    }

    setSubmitting(true);
    const generatedId = newOrderId();
    const orderTotals = totals(cart);

    try {
      if (firebase?.auth.currentUser) {
        // Prepare SKUs mapping for Firestore order creation
        const skus: Record<string, string> = {};
        cart.forEach((line) => {
          const prod = getProduct(line.productId);
          const variant = prod?.variants.find((v) => v.id === line.variantId);
          skus[`${line.productId}:${line.variantId}`] = variant?.sku || line.variantId;
        });

        await createOrder({
          id: generatedId,
          cart,
          customer,
          paymentMethod,
          skus,
        });
      }

      // Save local store representation as well (for instant fallback display)
      const order: Order = {
        id: generatedId,
        createdAt: new Date().toISOString(),
        items: cart.map((l) => ({ ...l })),
        subtotal: orderTotals.subtotal,
        shipping: orderTotals.shipping,
        discount: orderTotals.discount,
        total: orderTotals.total,
        payment: paymentMethod,
        status: paymentMethod === "manual_online_payment" ? "payment_verification" : "pending",
        customer,
      };

      saveOrder(order);
      clear();
      navigate(`/order-success/${order.id}`, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "We couldn’t process your order. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart.length) {
    return (
      <Empty
        title="Let’s start with something soft."
        text="Add an essential to your bag before checking out."
      />
    );
  }

  return (
    <section className="container page-space checkout">
      <Link className="text-link" to="/cart">
        <ChevronLeft size={16} />
        Back to your bag
      </Link>

      <div className="page-heading">
        <Eyebrow>ONE STEP CLOSER TO YOUR NEW RITUAL</Eyebrow>
        <h1>
          A little care, <em>on its way.</em>
        </h1>
      </div>

      <form className="commerce-layout" onSubmit={submit}>
        <div className="checkout-form">
          <section className="form-section">
            <h2>
              <span>01</span>Your details
            </h2>
            <p>So we know who we’re caring for.</p>
            <div className="form-grid">
              <Field label="Full name" name="name" autoComplete="name" />
              <Field label="Email address" name="email" type="email" autoComplete="email" />
              <Field
                label="Mobile number"
                name="phone"
                type="tel"
                placeholder="0300 1234567"
                autoComplete="tel"
              />
              <div className="field country-field">
                Country<span>Pakistan</span>
              </div>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={different}
                onChange={(e) => setDifferent(e.target.checked)}
              />
              My WhatsApp number is different
            </label>
            {different && (
              <Field
                label="WhatsApp number"
                name="whatsapp"
                type="tel"
                placeholder="0300 1234567"
              />
            )}
          </section>

          <section className="form-section">
            <h2>
              <span>02</span>Somewhere to send a little care
            </h2>
            <p>Your delivery address in Pakistan.</p>
            <Field label="Street address" name="address" autoComplete="address-line1" />
            <div className="form-grid">
              <Field
                label="House / apartment"
                name="apartment"
                required={false}
                autoComplete="address-line2"
              />
              <Field label="Area / neighbourhood" name="area" />
              <Field label="City" name="city" autoComplete="address-level2" />
              <label className="field">
                Province / territory
                <select
                  name="province"
                  required
                  defaultValue=""
                  autoComplete="address-level1"
                >
                  <option value="" disabled>
                    Select your province
                  </option>
                  {provinces.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <Field
                label="Postal code"
                name="postalCode"
                required={false}
                autoComplete="postal-code"
                pattern="[0-9]{5}"
              />
            </div>
            <label className="field">
              Delivery instructions <span className="optional">(optional)</span>
              <textarea
                name="instructions"
                rows={3}
                maxLength={600}
                placeholder="Anything that helps us find you?"
              />
            </label>
          </section>

          <section className="form-section">
            <h2>
              <span>03</span>Your preferred way to pay
            </h2>

            <label className={`payment-option ${paymentMethod === "cod" ? "active" : ""}`}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              <Truck size={22} />
              <span>
                <strong>Cash on delivery</strong>
                <small>Pay in cash when your parcel is delivered.</small>
              </span>
            </label>

            <label className={`payment-option ${paymentMethod === "manual_online_payment" ? "active" : ""}`}>
              <input
                type="radio"
                name="payment"
                value="manual_online_payment"
                checked={paymentMethod === "manual_online_payment"}
                onChange={() => setPaymentMethod("manual_online_payment")}
              />
              <CreditCard size={22} />
              <span>
                <strong>Manual Online Payment (Bank Transfer / Easypaisa / JazzCash)</strong>
                <small>Transfer directly to store account & confirm via WhatsApp.</small>
              </span>
            </label>

            {paymentMethod === "manual_online_payment" && (
              <div className="bank-panel">
                <h3>Select Payment Method</h3>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {business.paymentMethods.map((pm) => (
                    <button
                      key={pm.id}
                      type="button"
                      className={`button small ${selectedOnlineOption === pm.id ? '' : 'secondary'}`}
                      onClick={() => setSelectedOnlineOption(pm.id)}
                    >
                      {pm.id === 'bank_transfer' ? <Building2 size={16} /> : <Wallet size={16} />}
                      {pm.name}
                    </button>
                  ))}
                </div>

                {(() => {
                  const currentMethod = business.paymentMethods.find(m => m.id === selectedOnlineOption) || business.paymentMethods[0];
                  return (
                    <div style={{ background: '#FAF8F5', padding: '1rem', borderRadius: '8px', border: '1px solid #EFEAE3' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{currentMethod.name} Details:</p>
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem', fontSize: '0.925rem', lineHeight: '1.6' }}>
                        {currentMethod.bankName && <li><strong>Bank / Wallet:</strong> {currentMethod.bankName}</li>}
                        <li><strong>Account Title:</strong> {currentMethod.accountTitle}</li>
                        <li><strong>Account Number:</strong> {currentMethod.accountNumber}</li>
                        {currentMethod.iban && <li><strong>IBAN:</strong> {currentMethod.iban}</li>}
                        <li><strong>Order Amount:</strong> {money(totals(cart).total)}</li>
                      </ul>
                      <p className="fine-print" style={{ marginTop: '0.75rem' }}>
                        <strong>Instructions:</strong> After completing your transfer, place your order and send your payment screenshot directly to Glam Skincare on WhatsApp with your Order Number.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </section>

          {error && (
            <div className="form-error" role="alert">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button type="submit" className="button full" disabled={submitting}>
            {submitting ? "Placing your order…" : "Complete order"}
            <ArrowRight size={18} />
          </button>
        </div>

        <aside className="summary-panel checkout-summary">
          <h2>In your bag</h2>
          {cart.map((l) => {
            const p = getProduct(l.productId)!;
            const v = p?.variants.find((v) => v.id === l.variantId)!;
            return (
              <div className="checkout-line" key={`${l.productId}-${l.variantId}`}>
                <img src={v?.image || p?.images[0]} alt={p?.name} />
                <div>
                  <strong>{p?.name || l.productId}</strong>
                  <span>
                    {v?.name || l.variantId} · Qty {l.quantity}
                  </span>
                </div>
                <span>{money((p?.price || 0) * l.quantity)}</span>
              </div>
            );
          })}
          <OrderSummary />
          <div className="checkout-help">
            <ShieldCheck size={24} />
            <p>
              A question along the way?
              <br />
              We’re happy to help.
            </p>
            <WhatsAppLink>Chat with us</WhatsAppLink>
          </div>
        </aside>
      </form>
    </section>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { orders } = useStore();
  const { getProduct } = useCatalog();
  const settings = useSettings();
  const [copied, setCopied] = useState(false);
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <Empty
        title="We can’t find this order."
        text="Orders are saved in your account and available in your order history."
        to="/account/orders"
        action="View my orders"
      />
    );
  }

  const isManual = order.payment === "manual_online_payment";
  const customerName = order.customer?.name || "Valued Customer";
  const whatsappVerificationText = whatsappMessages.paymentVerification(
    order.id,
    money(order.total),
    customerName
  );
  const whatsappUrl = buildWhatsAppUrl(whatsappVerificationText, settings.whatsapp || business.whatsapp);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section className="container page-space order-detail">
      <div className="success-icon">
        <Check size={35} />
      </div>
      <Eyebrow>ORDER PLACED SUCCESSFULLY</Eyebrow>
      <h1>
        Looking forward to
        <br />
        <em>your softer everyday.</em>
      </h1>
      <p>
        Thank you for choosing Glam Skincare! Once your payment is verified, your order will be confirmed and processed for delivery.
      </p>

      <div className="order-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ORDER NUMBER</span>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {order.id}
              <button
                type="button"
                className="icon-button"
                onClick={copyOrderNumber}
                title="Copy order number"
                style={{ padding: '0.25rem' }}
              >
                {copied ? <Check size={18} color="#2e7d32" /> : <Copy size={18} />}
              </button>
            </h2>
          </div>
          <PackageCheck size={30} />
        </div>

        <p>
          Placed on: {" "}
          {new Date(order.createdAt).toLocaleDateString("en-PK", {
            dateStyle: "long",
          })}
        </p>

        <div style={{ margin: '1rem 0' }}>
          <span className={`quiet-badge ${isManual ? 'warning' : 'success'}`}>
            Payment Status: {isManual ? "Awaiting Payment Verification" : "Cash on Delivery (Pending)"}
          </span>
        </div>

        {isManual && (
          <div className="payment-verification-box" style={{ background: '#FFFDF9', border: '1.5px dashed #E0C097', padding: '1.25rem', borderRadius: '10px', margin: '1.25rem 0' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#8A5A2B' }}>
              Send Screenshot on WhatsApp
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1rem 0', color: '#4A4A4A' }}>
              Please complete your payment using your selected payment method (Bank Transfer / Easypaisa / JazzCash) and send your payment screenshot to <strong>Glam Skincare</strong> on WhatsApp for verification.
              <br />
              <em>Please include your Order Number <strong>#{order.id}</strong> in the message.</em>
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="button full"
              style={{ background: '#25D366', color: '#ffffff', borderColor: '#25D366', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <MessageCircle size={20} />
              SEND PAYMENT SCREENSHOT ON WHATSAPP
            </a>
          </div>
        )}

        <div className="order-items-summary" style={{ marginTop: '1rem' }}>
          <h4>Order Items</h4>
          {order.items.map((l) => {
            const p = getProduct(l.productId);
            const v = p?.variants.find((v) => v.id === l.variantId);
            return (
              <div className="summary-row" key={`${l.productId}-${l.variantId}`}>
                <span>
                  {p?.name || l.productId} · {v?.name || l.variantId}
                </span>
                <span>Qty {l.quantity}</span>
              </div>
            );
          })}
        </div>

        <div className="summary-row" style={{ marginTop: '0.75rem' }}>
          <span>Estimated delivery</span>
          <span>{business.shipping.estimatedDays}</span>
        </div>

        <div className="summary-row summary-total" style={{ borderTop: '1px solid #EFEAE3', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
          <span>Order Total</span>
          <strong>{money(order.total)}</strong>
        </div>

        {order.customer && (
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
            <strong>Shipping Address:</strong> {order.customer.name}, {order.customer.address}, {order.customer.area}, {order.customer.city}, {order.customer.province} ({order.customer.phone})
          </div>
        )}
      </div>

      <Link to="/shop" className="button">
        Back to the essentials
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}
