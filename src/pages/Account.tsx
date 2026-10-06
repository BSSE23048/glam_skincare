import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Package, UserRound, MessageCircle, LogOut, Check, AlertCircle } from "lucide-react";
import { useStore } from "../store";
import { useAuth } from "../contexts/AuthContext";
import { login as firebaseLogin, register as firebaseRegister, resetPassword as firebaseReset, logout as firebaseLogout, updateUserProfile } from "../services/auth";
import { watchOrders } from "../services/orders";
import { Empty, Eyebrow, PageHeading, WhatsAppLink } from "../components/ui";
import { business, money, buildWhatsAppUrl, whatsappMessages } from "../config/business";
import type { ShopOrder } from "../domain/models";

export function Auth() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const register = pathname === "/register";
  const [reset, setReset] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const queryParams = new URLSearchParams(search);
  const next = queryParams.get("next") || "/account";

  useEffect(() => {
    if (user) {
      navigate(next, { replace: true });
    }
  }, [user, navigate, next]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "").trim();
    const name = String(form.get("name") || "").trim();

    try {
      if (reset) {
        await firebaseReset(email);
        setNotice("A password reset email has been sent. Please check your inbox.");
      } else if (register) {
        if (!name) throw new Error("Please enter your full name.");
        await firebaseRegister(name, email, password);
        setNotice("Account created successfully!");
        navigate(next, { replace: true });
      } else {
        await firebaseLogin(email, password);
        setNotice("Welcome back!");
        navigate(next, { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page container page-space">
      <div className="auth-image">
        <img
          src="/images/glam-packaging.jpeg"
          alt="Glam Skincare packaging in warm sunlight"
        />
        <div>
          <Eyebrow>A LITTLE SPACE FOR YOU</Eyebrow>
          <h2>
            Your rituals.
            <br />
            <em>All in one place.</em>
          </h2>
        </div>
      </div>
      <div className="auth-form">
        <Eyebrow>WELCOME TO GLAM</Eyebrow>
        <h1>
          {reset
            ? "Reset your password."
            : register
              ? "Make yourself at home."
              : "Lovely to see you."}
        </h1>
        <p>
          {reset
            ? "Enter your email address to receive password recovery instructions."
            : register
              ? "Create your account for a softer everyday."
              : "Sign in to access your orders and account details."}
        </p>

        <form onSubmit={handleSubmit} key={`${register}-${reset}`}>
          {register && !reset && (
            <label className="field">
              Full name
              <input name="name" autoComplete="name" required />
            </label>
          )}

          <label className="field">
            Email address
            <input name="email" type="email" autoComplete="email" required />
          </label>

          {!reset && (
            <label className="field">
              Password
              <input
                name="password"
                type="password"
                minLength={8}
                autoComplete={register ? "new-password" : "current-password"}
                required
              />
              <span className="fine-print">At least 8 characters</span>
            </label>
          )}

          {!register && (
            <button
              className="text-link"
              type="button"
              onClick={() => {
                setReset(!reset);
                setError("");
                setNotice("");
              }}
            >
              {reset ? "Back to sign in" : "Forgot password?"}
            </button>
          )}

          {error && (
            <div className="form-error" role="alert" style={{ margin: "0.75rem 0" }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {notice && (
            <div className="form-success" role="status" style={{ margin: "0.75rem 0" }}>
              <Check size={18} />
              {notice}
            </div>
          )}

          <button className="button full" type="submit" disabled={submitting}>
            {submitting
              ? "Please wait…"
              : reset
                ? "Send recovery email"
                : register
                  ? "Create account"
                  : "Sign in"}
            <ArrowRight size={17} />
          </button>
        </form>

        <p>
          {register ? "Already part of the ritual?" : "New around here?"}{" "}
          <Link
            to={register ? "/login" : "/register"}
            onClick={() => {
              setError("");
              setNotice("");
              setReset(false);
            }}
          >
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>

        <Link to="/shop" className="text-link">
          Continue as a guest
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

export function Account() {
  const { user, profile, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || "");
  const [name, setName] = useState(profile?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || "");
      setPhone(profile.phone || "");
      setWhatsapp(profile.whatsapp || "");
    }
  }, [profile]);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedMsg("");
    try {
      await updateUserProfile(user.uid, {
        displayName: name,
        phone,
        whatsapp,
      });
      setSavedMsg("Profile updated successfully!");
      setEditing(false);
    } catch {
      setSavedMsg("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="empty container page-space">Loading your profile…</div>;
  }

  return (
    <section className="container page-space">
      <PageHeading eyebrow="YOUR LITTLE CORNER" title={`Hello, ${profile?.displayName || user?.displayName || "lovely"}.`}>
        Your account, orders, and favourite rituals — together in one place.
      </PageHeading>

      <div className="account-grid">
        <div className="account-card">
          <UserRound size={29} strokeWidth={1} />
          <h2>Profile & Details</h2>
          <p>Email: {user?.email}</p>

          {editing ? (
            <form onSubmit={handleSaveProfile} style={{ marginTop: '1rem' }}>
              <label className="field">
                Full Name
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="field">
                Mobile Phone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0300 1234567" />
              </label>
              <label className="field">
                WhatsApp Number
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="0300 1234567" />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button type="submit" className="button small" disabled={saving}>
                  {saving ? "Saving..." : "Save Profile"}
                </button>
                <button type="button" className="button secondary small" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ marginTop: '0.75rem' }}>
              <p>Phone: {profile?.phone || "Not set"}</p>
              <p>WhatsApp: {profile?.whatsapp || profile?.phone || "Not set"}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button className="button secondary small" onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
                <button className="button secondary small" onClick={firebaseLogout}>
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          )}

          {savedMsg && <p className="form-success" style={{ marginTop: '0.5rem' }}>{savedMsg}</p>}
        </div>

        <div className="account-card">
          <Package size={29} strokeWidth={1} />
          <h2>Your Orders</h2>
          <p>Track your orders, check payment status, or send verification screenshots.</p>
          <Link className="button secondary" to="/account/orders">
            View orders & history
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      <div className="contact-callout" style={{ marginTop: '2.5rem' }}>
        <h2>A question about your routine or payment?</h2>
        <WhatsAppLink />
      </div>
    </section>
  );
}

export function Orders() {
  const { user } = useAuth();
  const { orders: localOrders, clearOrders } = useStore();
  const [liveOrders, setLiveOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(Boolean(user));

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const unsub = watchOrders(
      user.uid,
      (orders) => {
        setLiveOrders(orders);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [user]);

  return (
    <section className="container narrow page-space">
      <PageHeading eyebrow="YOUR GLAM JOURNEY" title="Your orders.">
        Track your recent purchases and check your payment verification status.
      </PageHeading>

      {loading ? (
        <div className="empty" role="status">Loading your orders…</div>
      ) : liveOrders.length > 0 ? (
        <div className="orders-list">
          {liveOrders.map((order) => {
            const isAwaitingVerification = order.paymentMethod === 'manual_online_payment' && order.paymentStatus === 'awaiting_verification';
            const isVerified = order.paymentStatus === 'verified';
            const isRejected = order.paymentStatus === 'rejected';

            const whatsappMessage = whatsappMessages.paymentVerification(
              order.orderNumber,
              money(order.total),
              order.customer?.name || "Customer"
            );
            const waUrl = buildWhatsAppUrl(whatsappMessage, business.whatsapp);

            return (
              <div
                key={order.id}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #EFEAE3',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>Order #{order.orderNumber}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {order.createdAt?.seconds
                        ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                        : "Just now"}
                    </div>
                  </div>
                  <strong style={{ fontSize: '1.1rem' }}>{money(order.total)}</strong>
                </div>

                <div style={{ margin: '0.5rem 0' }}>
                  {isAwaitingVerification && (
                    <span className="quiet-badge warning" style={{ background: '#FFF3E0', color: '#E65100', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                      PAYMENT VERIFICATION PENDING
                    </span>
                  )}
                  {isVerified && (
                    <span className="quiet-badge success" style={{ background: '#E8F5E9', color: '#2E7D32', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                      PAYMENT VERIFIED
                    </span>
                  )}
                  {isRejected && (
                    <span className="quiet-badge danger" style={{ background: '#FFEBEE', color: '#C62828', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                      PAYMENT COULD NOT BE VERIFIED
                    </span>
                  )}
                  {order.paymentMethod === 'cod' && (
                    <span className="quiet-badge info" style={{ background: '#E3F2FD', color: '#1565C0', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                      CASH ON DELIVERY ({order.orderStatus.toUpperCase()})
                    </span>
                  )}
                </div>

                {isRejected && order.rejectionReason && (
                  <p style={{ color: '#C62828', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    <strong>Reason:</strong> {order.rejectionReason}
                  </p>
                )}

                {isAwaitingVerification && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="button small"
                      style={{ background: '#25D366', color: '#ffffff', borderColor: '#25D366', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <MessageCircle size={16} />
                      SEND / RESEND SCREENSHOT ON WHATSAPP
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : localOrders.length > 0 ? (
        <>
          <div className="orders-list">
            {localOrders.map((order) => (
              <Link key={order.id} to={`/account/orders/${order.id}`}>
                <Package size={26} />
                <div>
                  <strong>{order.id}</strong>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                    {order.status}
                  </span>
                </div>
                <strong>{money(order.total)}</strong>
                <ArrowRight size={18} />
              </Link>
            ))}
          </div>
          <button className="text-link" onClick={clearOrders} style={{ marginTop: '1rem' }}>
            Clear local saved previews
          </button>
        </>
      ) : (
        <Empty
          title="Your story is just beginning."
          text="No orders yet. Explore the essentials and try our checkout."
        />
      )}
    </section>
  );
}
