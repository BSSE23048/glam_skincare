import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Check, Copy, MessageCircle, ArrowRight } from "lucide-react";
import { watchOrder } from "../services/orders";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SiteContext";
import { buildWhatsAppUrl, money, whatsappMessages } from "../config/business";
import { Empty, Eyebrow } from "../components/ui";
import { statusLabel } from "../domain/orders";
import type { ShopOrder } from "../domain/models";
export default function OrderDetail() {
  const { id = "" } = useParams();
  const { user, admin } = useAuth();
  const settings = useSettings();
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setOrder(null);
    setLoading(true);
    setError("");
    if (!user) {
      setLoading(false);
      return;
    }
    return watchOrder(
      id,
      (value) => {
        setOrder(value);
        setLoading(false);
      },
      () => {
        setError(
          "This order could not be loaded. It may not belong to this account.",
        );
        setLoading(false);
      },
    );
  }, [id, user]);
  if (admin) return <Navigate to="/admin/orders" replace />;
  if (loading)
    return (
      <div className="empty" role="status">
        Loading your order…
      </div>
    );
  if (error)
    return (
      <div className="empty" role="alert">
        <h1>Order unavailable.</h1>
        <p>{error}</p>
        <Link to="/account/orders" className="button">
          My orders
        </Link>
      </div>
    );
  if (!order)
    return (
      <Empty
        title="We can’t find this order."
        text="Check the reference in your order history."
        to="/account/orders"
        action="My orders"
      />
    );
  const manual = order.paymentMethod === "manual_online_payment";
  return (
    <section className="container page-space order-detail">
      <div className="success-icon">
        <Check />
      </div>
      <Eyebrow>YOUR ORDER</Eyebrow>
      <h1>Your softer everyday.</h1>
      <p>Your order has been saved. Track updates here and in your account.</p>
      <div className="order-card">
        <div className="section-heading">
          <h2>{order.orderNumber}</h2>
          <button
            className="text-link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(order.orderNumber);
                setCopied(true);
              } catch {
                setError(
                  "Copy is unavailable. You can select the order number above.",
                );
              }
            }}
          >
            <Copy size={15} />
            {copied ? "Copied" : "Copy order number"}
          </button>
        </div>
        <p>{order.createdAt?.toDate().toLocaleString("en-PK")}</p>
        <span className="quiet-badge">
          {manual && order.paymentStatus === "awaiting_verification"
            ? "Payment Verification Pending"
            : statusLabel(order.orderStatus)}
        </span>
        <p>
          Payment: {manual ? "Manual Online Payment" : "Cash on Delivery"} ·{" "}
          {statusLabel(order.paymentStatus)}
        </p>
        {order.rejectionReason && (
          <p role="alert">Payment rejection reason: {order.rejectionReason}</p>
        )}
        {manual &&
          order.paymentStatus !== "verified" &&
          order.orderStatus !== "cancelled" && (
            <div className="bank-panel">
              <h3>Send your payment proof</h3>
              <p>{settings.bank.instructions}</p>
              <a
                className="button full"
                href={buildWhatsAppUrl(
                  whatsappMessages.paymentVerification(
                    order.orderNumber,
                    money(order.total),
                    order.customer.name,
                  ),
                  settings.whatsapp,
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={18} />
                SEND PAYMENT SCREENSHOT ON WHATSAPP
              </a>
            </div>
          )}
        <div>
          {order.items.map((item) => (
            <div className="summary-row" key={item.sku}>
              <span>
                {item.name} · {item.variantName} × {item.quantity}
              </span>
              <span>{money(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="summary-row">
          <span>Delivery</span>
          <span>{money(order.shipping)}</span>
        </div>
        <div className="summary-row summary-total">
          <span>Order total</span>
          <strong>{money(order.total)}</strong>
        </div>
        <p>
          {order.customer.name} · {order.customer.address},{" "}
          {order.customer.area}, {order.customer.city}
        </p>
        <h3 className="mt-6">Order timeline</h3>
        <ol className="order-timeline">
          <li>
            Order placed · {order.createdAt?.toDate().toLocaleString("en-PK")}
          </li>
          {(order.history || []).map((event, index) => (
            <li key={index}>
              <strong>{statusLabel(event.status)}</strong> ·{" "}
              {event.at?.toDate?.().toLocaleString("en-PK")}
              <p>{event.message}</p>
            </li>
          ))}
        </ol>
        {order.trackingNumber && (
          <p>Tracking reference: {order.trackingNumber}</p>
        )}
        <a
          className="text-link"
          href={buildWhatsAppUrl(
            whatsappMessages.orderSupport(order.orderNumber),
            settings.whatsapp,
          )}
          target="_blank"
          rel="noreferrer"
        >
          Order help on WhatsApp
        </a>
      </div>
      <Link className="button" to="/account/orders">
        My orders
        <ArrowRight size={17} />
      </Link>
    </section>
  );
}
