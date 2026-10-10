import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  CreditCard,
  Truck,
  AlertCircle,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "../store";
import { useAuth } from "../contexts/AuthContext";
import { money } from "../config/business";

import { useCatalog, useSettings } from "../contexts/SiteContext";
import { Empty, Eyebrow, WhatsAppLink } from "../components/ui";
import { OrderSummary } from "../components/Cart";
import type { Customer } from "../types";

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
  const { user, profile, admin, loading: authLoading } = useAuth();
  const { cart, clear, sums } = useStore();
  const { getProduct } = useCatalog();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<
    "cod" | "manual_online_payment"
  >("cod");
  const [different, setDifferent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const busy = useRef(false);
  const orderId = useRef(newOrderId());
  const business = useSettings();

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current || !user) return;
    setError("");

    const form = new FormData(e.currentTarget);
    const customer: Customer = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      whatsapp: different
        ? String(form.get("whatsapp") || "").trim()
        : String(form.get("phone") || "").trim(),
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
      setError(
        "Please enter a valid Pakistani mobile number, for example 0300 1234567.",
      );
      return;
    }

    if (different) {
      const cleanWa = customer.whatsapp.replace(/[\s()-]/g, "");
      if (!/^(?:\+92|0092|0)?3\d{9}$/.test(cleanWa)) {
        setError("Please enter a valid WhatsApp mobile number.");
        return;
      }
    }

    if (
      !customer.name ||
      !customer.address ||
      !customer.area ||
      !customer.city ||
      !customer.province
    ) {
      setError("Please complete all required delivery details.");
      return;
    }

    customer.phone = cleanPhone;
    customer.whatsapp = customer.whatsapp.replace(/[\s()-]/g, "");
    busy.current = true;
    setSubmitting(true);
    const generatedId = orderId.current;

    try {
      {
        // Prepare SKUs mapping for Firestore order creation
        const skus: Record<string, string> = {};
        cart.forEach((line) => {
          const prod = getProduct(line.productId);
          const variant = prod?.variants.find((v) => v.id === line.variantId);
          skus[`${line.productId}:${line.variantId}`] =
            variant?.sku || line.variantId;
        });

        await createOrder({
          id: generatedId,
          cart,
          customer,
          paymentMethod,
          skus,
        });
      }

      clear();
      navigate(`/order-success/${generatedId}`, { replace: true });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "We couldn’t process your order. Please try again.";
      setError(message);
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }

  if (authLoading)
    return (
      <div className="empty" role="status">
        Restoring your session?
      </div>
    );
  if (admin) return <Navigate to="/admin" replace />;
  if (!user) return <Navigate to="/login?next=%2Fcheckout" replace />;
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
              <Field
                label="Full name"
                name="name"
                autoComplete="name"
                defaultValue={profile?.displayName || user.displayName || ""}
              />
              <Field
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={user.email || ""}
              />
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
            <Field
              label="Street address"
              name="address"
              autoComplete="address-line1"
            />
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

            <label
              className={`payment-option ${paymentMethod === "cod" ? "active" : ""}`}
            >
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

            <label
              className={`payment-option ${paymentMethod === "manual_online_payment" ? "active" : ""}`}
            >
              <input
                type="radio"
                name="payment"
                value="manual_online_payment"
                disabled={!business.bank.enabled}
                checked={paymentMethod === "manual_online_payment"}
                onChange={() => setPaymentMethod("manual_online_payment")}
              />
              <CreditCard size={22} />
              <span>
                <strong>
                  Manual Online Payment (Bank Transfer / Easypaisa / JazzCash)
                </strong>
                <small>
                  Transfer directly to store account & confirm via WhatsApp.
                </small>
              </span>
            </label>

            {paymentMethod === "manual_online_payment" && (
              <div className="bank-panel">
                <h3>
                  <Building2 size={18} /> Bank transfer details
                </h3>
                <p>{business.bank.name}</p>
                <p>Account title: {business.bank.accountTitle}</p>
                <p>Account number: {business.bank.accountNumber}</p>
                <p>{business.bank.instructions}</p>
                <p>Order amount: {money(sums.total)}</p>
                <p>
                  Place your order first, then send your payment screenshot on
                  WhatsApp with your order number.
                </p>
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
            const p = getProduct(l.productId);
            const v = p?.variants.find((v) => v.id === l.variantId);
            if (!p || !v) return null;
            return (
              <div
                className="checkout-line"
                key={`${l.productId}-${l.variantId}`}
              >
                <img src={v?.image || p?.images[0]} alt={p?.name} />
                <div>
                  <strong>{p?.name || l.productId}</strong>
                  <span>
                    {v?.name || l.variantId} · Qty {l.quantity}
                  </span>
                </div>
                <span>{money((v.priceOverride ?? p.price) * l.quantity)}</span>
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
