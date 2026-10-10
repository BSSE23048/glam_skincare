import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Package,
  UserRound,
  MessageCircle,
  LogOut,
  Check,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  MapPin,
  LogIn,
  UserPlus,
  KeyRound,
  ShoppingBag,
  Shield,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import {
  login as firebaseLogin,
  register as firebaseRegister,
  resetPassword as firebaseReset,
  logout as firebaseLogout,
  updateUserProfile,
} from "../services/auth";
import { useSettings } from "../contexts/SiteContext";
import { watchOrders } from "../services/orders";
import { Empty, Eyebrow, PageHeading, WhatsAppLink } from "../components/ui";
import { money, buildWhatsAppUrl, whatsappMessages } from "../config/business";
import type { ShopOrder } from "../domain/models";

export function Auth({
  initialMode,
}: {
  initialMode?: "login" | "register" | "reset";
}) {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { user, admin, loading } = useAuth();
  const queryParams = new URLSearchParams(search);
  const requestedNext = queryParams.get("next") || "/account";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/account";

  // Determine initial mode from props or URL path
  const defaultMode =
    initialMode || (pathname === "/register" ? "register" : "login");
  const [mode, setMode] = useState<"login" | "register" | "reset">(defaultMode);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (admin) {
        const dest = next && next.startsWith("/admin") ? next : "/admin";
        navigate(dest, { replace: true });
      } else {
        const dest = next && !next.startsWith("/admin") ? next : "/account";
        navigate(dest, { replace: true });
      }
    }
  }, [user, admin, loading, navigate, next]);

  // Synchronize mode when location changes
  useEffect(() => {
    if (pathname === "/register") {
      setMode("register");
    } else if (pathname === "/login") {
      setMode("login");
    }
  }, [pathname]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const whatsapp = String(form.get("whatsapp") || "").trim();

    try {
      if (mode === "reset") {
        if (!email)
          throw new Error("Please enter your registered email address.");
        await firebaseReset(email);
        setNotice(
          "A password recovery link has been sent to your email. Check your inbox.",
        );
      } else if (mode === "register") {
        if (!name) throw new Error("Please enter your full name.");
        if (password.length < 8)
          throw new Error("Password must be at least 8 characters long.");
        await firebaseRegister(name, email, password, phone, whatsapp);
        setNotice("Account created successfully! Welcome to Glam Skincare.");
        navigate(next, { replace: true });
      } else {
        if (!email || !password)
          throw new Error("Please enter your email and password.");
        const userObj = await firebaseLogin(email, password);
        const token = await userObj.getIdTokenResult();
        const isAdmin = token?.claims.admin === true;
        setNotice("Welcome back to Glam Skincare!");
        if (isAdmin) {
          navigate("/admin", { replace: true });
        } else {
          const dest = next && !next.startsWith("/admin") ? next : "/account";
          navigate(dest, { replace: true });
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please check your credentials.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page container page-space">
      <div
        className="auth-grid-wrapper"
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "2rem",
          alignItems: "stretch",
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #EFEAE3",
          boxShadow: "0 10px 40px rgba(48, 46, 42, 0.05)",
          overflow: "hidden",
        }}
      >
        {/* Brand Side Showcase */}
        <div
          className="auth-image-side"
          style={{
            position: "relative",
            minHeight: "440px",
            background: "linear-gradient(135deg, #302E2A 0%, #1A1917 100%)",
            color: "#FFFFFF",
            padding: "2.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.25,
              backgroundImage: `url('/images/glam-packaging.jpeg')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <span
              style={{
                fontSize: "0.75rem",
                letterSpacing: "2.5px",
                fontWeight: 700,
                color: "#EFDCD7",
                textTransform: "uppercase",
              }}
            >
              GLAM SKINCARE PAKISTAN
            </span>
            <h2
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "2rem",
                marginTop: "0.5rem",
                color: "#FAF8F5",
                lineHeight: 1.2,
              }}
            >
              Glow. Care. Confidence.
              <br />
              <em style={{ color: "#EFDCD7", fontStyle: "italic" }}>
                All in one place.
              </em>
            </h2>
          </div>

          <div style={{ position: "relative", zIndex: 1, marginTop: "2rem" }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    background: "rgba(239, 220, 215, 0.15)",
                    padding: "8px",
                    borderRadius: "50%",
                    color: "#EFDCD7",
                  }}
                >
                  <Package size={18} />
                </div>
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      color: "#FAF8F5",
                    }}
                  >
                    Live Order & Payment Tracking
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#B8B0A6" }}>
                    Track purchases & WhatsApp payment verification
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    background: "rgba(239, 220, 215, 0.15)",
                    padding: "8px",
                    borderRadius: "50%",
                    color: "#EFDCD7",
                  }}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      color: "#FAF8F5",
                    }}
                  >
                    Express Saved Checkout
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#B8B0A6" }}>
                    Pre-fill shipping address for instant orders
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    background: "rgba(239, 220, 215, 0.15)",
                    padding: "8px",
                    borderRadius: "50%",
                    color: "#EFDCD7",
                  }}
                >
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      color: "#FAF8F5",
                    }}
                  >
                    Secure Customer Authentication
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#B8B0A6" }}>
                    256-bit encrypted account protection
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Form Side */}
        <div className="auth-form-side" style={{ padding: "2.5rem 2rem" }}>
          {/* Top Auth Mode Switcher Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              background: "#FAF8F5",
              padding: "4px",
              borderRadius: "10px",
              border: "1px solid #EFEAE3",
              marginBottom: "1.75rem",
            }}
          >
            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => {
                setMode("login");
                setError("");
                setNotice("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.65rem 1rem",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: "none",
                background: mode === "login" ? "#302E2A" : "transparent",
                color: mode === "login" ? "#FFFFFF" : "#685F57",
                boxShadow:
                  mode === "login" ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
              }}
            >
              <LogIn size={16} />
              Sign In / Log In
            </button>

            <button
              type="button"
              className="auth-toggle-btn"
              onClick={() => {
                setMode("register");
                setError("");
                setNotice("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.65rem 1rem",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: "none",
                background: mode === "register" ? "#302E2A" : "transparent",
                color: mode === "register" ? "#FFFFFF" : "#685F57",
                boxShadow:
                  mode === "register" ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
              }}
            >
              <UserPlus size={16} />
              Create Account / Sign Up
            </button>
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <Eyebrow>CUSTOMER PORTAL</Eyebrow>
            <h1
              style={{
                fontSize: "1.75rem",
                fontFamily: "Georgia, serif",
                color: "#302E2A",
                margin: "0.25rem 0",
              }}
            >
              {mode === "reset"
                ? "Reset Your Password"
                : mode === "register"
                  ? "Create Your Account"
                  : "Sign In to Your Account"}
            </h1>
            <p style={{ color: "#685F57", fontSize: "0.9rem" }}>
              {mode === "reset"
                ? "Enter your email address to receive password recovery instructions."
                : mode === "register"
                  ? "Join Glam Skincare to track orders, save shipping details & view purchase history."
                  : "Sign in to access your orders, saved addresses, and profile details."}
            </p>
          </div>

          <form onSubmit={handleSubmit} key={mode}>
            {mode === "register" && (
              <label className="field" style={{ marginBottom: "1rem" }}>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#302E2A",
                  }}
                >
                  Full Name *
                </span>
                <div style={{ position: "relative" }}>
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="e.g. Ayesha Khan"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                      borderRadius: "8px",
                      border: "1px solid #E2DCD5",
                      fontSize: "0.9rem",
                    }}
                  />
                  <UserRound
                    size={17}
                    style={{
                      position: "absolute",
                      left: "0.85rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#999",
                    }}
                  />
                </div>
              </label>
            )}

            <label className="field" style={{ marginBottom: "1rem" }}>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#302E2A",
                }}
              >
                Email Address *
              </span>
              <div style={{ position: "relative" }}>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                  style={{
                    width: "100%",
                    padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                    borderRadius: "8px",
                    border: "1px solid #E2DCD5",
                    fontSize: "0.9rem",
                  }}
                />
                <Mail
                  size={17}
                  style={{
                    position: "absolute",
                    left: "0.85rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#999",
                  }}
                />
              </div>
            </label>

            {mode !== "reset" && (
              <label className="field" style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#302E2A",
                    }}
                  >
                    Password *
                  </span>
                  {mode === "login" && (
                    <button
                      className="text-link"
                      type="button"
                      onClick={() => {
                        setMode("reset");
                        setError("");
                        setNotice("");
                      }}
                      style={{
                        fontSize: "0.8rem",
                        border: "none",
                        color: "#8B635E",
                        cursor: "pointer",
                        background: "none",
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    placeholder="••••••••"
                    required
                    style={{
                      width: "100%",
                      padding: "0.75rem 2.5rem 0.75rem 2.5rem",
                      borderRadius: "8px",
                      border: "1px solid #E2DCD5",
                      fontSize: "0.9rem",
                    }}
                  />
                  <Lock
                    size={17}
                    style={{
                      position: "absolute",
                      left: "0.85rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#999",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "0.85rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#999",
                      cursor: "pointer",
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <span
                  className="fine-print"
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    display: "block",
                    marginTop: "0.25rem",
                  }}
                >
                  Minimum 8 characters
                </span>
              </label>
            )}

            {mode === "register" && (
              <>
                <label className="field" style={{ marginBottom: "1rem" }}>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#302E2A",
                    }}
                  >
                    Mobile Phone (Optional)
                  </span>
                  <div style={{ position: "relative" }}>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="0300 1234567"
                      style={{
                        width: "100%",
                        padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                        borderRadius: "8px",
                        border: "1px solid #E2DCD5",
                        fontSize: "0.9rem",
                      }}
                    />
                    <Phone
                      size={17}
                      style={{
                        position: "absolute",
                        left: "0.85rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#999",
                      }}
                    />
                  </div>
                </label>

                <label className="field" style={{ marginBottom: "1rem" }}>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#302E2A",
                    }}
                  >
                    WhatsApp Number (Optional)
                  </span>
                  <div style={{ position: "relative" }}>
                    <input
                      name="whatsapp"
                      type="tel"
                      placeholder="0322 4729343"
                      style={{
                        width: "100%",
                        padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                        borderRadius: "8px",
                        border: "1px solid #E2DCD5",
                        fontSize: "0.9rem",
                      }}
                    />
                    <MessageCircle
                      size={17}
                      style={{
                        position: "absolute",
                        left: "0.85rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#999",
                      }}
                    />
                  </div>
                </label>
              </>
            )}

            {error && (
              <div
                className="form-error"
                role="alert"
                style={{
                  margin: "1rem 0",
                  padding: "0.75rem 1rem",
                  background: "#FDF2F2",
                  border: "1px solid #F8B4B4",
                  borderRadius: "8px",
                  color: "#9B1C1C",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {notice && (
              <div
                className="form-success"
                role="status"
                style={{
                  margin: "1rem 0",
                  padding: "0.75rem 1rem",
                  background: "#F3FAF7",
                  border: "1px solid #A3E6CD",
                  borderRadius: "8px",
                  color: "#0E6245",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Check size={18} />
                {notice}
              </div>
            )}

            <button
              className="button full"
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                background: "#302E2A",
                color: "#FFFFFF",
                padding: "0.85rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.95rem",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                marginTop: "0.5rem",
                cursor: "pointer",
              }}
            >
              {submitting ? (
                "Processing..."
              ) : mode === "reset" ? (
                <>
                  <KeyRound size={17} /> Send Recovery Email
                </>
              ) : mode === "register" ? (
                <>
                  <UserPlus size={17} /> Create Account / Sign Up
                </>
              ) : (
                <>
                  <LogIn size={17} /> Sign In to Your Account
                </>
              )}
              <ArrowRight size={17} />
            </button>
          </form>

          {/* Footer Auth Navigation Links */}
          <div
            style={{
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #EFEAE3",
            }}
          >
            {mode === "reset" ? (
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setNotice("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ← Back to Sign In
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <span style={{ fontSize: "0.875rem", color: "#685F57" }}>
                  {mode === "register"
                    ? "Already have an account?"
                    : "New to Glam Skincare?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "register" ? "login" : "register");
                    setError("");
                    setNotice("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8B635E",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  {mode === "register"
                    ? "Sign In / Log In"
                    : "Create Account / Sign Up"}
                </button>
              </div>
            )}

            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <Link
                to="/shop"
                style={{
                  fontSize: "0.85rem",
                  color: "#685F57",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                Continue shopping as guest <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Account() {
  const business = useSettings();
  const { user, profile, admin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && admin) {
      navigate("/admin", { replace: true });
    }
  }, [user, admin, loading, navigate]);

  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "address">(
    "profile",
  );

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || "");
  const [name, setName] = useState(
    profile?.displayName || user?.displayName || "",
  );
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const [liveOrders, setLiveOrders] = useState<ShopOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(Boolean(user));

  useEffect(() => {
    if (profile) {
      setName(profile.displayName || user?.displayName || "");
      setPhone(profile.phone || "");
      setWhatsapp(profile.whatsapp || "");
    }
  }, [profile, user]);

  useEffect(() => {
    if (!user) {
      setOrdersLoading(false);
      return;
    }
    const unsub = watchOrders(
      user.uid,
      (orders) => {
        setLiveOrders(orders);
        setOrdersLoading(false);
      },
      () => setOrdersLoading(false),
    );
    return () => unsub();
  }, [user]);

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

  async function handleSignOut() {
    try {
      await firebaseLogout();
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Sign out error", err);
    }
  }

  if (loading) {
    return (
      <div className="empty container page-space" role="status">
        <Sparkles
          size={24}
          style={{ marginBottom: "1rem", color: "#8B635E" }}
        />
        <p>Restoring your account session…</p>
      </div>
    );
  }

  // Unauthenticated user -> render complete Auth View with Sign In & Sign Up buttons!
  if (!user) {
    return <Auth initialMode="login" />;
  }

  // Admin user -> Synchronously redirect to /admin portal! Admin must NEVER see customer account dashboard.
  if (admin) {
    return <Navigate to="/admin" replace />;
  }

  const initialLetter = (
    profile?.displayName ||
    user?.displayName ||
    user?.email ||
    "G"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <section className="container page-space">
      {/* Customer Hero Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #302E2A 0%, #1A1917 100%)",
          borderRadius: "16px",
          padding: "2rem",
          color: "#FFFFFF",
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1.5rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "#EFDCD7",
              color: "#302E2A",
              fontSize: "1.75rem",
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(239, 220, 215, 0.3)",
            }}
          >
            {initialLetter}
          </div>
          <div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontFamily: "Georgia, serif",
                  color: "#FAF8F5",
                }}
              >
                Hello,{" "}
                {profile?.displayName || user?.displayName || "Valued Customer"}
              </h1>
              {admin && (
                <span
                  style={{
                    background: "#EFDCD7",
                    color: "#302E2A",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Admin
                </span>
              )}
            </div>
            <p
              style={{
                color: "#B8B0A6",
                fontSize: "0.875rem",
                marginTop: "0.25rem",
              }}
            >
              {user.email} · Member of Glam Skincare Rituals
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {admin && (
            <Link
              to="/admin"
              className="button small"
              style={{
                background: "#EFDCD7",
                color: "#302E2A",
                borderColor: "#EFDCD7",
                padding: "0.6rem 1.2rem",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.85rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Shield size={16} /> Admin Portal
            </Link>
          )}

          <Link
            to="/shop"
            className="button secondary small"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#FFFFFF",
              borderColor: "rgba(255,255,255,0.2)",
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              fontWeight: 500,
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <ShoppingBag size={16} /> Shop Products
          </Link>

          <button
            onClick={handleSignOut}
            className="button secondary small"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#EFDCD7",
              borderColor: "rgba(239, 220, 215, 0.3)",
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              fontWeight: 600,
              fontSize: "0.85rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              cursor: "pointer",
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Account Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          borderBottom: "1px solid #EFEAE3",
          marginBottom: "2rem",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          style={{
            padding: "0.75rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            color: activeTab === "profile" ? "#302E2A" : "#685F57",
            borderBottom:
              activeTab === "profile"
                ? "2px solid #302E2A"
                : "2px solid transparent",
            background: "none",
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <UserRound size={18} /> Profile & Details
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          style={{
            padding: "0.75rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            color: activeTab === "orders" ? "#302E2A" : "#685F57",
            borderBottom:
              activeTab === "orders"
                ? "2px solid #302E2A"
                : "2px solid transparent",
            background: "none",
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Package size={18} /> My Orders ({liveOrders.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("address")}
          style={{
            padding: "0.75rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            color: activeTab === "address" ? "#302E2A" : "#685F57",
            borderBottom:
              activeTab === "address"
                ? "2px solid #302E2A"
                : "2px solid transparent",
            background: "none",
            borderLeft: "none",
            borderRight: "none",
            borderTop: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <MapPin size={18} /> Shipping Details
        </button>
      </div>

      {/* Tab 1: Profile & Personal Details */}
      {activeTab === "profile" && (
        <div
          className="account-grid"
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "1.5rem",
          }}
        >
          <div
            className="account-card"
            style={{
              background: "#FFFFFF",
              border: "1px solid #EFEAE3",
              borderRadius: "12px",
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontFamily: "Georgia, serif",
                  color: "#302E2A",
                }}
              >
                Personal Information
              </h2>
              {!editing && (
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => setEditing(true)}
                  style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
                >
                  Edit Details
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSaveProfile}>
                <label className="field" style={{ marginBottom: "1rem" }}>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#302E2A",
                    }}
                  >
                    Full Name
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "0.7rem",
                      borderRadius: "6px",
                      border: "1px solid #E2DCD5",
                    }}
                  />
                </label>

                <label className="field" style={{ marginBottom: "1rem" }}>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#302E2A",
                    }}
                  >
                    Mobile Phone Number
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0300 1234567"
                    style={{
                      width: "100%",
                      padding: "0.7rem",
                      borderRadius: "6px",
                      border: "1px solid #E2DCD5",
                    }}
                  />
                </label>

                <label className="field" style={{ marginBottom: "1.25rem" }}>
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "#302E2A",
                    }}
                  >
                    WhatsApp Number
                  </span>
                  <input
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. 0322 4729343"
                    style={{
                      width: "100%",
                      padding: "0.7rem",
                      borderRadius: "6px",
                      border: "1px solid #E2DCD5",
                    }}
                  />
                </label>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    type="submit"
                    className="button small"
                    disabled={saving}
                    style={{ background: "#302E2A", color: "#FFF" }}
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                  <button
                    type="button"
                    className="button secondary small"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "#888",
                      fontWeight: 700,
                      letterSpacing: "1px",
                    }}
                  >
                    Full Name
                  </span>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#302E2A",
                    }}
                  >
                    {profile?.displayName || user?.displayName || "Not set"}
                  </p>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "#888",
                      fontWeight: 700,
                      letterSpacing: "1px",
                    }}
                  >
                    Email Address
                  </span>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#302E2A",
                    }}
                  >
                    {user.email}
                  </p>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "#888",
                      fontWeight: 700,
                      letterSpacing: "1px",
                    }}
                  >
                    Mobile Phone
                  </span>
                  <p style={{ fontSize: "0.95rem", color: "#302E2A" }}>
                    {profile?.phone || "Not set"}
                  </p>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      color: "#888",
                      fontWeight: 700,
                      letterSpacing: "1px",
                    }}
                  >
                    WhatsApp Number
                  </span>
                  <p style={{ fontSize: "0.95rem", color: "#302E2A" }}>
                    {profile?.whatsapp || profile?.phone || "Not set"}
                  </p>
                </div>
              </div>
            )}

            {savedMsg && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.6rem 0.8rem",
                  background: "#F3FAF7",
                  border: "1px solid #A3E6CD",
                  borderRadius: "6px",
                  color: "#0E6245",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Check size={16} />
                {savedMsg}
              </div>
            )}
          </div>

          <div
            className="account-card"
            style={{
              background: "#FFFFFF",
              border: "1px solid #EFEAE3",
              borderRadius: "12px",
              padding: "1.75rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontFamily: "Georgia, serif",
                color: "#302E2A",
                marginBottom: "0.75rem",
              }}
            >
              Account Security & Privileges
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#685F57",
                marginBottom: "1.25rem",
              }}
            >
              Your account is protected with bank-grade cloud infrastructure.
              Passwords and identity credentials are stored with 256-bit SSL
              encryption.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
              >
                <ShieldCheck size={18} style={{ color: "#2E7D32" }} />
                <span style={{ fontSize: "0.875rem", color: "#302E2A" }}>
                  Verified Account Authentication
                </span>
              </div>

              <div
                style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}
              >
                <Lock size={18} style={{ color: "#1565C0" }} />
                <span style={{ fontSize: "0.875rem", color: "#302E2A" }}>
                  Role: {admin ? "Store Administrator" : "Customer"}
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: "2rem",
                paddingTop: "1rem",
                borderTop: "1px solid #EFEAE3",
              }}
            >
              <button
                onClick={handleSignOut}
                className="button secondary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  borderColor: "#E2DCD5",
                  color: "#C62828",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <LogOut size={16} /> Sign Out of Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Orders & Tracking */}
      {activeTab === "orders" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #EFEAE3",
            borderRadius: "12px",
            padding: "1.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontFamily: "Georgia, serif",
                  color: "#302E2A",
                }}
              >
                Recent Orders & History
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#685F57" }}>
                Track purchases and payment verification status in real time.
              </p>
            </div>
            <Link
              to="/account/orders"
              className="button secondary small"
              style={{ fontSize: "0.85rem" }}
            >
              Full Orders View <ArrowRight size={15} />
            </Link>
          </div>

          {ordersLoading ? (
            <div className="empty" style={{ padding: "2rem 0" }}>
              Loading your orders…
            </div>
          ) : liveOrders.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {liveOrders.map((order) => {
                const isAwaitingVerification =
                  order.paymentMethod === "manual_online_payment" &&
                  order.paymentStatus === "awaiting_verification";
                const isVerified = order.paymentStatus === "verified";
                const isRejected = order.paymentStatus === "rejected";

                const whatsappMessage = whatsappMessages.paymentVerification(
                  order.orderNumber,
                  money(order.total),
                  order.customer?.name || user?.displayName || "Customer",
                );
                const waUrl = buildWhatsAppUrl(
                  whatsappMessage,
                  business.whatsapp,
                );

                return (
                  <div
                    key={order.id}
                    style={{
                      border: "1px solid #EFEAE3",
                      borderRadius: "10px",
                      padding: "1.25rem",
                      background: "#FAF8F5",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <div>
                        <strong
                          style={{ fontSize: "1.05rem", color: "#302E2A" }}
                        >
                          Order #{order.orderNumber}
                        </strong>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#888",
                            marginTop: "0.15rem",
                          }}
                        >
                          {order.createdAt?.seconds
                            ? new Date(
                                order.createdAt.seconds * 1000,
                              ).toLocaleDateString("en-PK", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Just now"}
                        </div>
                      </div>
                      <strong style={{ fontSize: "1.1rem", color: "#302E2A" }}>
                        {money(order.total)}
                      </strong>
                    </div>

                    <div
                      style={{
                        margin: "0.75rem 0",
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {isAwaitingVerification && (
                        <span
                          style={{
                            background: "#FFF3E0",
                            color: "#E65100",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                          }}
                        >
                          VERIFICATION PENDING
                        </span>
                      )}
                      {isVerified && (
                        <span
                          style={{
                            background: "#E8F5E9",
                            color: "#2E7D32",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                          }}
                        >
                          PAYMENT VERIFIED
                        </span>
                      )}
                      {isRejected && (
                        <span
                          style={{
                            background: "#FFEBEE",
                            color: "#C62828",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                          }}
                        >
                          PAYMENT REJECTED
                        </span>
                      )}
                      {order.paymentMethod === "cod" && (
                        <span
                          style={{
                            background: "#E3F2FD",
                            color: "#1565C0",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "6px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                          }}
                        >
                          CASH ON DELIVERY ({order.orderStatus.toUpperCase()})
                        </span>
                      )}
                    </div>

                    {isAwaitingVerification && (
                      <div style={{ marginTop: "0.75rem" }}>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="button small"
                          style={{
                            background: "#25D366",
                            color: "#FFFFFF",
                            borderColor: "#25D366",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontSize: "0.85rem",
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                          }}
                        >
                          <MessageCircle size={16} /> Send Screenshot on
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              title="No orders placed yet"
              text="When you purchase products, your live tracking and payment details will appear here."
            />
          )}
        </div>
      )}

      {/* Tab 3: Shipping Details */}
      {activeTab === "address" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #EFEAE3",
            borderRadius: "12px",
            padding: "1.75rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontFamily: "Georgia, serif",
              color: "#302E2A",
              marginBottom: "0.5rem",
            }}
          >
            Saved Shipping Address
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#685F57",
              marginBottom: "1.5rem",
            }}
          >
            Manage your default delivery location in Pakistan for automatic
            checkout auto-fill.
          </p>

          <div
            style={{
              padding: "1.25rem",
              border: "1px dashed #E2DCD5",
              borderRadius: "8px",
              background: "#FAF8F5",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <MapPin size={24} style={{ color: "#8B635E" }} />
            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "0.95rem",
                  color: "#302E2A",
                }}
              >
                Default Shipping Profile
              </strong>
              <span style={{ fontSize: "0.85rem", color: "#685F57" }}>
                {profile?.displayName || user.displayName || "Customer"} ·{" "}
                {profile?.phone || "No phone set"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Contact WhatsApp Callout */}
      <div className="contact-callout" style={{ marginTop: "2.5rem" }}>
        <h2>A question about your routine or payment?</h2>
        <WhatsAppLink />
      </div>
    </section>
  );
}

export function Orders() {
  const { user, admin } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    setOrders([]);
    if (!user) {
      setLoading(false);
      return;
    }
    return watchOrders(
      user.uid,
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [user]);
  if (admin) return <Navigate to="/admin/orders" replace />;
  return (
    <section className="container narrow page-space">
      <PageHeading eyebrow="YOUR GLAM JOURNEY" title="Your orders.">
        Track your purchases and payment verification status.
      </PageHeading>
      {error && <p role="alert">Orders could not load: {error}</p>}
      {loading ? (
        <p role="status">Loading orders?</p>
      ) : orders.length ? (
        <div className="orders-list">
          {orders.map((order) => (
            <Link to={`/account/orders/${order.id}`} key={order.id}>
              <Package />
              <div>
                <strong>{order.orderNumber}</strong>
                <span>
                  {order.orderStatus.replaceAll("_", " ")} ?{" "}
                  {order.paymentStatus.replaceAll("_", " ")}
                </span>
              </div>
              <strong>{money(order.total)}</strong>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      ) : (
        !error && (
          <Empty
            title="No orders placed yet"
            text="Your orders will appear here once checkout is complete."
          />
        )
      )}
    </section>
  );
}
