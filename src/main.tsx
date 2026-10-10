import { Component, Suspense, lazy, useEffect } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";
import { StoreProvider } from "./store";
import { AuthProvider, RequireAuth } from "./contexts/AuthContext";
import { SiteProvider } from "./contexts/SiteContext";
import { Layout } from "./components/Layout";
import { SEO } from "./components/SEO";
import { CartPage } from "./components/Cart";
import { About, Contact, FAQ, NotFound, Policy, Ritual } from "./pages/Content";
import { Account, Auth, Orders } from "./pages/Account";
import "./styles.css";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Product = lazy(() => import("./pages/Product"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Admin = lazy(() => import("./pages/Admin"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Glam rendering error", error, info);
  }
  render() {
    return this.state.error ? (
      <div className="empty">
        <h1>A little pause.</h1>
        <p>
          Something didn’t load as expected. Your saved bag is still in this
          browser.
        </p>
        <button className="button" onClick={() => window.location.assign("/")}>
          Try again
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    const main = document.getElementById("main");
    main?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <Layout>
      <SEO />
      <Suspense
        fallback={
          <div
            className="container skeleton-page"
            role="status"
            aria-label="Loading your next ritual"
          >
            <div className="skeleton" />
            <div className="skeleton" />
            <span className="sr-only">Loading…</span>
          </div>
        }
      >
        <motion.div
          key={pathname}
          initial={pathname.startsWith("/admin") ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/how-it-works" element={<Ritual />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route
              path="/account"
              element={
                <RequireAuth>
                  <Account />
                </RequireAuth>
              }
            />
            <Route
              path="/account/orders"
              element={
                <RequireAuth>
                  <Orders />
                </RequireAuth>
              }
            />
            <Route
              path="/account/orders/:id"
              element={
                <RequireAuth>
                  <OrderDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/order-success/:id"
              element={
                <RequireAuth>
                  <OrderDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/*"
              element={
                <RequireAuth admin>
                  <Admin />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth admin>
                  <Admin />
                </RequireAuth>
              }
            />
            <Route path="/shipping" element={<Policy />} />
            <Route path="/privacy" element={<Policy />} />
            <Route path="/terms" element={<Policy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </Suspense>
    </Layout>
  );
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <SiteProvider>
            <StoreProvider>
              <App />
            </StoreProvider>
          </SiteProvider>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  </ErrorBoundary>,
);
