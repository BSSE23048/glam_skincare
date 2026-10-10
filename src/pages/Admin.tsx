import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  BarChart3,
  Star,
  Settings,
  LogOut,
  ExternalLink,
  Plus,
  Edit3,
  Copy,
  Search,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  MessageCircle,
  Eye,
  Tag,
  Calendar,
  ShoppingBag,
} from "lucide-react";
import {
  saveProduct,
  setProductActive,
  adjustStock,
} from "../services/products";
import { firebase } from "../services/firebase";
import { logout as firebaseLogout } from "../services/auth";
import { watchOrders, updateOrder } from "../services/orders";
import {
  money,
  buildWhatsAppUrl,
  whatsappMessages,
  business,
} from "../config/business";
import { Modal } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import type {
  ShopOrder,
  OrderStatus,
  StoreProduct,
  ModeratedReview,
  StoreSettings,
  CustomerSummary,
  ProductCost,
} from "../domain/models";
import {
  collection,
  onSnapshot,
  query,
  doc,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

type AdminTab =
  | "dashboard"
  | "products"
  | "inventory"
  | "orders"
  | "payments"
  | "customers"
  | "analytics"
  | "reviews"
  | "settings"
  | "profile";

type TimeRange = "today" | "7days" | "30days" | "all";

export default function Admin() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const location = useLocation();
  const activeTab = (location.pathname.split("/")[2] ||
    "dashboard") as AdminTab;
  const setActiveTab = (tab: AdminTab) =>
    navigate(tab === "dashboard" ? "/admin" : `/admin/${tab}`);
  const [loadError, setLoadError] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  // Core Data Collections
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [reviews, setReviews] = useState<ModeratedReview[]>([]);
  const [productsList, setProductsList] = useState<StoreProduct[]>([]);
  const [productCosts, setProductCosts] = useState<Record<string, ProductCost>>(
    {},
  );
  const [customersList, setCustomersList] = useState<CustomerSummary[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(
    null,
  );

  // UI / Modal States
  const [verifyingOrder, setVerifyingOrder] = useState<ShopOrder | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<ShopOrder | null>(null);
  const [inspectingOrder, setInspectingOrder] = useState<ShopOrder | null>(
    null,
  );
  const [editingProduct, setEditingProduct] =
    useState<Partial<StoreProduct> | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>(
    "Payment not received",
  );
  const [customReason, setCustomReason] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>("all");
  const [productSearch, setProductSearch] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState<string>("all");
  const [reviewFilter, setReviewFilter] = useState<string>("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [adminName, setAdminName] = useState(
    profile?.displayName || user?.displayName || "",
  );
  const [adminPhone, setAdminPhone] = useState(profile?.phone || "");

  useEffect(() => {
    if (profile) {
      setAdminName(profile.displayName || user?.displayName || "");
      setAdminPhone(profile.phone || "");
    }
  }, [profile, user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await firebaseLogout();
      showToast("Signed out successfully.");
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Sign out error", err);
    }
  };

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firebase) return;
    setActionSubmitting(true);
    try {
      await setDoc(
        doc(firebase.db, "users", user.uid),
        {
          displayName: adminName,
          phone: adminPhone,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      showToast("Admin profile updated successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleUpdateVariantStock = async (
    productId: string,
    variantId: string,
    _currentStock: number,
    delta: number,
  ) => {
    if (!firebase) return;
    try {
      await adjustStock(productId, variantId, delta);
      showToast("Variant inventory updated.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Inventory update failed.",
      );
    }
  };

  // Subscribe to Firestore collections
  useEffect(() => {
    if (!firebase) return;

    const unsubOrders = watchOrders(
      null,
      (fetchedOrders) => {
        setOrders(fetchedOrders);
      },
      (error) => setLoadError(`Orders could not load: ${error.message}`),
    );

    const unsubReviews = onSnapshot(
      query(collection(firebase.db, "reviews")),
      (snap) => {
        setReviews(
          snap.docs.map((d) => ({ ...d.data(), id: d.id }) as ModeratedReview),
        );
      },
      (err) => console.warn("Reviews snapshot listener warning:", err),
    );

    const unsubProducts = onSnapshot(
      query(collection(firebase.db, "products")),
      (snap) => {
        setProductsList(
          snap.docs.map((d) => ({ ...d.data(), id: d.id }) as StoreProduct),
        );
      },
      (err) => console.warn("Products snapshot listener warning:", err),
    );

    // Fetch private costs (Admin-only collection)
    const unsubCosts = onSnapshot(
      query(collection(firebase.db, "productCosts")),
      (snap) => {
        const costsMap: Record<string, ProductCost> = {};
        snap.docs.forEach((d) => {
          costsMap[d.id] = { ...d.data(), productId: d.id } as ProductCost;
        });
        setProductCosts(costsMap);
      },
      (err) => console.warn("ProductCosts snapshot listener warning:", err),
    );

    // Fetch Customers
    getDocs(collection(firebase.db, "users"))
      .then((snap) => {
        const usersData: CustomerSummary[] = snap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            uid: docSnap.id,
            displayName: data.displayName || "Customer",
            email: data.email || "No email",
            phone: data.phone || "No phone",
            whatsapp: data.whatsapp || data.phone || "",
            orderCount: 0,
            totalSpent: 0,
            lastOrderAt: data.createdAt,
          };
        });
        setCustomersList(usersData);
      })
      .catch((err) => console.warn("Users fetch warning:", err));

    // Fetch Settings
    getDoc(doc(firebase.db, "settings", "store"))
      .then((snap) => {
        if (snap.exists()) {
          setStoreSettings(snap.data() as StoreSettings);
        } else {
          setStoreSettings(business);
        }
      })
      .catch((err) => setLoadError(`Settings could not load: ${err.message}`));

    return () => {
      unsubOrders();
      unsubReviews();
      unsubProducts();
      unsubCosts();
    };
  }, []);

  // Read the authoritative product list
  const activeProducts = useMemo(() => {
    return productsList;
  }, [productsList]);

  // Compute Date Range Filter helper
  const isOrderInTimeRange = (order: ShopOrder) => {
    if (timeRange === "all") return true;
    if (!order.createdAt?.seconds) return true;
    const orderDate = new Date(order.createdAt.seconds * 1000);
    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (timeRange === "today") return diffDays <= 1;
    if (timeRange === "7days") return diffDays <= 7;
    if (timeRange === "30days") return diffDays <= 30;
    return true;
  };

  const filteredOrdersByTime = useMemo(() => {
    return orders.filter(isOrderInTimeRange);
  }, [orders, timeRange]);

  // Compute Financial Metrics & KPIs
  const paymentsAwaiting = orders.filter(
    (o) =>
      o.paymentMethod === "manual_online_payment" &&
      (o.paymentStatus === "awaiting_verification" ||
        o.orderStatus === "payment_verification"),
  );

  const newOrdersCount = orders.filter(
    (o) =>
      o.orderStatus === "pending" || o.orderStatus === "payment_verification",
  ).length;

  const lowStockProducts = activeProducts.filter((p) =>
    p.variants.some((v) => v.stock <= (p.lowStockThreshold ?? 5)),
  );

  const pendingReviews = reviews.filter((r) => r.status === "pending");

  // Revenue & Profit Calculations
  const analyticsData = useMemo(() => {
    const validOrders = filteredOrdersByTime.filter(
      (o) => o.orderStatus === "delivered",
    );

    let totalRevenue = 0;
    let totalCogs = 0;
    let totalUnitsSold = 0;
    const productStats: Record<
      string,
      { name: string; revenue: number; cogs: number; units: number }
    > = {};

    validOrders.forEach((order) => {
      totalRevenue += order.subtotal;
      order.items.forEach((item) => {
        totalUnitsSold += item.quantity;
        const unitCost =
          item.costPriceSnapshot ??
          productCosts[item.productId]?.costPrice ??
          0;
        const lineCogs = unitCost * item.quantity;
        totalCogs += lineCogs;

        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            name: item.name,
            revenue: 0,
            cogs: 0,
            units: 0,
          };
        }
        productStats[item.productId].revenue += item.lineTotal;
        productStats[item.productId].cogs += lineCogs;
        productStats[item.productId].units += item.quantity;
      });
    });

    const grossProfit = totalRevenue - totalCogs;
    const profitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const aov = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

    return {
      costsKnown: validOrders.every((o) =>
        o.items.every((i) => productCosts[i.productId] !== undefined),
      ),
      validOrdersCount: validOrders.length,
      totalRevenue,
      totalCogs,
      grossProfit,
      profitMargin,
      aov,
      totalUnitsSold,
      productStats,
    };
  }, [filteredOrdersByTime, productCosts]);

  // Customer CRM data compilation
  const compiledCustomers = useMemo(() => {
    const map: Record<string, CustomerSummary> = {};
    orders.forEach((o) => {
      const email = o.customer?.email || o.userId;
      if (!map[email]) {
        map[email] = {
          uid: o.userId,
          displayName: o.customer?.name || "Customer",
          email: o.customer?.email || "No email",
          phone: o.customer?.phone || "",
          whatsapp: o.customer?.whatsapp || o.customer?.phone || "",
          orderCount: 0,
          totalSpent: 0,
          lastOrderAt: o.createdAt,
        };
      }
      map[email].orderCount += 1;
      if (
        o.paymentStatus === "verified" ||
        o.orderStatus === "delivered" ||
        o.orderStatus === "confirmed"
      ) {
        map[email].totalSpent += o.total;
      }
    });

    customersList.forEach((c) => {
      if (!map[c.email]) {
        map[c.email] = c;
      }
    });

    return Object.values(map);
  }, [orders, customersList]);

  // Handlers for Order Operations
  async function handleVerifyPayment() {
    if (!verifyingOrder) return;
    setActionSubmitting(true);
    try {
      if (firebase) {
        await updateOrder(verifyingOrder.id, "verify");
      }
      showToast(`Payment verified for order #${verifyingOrder.orderNumber}`);
      setVerifyingOrder(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setActionSubmitting(false);
    }
  }

  async function handleRejectPayment() {
    if (!rejectingOrder) return;
    setActionSubmitting(true);
    const reason = rejectionReason === "Other" ? customReason : rejectionReason;
    try {
      if (firebase) {
        await updateOrder(rejectingOrder.id, "reject", reason);
      }
      showToast(`Payment rejected for order #${rejectingOrder.orderNumber}`);
      setRejectingOrder(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setActionSubmitting(false);
    }
  }

  async function handleStatusChange(orderId: string, nextStatus: OrderStatus) {
    try {
      if (firebase) {
        await updateOrder(orderId, nextStatus);
        showToast(`Order status updated to ${nextStatus}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Status update failed.");
    }
  }

  async function handleReviewAction(
    reviewId: string,
    status: "approved" | "hidden",
  ) {
    if (!firebase) return;
    try {
      await setDoc(
        doc(firebase.db, "reviews", reviewId),
        { status, updatedAt: serverTimestamp() },
        { merge: true },
      );
      showToast(`Review status updated to ${status}`);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Review status update failed.",
      );
    }
  }

  // Handlers for Product CRUD
  async function handleSaveProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingProduct) return;
    setActionSubmitting(true);
    try {
      const prodId = editingProduct.id || `product_${Date.now()}`;
      const costPrice = Number(editingProduct.costPrice ?? 0);

      const defaultVariants = [
        {
          id: "blush",
          name: "Blush Pink",
          color: "#e8abae",
          image: editingProduct.images?.[0] || "/images/pink-pad.jpeg",
          stock: 20,
          sku: `GLAM-${prodId.toUpperCase()}-PNK`,
          active: true,
        },
        {
          id: "ivory",
          name: "Soft White",
          color: "#FAF8F5",
          image: editingProduct.images?.[1] || "/images/white-pad.jpeg",
          stock: 8,
          sku: `GLAM-${prodId.toUpperCase()}-WHT`,
          active: true,
        },
      ];

      const updatedProduct: StoreProduct = {
        id: prodId,
        slug:
          editingProduct.slug ||
          (editingProduct.name || prodId)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        name: editingProduct.name || "New Essential",
        subtitle: editingProduct.subtitle || "The reusable cleansing pad",
        category: editingProduct.category || "Cleansing essentials",
        description: editingProduct.description || "",
        price: Number(editingProduct.price ?? 850),
        compareAt: Number(editingProduct.compareAt ?? 0),
        images: editingProduct.images?.length
          ? editingProduct.images
          : ["/images/pink-pad.jpeg", "/images/white-pad.jpeg"],
        material: editingProduct.material || "100% Polyester Microfiber",
        care: editingProduct.care || "Machine wash cold. Hang to dry.",
        active: editingProduct.active ?? true,
        featured: editingProduct.featured ?? true,
        lowStockThreshold: Number(editingProduct.lowStockThreshold ?? 5),
        benefits: editingProduct.benefits || [
          "Reusable",
          "Just Add Water",
          "Gentle Microfiber",
        ],
        usage:
          editingProduct.usage ||
          "Saturate pad with warm water and sweep gently.",
        reviews: editingProduct.reviews || [],
        costPrice,
        variants: editingProduct.variants?.length
          ? editingProduct.variants
          : defaultVariants,
      };

      await saveProduct(updatedProduct);

      setEditingProduct(null);
      showToast("Product saved successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setActionSubmitting(false);
    }
  }

  async function handleToggleProductActive(prod: StoreProduct) {
    try {
      await setProductActive(prod.id, !prod.active);
      showToast(`Product ${prod.active ? "deactivated" : "activated"}`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Status update failed.",
      );
    }
  }

  async function handleDuplicateProduct(prod: StoreProduct) {
    const dupId = `product_${Date.now()}`;
    const dupProduct: StoreProduct = {
      ...prod,
      id: dupId,
      slug: `${prod.slug}-copy`,
      name: `${prod.name} (Copy)`,
      active: true,
      variants: prod.variants.map((v) => ({
        ...v,
        sku: `GLAM-${dupId.slice(-6).toUpperCase()}-${v.id.toUpperCase()}`,
      })),
    };
    setEditingProduct(dupProduct);
  }

  // Settings Save Handler
  async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionSubmitting(true);
    const form = new FormData(e.currentTarget);

    const updatedSettings: StoreSettings = {
      name: String(form.get("name") || business.name),
      tagline: String(form.get("tagline") || business.tagline),
      whatsapp: String(form.get("whatsapp") || business.whatsapp),
      instagram: String(form.get("instagram") || business.instagram),
      currency: "PKR",
      locale: "en-PK",
      siteUrl: storeSettings?.siteUrl ?? business.siteUrl,
      preview: storeSettings?.preview ?? business.preview,
      provisional: storeSettings?.provisional ?? business.provisional,
      shipping: {
        fee: Number(form.get("shippingFee") || 200),
        freeAbove: Number(form.get("freeAbove") || 2500),
        confirmed: true,
        estimatedDays: String(form.get("estimatedDays") || "3–5 working days"),
      },
      bank: {
        name: String(form.get("bankName") || "Meezan Bank"),
        accountTitle: String(form.get("accountTitle") || "Glam Skincare"),
        accountNumber: String(form.get("accountNumber") ?? ""),
        instructions:
          storeSettings?.bank.instructions ?? business.bank.instructions,
        enabled: form.get("bankEnabled") === "on",
        wallet: String(form.get("wallet") ?? ""),
      },
      receiptBackend: "none",
      returnsPolicy: storeSettings?.returnsPolicy ?? business.returnsPolicy,
      supportEmail: storeSettings?.supportEmail ?? business.supportEmail,
    };

    try {
      if (
        ![
          updatedSettings.shipping.fee,
          updatedSettings.shipping.freeAbove,
        ].every((n) => Number.isFinite(n) && n >= 0)
      )
        throw new Error("Shipping amounts cannot be negative.");
      if (!/^\+?[0-9]{10,15}$/.test(updatedSettings.whatsapp))
        throw new Error("Enter a valid WhatsApp number with country code.");
      if (firebase) {
        await setDoc(doc(firebase.db, "settings", "store"), updatedSettings, {
          merge: true,
        });
      }
      setStoreSettings(updatedSettings);
      showToast("Store settings saved successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setActionSubmitting(false);
    }
  }

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return filteredOrdersByTime.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer?.name.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer?.phone.includes(orderSearch);
      const matchesStatus =
        orderStatusFilter === "all" || o.orderStatus === orderStatusFilter;
      const matchesPayment =
        orderPaymentFilter === "all" ||
        o.paymentMethod === orderPaymentFilter ||
        o.paymentStatus === orderPaymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [
    filteredOrdersByTime,
    orderSearch,
    orderStatusFilter,
    orderPaymentFilter,
  ]);

  // Filtered Products List
  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase());
      const matchesStatus =
        productStatusFilter === "all" ||
        (productStatusFilter === "active" && p.active) ||
        (productStatusFilter === "inactive" && !p.active) ||
        (productStatusFilter === "lowstock" &&
          p.variants.some((v) => v.stock <= (p.lowStockThreshold ?? 5))) ||
        (productStatusFilter === "outofstock" &&
          p.variants.every((v) => v.stock <= 0));
      return matchesSearch && matchesStatus;
    });
  }, [activeProducts, productSearch, productStatusFilter]);

  // Filtered Customers List
  const filteredCustomers = useMemo(() => {
    return compiledCustomers.filter(
      (c) =>
        c.displayName.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch),
    );
  }, [compiledCustomers, customerSearch]);

  // Filtered Reviews List
  const filteredReviews = useMemo(() => {
    return reviews.filter(
      (r) => reviewFilter === "all" || r.status === reviewFilter,
    );
  }, [reviews, reviewFilter]);

  return (
    <div
      className="admin-shell"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#F5F3EF",
        color: "#302E2A",
      }}
    >
      {loadError && (
        <div className="admin-load-error" role="alert">
          {loadError}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#2E7D32",
            color: "#FFFFFF",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMessage}
        </div>
      )}

      {/* EXECUTIVE ADMIN SIDEBAR */}
      <aside
        className="admin-sidebar"
        style={{
          width: "250px",
          background: "#1E1D1A",
          color: "#EFEAE3",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "1.5rem 1rem",
          flexShrink: 0,
        }}
      >
        <div>
          {/* Brand & Admin Badge */}
          <div style={{ marginBottom: "2rem", padding: "0 0.5rem" }}>
            <div
              style={{
                fontSize: "1.25rem",
                fontFamily: "Georgia, serif",
                fontWeight: "bold",
                color: "#FFF",
              }}
            >
              Glam Skincare
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#8A5A2B",
                color: "#FFF",
                fontSize: "0.65rem",
                letterSpacing: "1px",
                padding: "2px 8px",
                borderRadius: "10px",
                marginTop: "6px",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              <ShieldCheck size={12} /> Executive Portal
            </div>
          </div>

          {/* Navigation Links */}
          <nav
            style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
          >
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              {
                id: "products",
                label: "Products",
                icon: Package,
                badge:
                  lowStockProducts.length > 0
                    ? `${lowStockProducts.length} low`
                    : null,
                badgeColor: "#F57C00",
              },
              { id: "inventory", label: "Inventory", icon: Tag },
              {
                id: "orders",
                label: "Orders",
                icon: ShoppingCart,
                badge: newOrdersCount > 0 ? newOrdersCount : null,
                badgeColor: "#E65100",
              },
              {
                id: "payments",
                label: "Payments Queue",
                icon: CreditCard,
                badge:
                  paymentsAwaiting.length > 0 ? paymentsAwaiting.length : null,
                badgeColor: "#C62828",
              },
              { id: "customers", label: "Customers", icon: Users },
              { id: "analytics", label: "Analytics & Profit", icon: BarChart3 },
              {
                id: "reviews",
                label: "Reviews",
                icon: Star,
                badge: pendingReviews.length > 0 ? pendingReviews.length : null,
                badgeColor: "#1565C0",
              },
              { id: "settings", label: "Settings", icon: Settings },
              { id: "profile", label: "Admin Profile", icon: ShieldCheck },
            ].map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    background: isActive ? "#35342F" : "transparent",
                    color: isActive ? "#FFF" : "#B5AFA6",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "0.9rem",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <IconComp
                      size={18}
                      color={isActive ? "#E0C097" : "#B5AFA6"}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        background: item.badgeColor || "#8A5A2B",
                        color: "#FFF",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        padding: "2px 7px",
                        borderRadius: "10px",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin User Profile Card & Actions */}
        <div
          style={{
            borderTop: "1px solid #33312B",
            paddingTop: "1.25rem",
            marginTop: "1rem",
          }}
        >
          <div style={{ marginBottom: "0.75rem", padding: "0 0.5rem" }}>
            <div
              style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#FFF" }}
            >
              {profile?.displayName || user?.displayName || "Admin User"}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#888",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.email || "admin@glamskincare.pk"}
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.8rem",
                color: "#E0C097",
                padding: "0.4rem 0.5rem",
              }}
            >
              <ExternalLink size={14} /> View Live Store ↗
            </a>

            <button
              onClick={handleSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.85rem",
                color: "#EF9A9A",
                padding: "0.5rem",
                width: "100%",
                borderRadius: "6px",
                background: "rgba(198, 40, 40, 0.15)",
              }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN ADMIN CONTENT AREA */}
      <main
        className="admin-content"
        style={{
          flex: 1,
          padding: "2rem",
          overflowY: "auto",
          maxWidth: "calc(100vw - 250px)",
        }}
      >
        {/* TOP BAR / HEADER */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            background: "#FFF",
            padding: "1rem 1.5rem",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: "#888",
                fontWeight: "bold",
              }}
            >
              GLAM ADMIN HUB
            </span>
            <h1
              style={{
                fontSize: "1.5rem",
                margin: 0,
                textTransform: "capitalize",
                fontFamily: "Georgia, serif",
              }}
            >
              {activeTab === "payments"
                ? "Payment Verification Queue"
                : activeTab}
            </h1>
          </div>

          {/* Time Range Selector for Analytics / Dashboard */}
          {(activeTab === "dashboard" || activeTab === "analytics") && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#FAF8F5",
                padding: "4px",
                borderRadius: "8px",
                border: "1px solid #EFEAE3",
              }}
            >
              <Calendar size={15} color="#888" style={{ marginLeft: "6px" }} />
              {(["today", "7days", "30days", "all"] as TimeRange[]).map(
                (period) => (
                  <button
                    key={period}
                    onClick={() => setTimeRange(period)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      fontWeight: timeRange === period ? 600 : 400,
                      background:
                        timeRange === period ? "#35352E" : "transparent",
                      color: timeRange === period ? "#FFF" : "#666",
                    }}
                  >
                    {period === "today"
                      ? "Today"
                      : period === "7days"
                        ? "7 Days"
                        : period === "30days"
                          ? "30 Days"
                          : "All Time"}
                  </button>
                ),
              )}
            </div>
          )}
        </header>

        {/* 1. DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div>
            {/* Operational Health Center */}
            <div
              style={{
                background: "#FFFDF9",
                border: "1px solid #E0C097",
                padding: "1.25rem",
                borderRadius: "12px",
                marginBottom: "2rem",
              }}
            >
              <h3
                style={{
                  margin: "0 0 1rem 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "1.05rem",
                  color: "#8A5A2B",
                }}
              >
                <ShieldCheck size={20} /> Store Action Center
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div
                  onClick={() => setActiveTab("payments")}
                  style={{
                    background: "#FFF",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid #EFEAE3",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", color: "#666" }}>
                    Payments Awaiting Verification
                  </span>
                  <div
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: "bold",
                      color:
                        paymentsAwaiting.length > 0 ? "#C62828" : "#2E7D32",
                      marginTop: "4px",
                    }}
                  >
                    {paymentsAwaiting.length}
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("orders")}
                  style={{
                    background: "#FFF",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid #EFEAE3",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", color: "#666" }}>
                    New Pending Orders
                  </span>
                  <div
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: "bold",
                      color: "#E65100",
                      marginTop: "4px",
                    }}
                  >
                    {newOrdersCount}
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("products")}
                  style={{
                    background: "#FFF",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid #EFEAE3",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", color: "#666" }}>
                    Low Stock Items
                  </span>
                  <div
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: "bold",
                      color:
                        lowStockProducts.length > 0 ? "#F57C00" : "#2E7D32",
                      marginTop: "4px",
                    }}
                  >
                    {lowStockProducts.length}
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab("reviews")}
                  style={{
                    background: "#FFF",
                    padding: "1rem",
                    borderRadius: "10px",
                    border: "1px solid #EFEAE3",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", color: "#666" }}>
                    Pending Reviews
                  </span>
                  <div
                    style={{
                      fontSize: "1.6rem",
                      fontWeight: "bold",
                      color: "#1565C0",
                      marginTop: "4px",
                    }}
                  >
                    {pendingReviews.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Core Financial KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  background: "#FFF",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#666",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.85rem" }}>Delivered Revenue</span>
                  <DollarSign size={18} color="#2E7D32" />
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: "bold" }}>
                  {money(analyticsData.totalRevenue)}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    marginTop: "4px",
                  }}
                >
                  From {analyticsData.validOrdersCount} verified orders
                </div>
              </div>

              <div
                style={{
                  background: "#FFF",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#666",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.85rem" }}>
                    Estimated Product Margin
                  </span>
                  <TrendingUp size={18} color="#1565C0" />
                </div>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    color: "#2E7D32",
                  }}
                >
                  {analyticsData.costsKnown
                    ? money(analyticsData.grossProfit)
                    : "Costs not configured"}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#666",
                    marginTop: "4px",
                  }}
                >
                  Margin:{" "}
                  <strong>
                    {analyticsData.costsKnown
                      ? analyticsData.profitMargin.toFixed(1)
                      : "?"}
                    %
                  </strong>
                </div>
              </div>

              <div
                style={{
                  background: "#FFF",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#666",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.85rem" }}>
                    Cost of Goods Sold (COGS)
                  </span>
                  <Tag size={18} color="#8A5A2B" />
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: "bold" }}>
                  {money(analyticsData.totalCogs)}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    marginTop: "4px",
                  }}
                >
                  Based on private product cost prices
                </div>
              </div>

              <div
                style={{
                  background: "#FFF",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#666",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.85rem" }}>
                    Average Order Value (AOV)
                  </span>
                  <ShoppingBag size={18} color="#E65100" />
                </div>
                <div style={{ fontSize: "1.6rem", fontWeight: "bold" }}>
                  {money(analyticsData.aov)}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#888",
                    marginTop: "4px",
                  }}
                >
                  Units Sold: {analyticsData.totalUnitsSold}
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div
              style={{
                background: "#FFF",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                  Recent Orders Overview
                </h3>
                <button
                  className="button secondary small"
                  onClick={() => setActiveTab("orders")}
                >
                  View All Orders
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "0.9rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid #EFEAE3",
                        background: "#FAF8F5",
                      }}
                    >
                      <th style={{ padding: "0.75rem" }}>Order #</th>
                      <th style={{ padding: "0.75rem" }}>Customer</th>
                      <th style={{ padding: "0.75rem" }}>Amount</th>
                      <th style={{ padding: "0.75rem" }}>Method</th>
                      <th style={{ padding: "0.75rem" }}>Payment Status</th>
                      <th style={{ padding: "0.75rem" }}>Order Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr
                        key={order.id}
                        style={{ borderBottom: "1px solid #EFEAE3" }}
                      >
                        <td style={{ padding: "0.75rem", fontWeight: "bold" }}>
                          #{order.orderNumber}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {order.customer?.name}
                        </td>
                        <td style={{ padding: "0.75rem", fontWeight: "bold" }}>
                          {money(order.total)}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {order.paymentMethod === "cod"
                            ? "COD"
                            : "Manual Online"}
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              background:
                                order.paymentStatus === "verified"
                                  ? "#E8F5E9"
                                  : order.paymentStatus === "rejected"
                                    ? "#FFEBEE"
                                    : "#FFF3E0",
                              color:
                                order.paymentStatus === "verified"
                                  ? "#2E7D32"
                                  : order.paymentStatus === "rejected"
                                    ? "#C62828"
                                    : "#E65100",
                            }}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem" }}>
                          {order.orderStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS TAB (FULL CRUD & PRIVATE COSTS) */}
        {activeTab === "products" && (
          <div>
            {/* Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
                gap: "1rem",
                background: "#FFF",
                padding: "1rem",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flex: 1,
                  minWidth: "260px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#FAF8F5",
                    border: "1px solid #DDD",
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    flex: 1,
                  }}
                >
                  <Search size={16} color="#888" />
                  <input
                    placeholder="Search product name, SKU, category…"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    style={{
                      border: "none",
                      background: "transparent",
                      width: "100%",
                    }}
                  />
                </div>

                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid #DDD",
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="lowstock">Low Stock Warnings</option>
                  <option value="outofstock">Out of Stock</option>
                </select>
              </div>

              <button
                className="button small"
                onClick={() =>
                  setEditingProduct({
                    name: "",
                    subtitle: "",
                    category: "Cleansing essentials",
                    price: 850,
                    compareAt: 1100,
                    costPrice: 0,
                    active: true,
                  })
                }
              >
                <Plus size={16} /> Create Product
              </button>
            </div>

            {/* Product Table */}
            <div
              style={{
                background: "#FFF",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #EFEAE3",
                      background: "#FAF8F5",
                    }}
                  >
                    <th style={{ padding: "0.85rem" }}>Product</th>
                    <th style={{ padding: "0.85rem" }}>SKU / Category</th>
                    <th style={{ padding: "0.85rem" }}>Selling Price</th>
                    <th style={{ padding: "0.85rem" }}>Compare At</th>
                    <th style={{ padding: "0.85rem" }}>Private COGS</th>
                    <th style={{ padding: "0.85rem" }}>Unit Margin</th>
                    <th style={{ padding: "0.85rem" }}>Stock</th>
                    <th style={{ padding: "0.85rem" }}>Status</th>
                    <th style={{ padding: "0.85rem" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((prod) => {
                    const cogs =
                      productCosts[prod.id]?.costPrice ?? prod.costPrice ?? 0;
                    const unitMargin = prod.price - cogs;
                    const marginPct =
                      prod.price > 0
                        ? ((unitMargin / prod.price) * 100).toFixed(0)
                        : "0";
                    const stock = prod.variants.reduce(
                      (sum, variant) => sum + variant.stock,
                      0,
                    );
                    const isLow = prod.variants.some(
                      (v) => v.stock <= (prod.lowStockThreshold ?? 5),
                    );

                    return (
                      <tr
                        key={prod.id}
                        style={{
                          borderBottom: "1px solid #EFEAE3",
                          opacity: prod.active ? 1 : 0.6,
                        }}
                      >
                        <td style={{ padding: "0.85rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "6px",
                                objectFit: "cover",
                              }}
                            />
                            <div>
                              <strong style={{ display: "block" }}>
                                {prod.name}
                              </strong>
                              <span
                                style={{ fontSize: "0.75rem", color: "#666" }}
                              >
                                {prod.subtitle}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "0.85rem" }}>
                          <div style={{ fontWeight: 500 }}>
                            {prod.variants?.[0]?.sku || prod.id}
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "#888" }}>
                            {prod.category}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem", fontWeight: "bold" }}>
                          {money(prod.price)}
                        </td>
                        <td style={{ padding: "0.85rem", color: "#888" }}>
                          {prod.compareAt ? money(prod.compareAt) : "—"}
                        </td>
                        <td
                          style={{
                            padding: "0.85rem",
                            color: "#8A5A2B",
                            fontWeight: 500,
                          }}
                        >
                          {money(cogs)}
                        </td>
                        <td
                          style={{
                            padding: "0.85rem",
                            color: unitMargin >= 0 ? "#2E7D32" : "#C62828",
                            fontWeight: "bold",
                          }}
                        >
                          {money(unitMargin)} ({marginPct}%)
                        </td>
                        <td style={{ padding: "0.85rem" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              background:
                                stock === 0
                                  ? "#FFEBEE"
                                  : isLow
                                    ? "#FFF3E0"
                                    : "#E8F5E9",
                              color:
                                stock === 0
                                  ? "#C62828"
                                  : isLow
                                    ? "#E65100"
                                    : "#2E7D32",
                            }}
                          >
                            {stock} units
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                              color: prod.active ? "#2E7D32" : "#888",
                            }}
                          >
                            {prod.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ padding: "0.85rem" }}>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button
                              className="button secondary small"
                              onClick={() =>
                                setEditingProduct({ ...prod, costPrice: cogs })
                              }
                              title="Edit product"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="button secondary small"
                              onClick={() => handleDuplicateProduct(prod)}
                              title="Duplicate product"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              className="button secondary small"
                              style={{
                                color: prod.active ? "#C62828" : "#2E7D32",
                              }}
                              onClick={() => handleToggleProductActive(prod)}
                              title={prod.active ? "Deactivate" : "Activate"}
                            >
                              {prod.active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            {/* Order Filters */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                marginBottom: "1.5rem",
                background: "#FFF",
                padding: "1rem",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#FAF8F5",
                  border: "1px solid #DDD",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  flex: "1",
                  minWidth: "220px",
                }}
              >
                <Search size={16} color="#888" />
                <input
                  placeholder="Search order #, customer name, phone…"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    width: "100%",
                  }}
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #DDD",
                }}
              >
                <option value="all">All Order Statuses</option>
                <option value="pending">Pending</option>
                <option value="payment_verification">
                  Awaiting Verification
                </option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="payment_rejected">Payment Rejected</option>
              </select>

              <select
                value={orderPaymentFilter}
                onChange={(e) => setOrderPaymentFilter(e.target.value)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #DDD",
                }}
              >
                <option value="all">All Payment Methods</option>
                <option value="cod">Cash on Delivery</option>
                <option value="manual_online_payment">
                  Manual Online Payment
                </option>
                <option value="verified">Verified Payments</option>
                <option value="awaiting_verification">
                  Awaiting Verification
                </option>
              </select>
            </div>

            {/* Orders Cards List */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {filteredOrders.map((order) => {
                const waMessage = whatsappMessages.adminContactCustomer(
                  order.customer?.name || "Customer",
                  order.orderNumber,
                );
                const waUrl = buildWhatsAppUrl(
                  waMessage,
                  order.customer?.whatsapp || order.customer?.phone,
                );

                return (
                  <div
                    key={order.id}
                    style={{
                      background: "#FFF",
                      padding: "1.25rem",
                      borderRadius: "10px",
                      border: "1px solid #EFEAE3",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "1.1rem" }}>
                          Order #{order.orderNumber}
                        </strong>
                        <span
                          style={{
                            marginLeft: "1rem",
                            fontSize: "0.85rem",
                            color: "#666",
                          }}
                        >
                          {order.createdAt?.seconds
                            ? new Date(
                                order.createdAt.seconds * 1000,
                              ).toLocaleString()
                            : "Recent"}
                        </span>
                      </div>
                      <strong style={{ fontSize: "1.1rem" }}>
                        {money(order.total)}
                      </strong>
                    </div>

                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#444",
                        margin: "0.5rem 0",
                      }}
                    >
                      <strong>Customer:</strong> {order.customer?.name} (
                      {order.customer?.phone})
                      <br />
                      <strong>Address:</strong> {order.customer?.address},{" "}
                      {order.customer?.city}, {order.customer?.province}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        margin: "0.75rem 0",
                      }}
                    >
                      <span
                        style={{
                          background: "#FAF8F5",
                          border: "1px solid #EFEAE3",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                        }}
                      >
                        Method:{" "}
                        {order.paymentMethod === "cod"
                          ? "COD"
                          : "Manual Online"}
                      </span>
                      <span
                        style={{
                          background: "#FAF8F5",
                          border: "1px solid #EFEAE3",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                        }}
                      >
                        Payment Status: {order.paymentStatus}
                      </span>
                      <span
                        style={{
                          background: "#FAF8F5",
                          border: "1px solid #EFEAE3",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                        }}
                      >
                        Order Status: {order.orderStatus}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                        marginTop: "1rem",
                      }}
                    >
                      <button
                        className="button secondary small"
                        onClick={() => setInspectingOrder(order)}
                      >
                        <Eye size={14} /> Full Details
                      </button>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="button small"
                        style={{
                          background: "#25D366",
                          color: "#fff",
                          borderColor: "#25D366",
                        }}
                      >
                        <MessageCircle size={14} /> WhatsApp Customer
                      </a>

                      {order.orderStatus === "pending" && (
                        <button
                          className="button small"
                          onClick={() =>
                            handleStatusChange(order.id, "confirmed")
                          }
                        >
                          Confirm Order
                        </button>
                      )}

                      {order.orderStatus === "confirmed" && (
                        <button
                          className="button small"
                          onClick={() =>
                            handleStatusChange(order.id, "processing")
                          }
                        >
                          Mark Processing
                        </button>
                      )}

                      {order.orderStatus === "processing" && (
                        <button
                          className="button small"
                          onClick={() =>
                            handleStatusChange(order.id, "shipped")
                          }
                        >
                          Mark Shipped
                        </button>
                      )}

                      {order.orderStatus === "shipped" && (
                        <button
                          className="button small"
                          onClick={() =>
                            handleStatusChange(order.id, "delivered")
                          }
                        >
                          Mark Delivered
                        </button>
                      )}

                      {!["shipped", "delivered", "cancelled"].includes(
                        order.orderStatus,
                      ) && (
                        <button
                          className="button secondary small"
                          style={{ color: "#C62828" }}
                          onClick={() =>
                            handleStatusChange(order.id, "cancelled")
                          }
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. PAYMENTS QUEUE TAB */}
        {activeTab === "payments" && (
          <div>
            <p style={{ color: "#666", marginBottom: "1.5rem" }}>
              Review manual online payment orders (Bank Transfer / Easypaisa /
              JazzCash). Customers send proof on WhatsApp. Verify or reject
              below.
            </p>

            {paymentsAwaiting.length === 0 ? (
              <div
                className="empty"
                style={{
                  padding: "3rem",
                  background: "#FFF",
                  borderRadius: "12px",
                }}
              >
                <CheckCircle2 size={40} color="#2E7D32" />
                <h3>All payments verified!</h3>
                <p>No online payments are currently awaiting verification.</p>
              </div>
            ) : (
              <div
                style={{
                  background: "#FFF",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "0.9rem",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid #EFEAE3",
                        background: "#FAF8F5",
                      }}
                    >
                      <th style={{ padding: "0.85rem" }}>Order #</th>
                      <th style={{ padding: "0.85rem" }}>Customer</th>
                      <th style={{ padding: "0.85rem" }}>Phone / WhatsApp</th>
                      <th style={{ padding: "0.85rem" }}>Amount</th>
                      <th style={{ padding: "0.85rem" }}>Method</th>
                      <th style={{ padding: "0.85rem" }}>Date</th>
                      <th style={{ padding: "0.85rem" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentsAwaiting.map((order) => {
                      const waMessage = whatsappMessages.adminContactCustomer(
                        order.customer?.name || "Customer",
                        order.orderNumber,
                      );
                      const waUrl = buildWhatsAppUrl(
                        waMessage,
                        order.customer?.whatsapp || order.customer?.phone,
                      );

                      return (
                        <tr
                          key={order.id}
                          style={{ borderBottom: "1px solid #EFEAE3" }}
                        >
                          <td
                            style={{ padding: "0.85rem", fontWeight: "bold" }}
                          >
                            #{order.orderNumber}
                          </td>
                          <td style={{ padding: "0.85rem" }}>
                            {order.customer?.name}
                          </td>
                          <td style={{ padding: "0.85rem" }}>
                            {order.customer?.phone}
                          </td>
                          <td
                            style={{ padding: "0.85rem", fontWeight: "bold" }}
                          >
                            {money(order.total)}
                          </td>
                          <td style={{ padding: "0.85rem" }}>
                            {order.paymentMethod}
                          </td>
                          <td
                            style={{ padding: "0.85rem", fontSize: "0.85rem" }}
                          >
                            {order.createdAt?.seconds
                              ? new Date(
                                  order.createdAt.seconds * 1000,
                                ).toLocaleDateString()
                              : "New"}
                          </td>
                          <td style={{ padding: "0.85rem" }}>
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="button small"
                                style={{
                                  background: "#25D366",
                                  color: "#fff",
                                  borderColor: "#25D366",
                                }}
                              >
                                <MessageCircle size={14} /> WhatsApp
                              </a>
                              <button
                                className="button small"
                                style={{
                                  background: "#2E7D32",
                                  borderColor: "#2E7D32",
                                }}
                                onClick={() => setVerifyingOrder(order)}
                              >
                                VERIFY
                              </button>
                              <button
                                className="button secondary small"
                                style={{
                                  color: "#C62828",
                                  borderColor: "#C62828",
                                }}
                                onClick={() => setRejectingOrder(order)}
                              >
                                REJECT
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. CUSTOMERS TAB (CRM VIEW) */}
        {activeTab === "customers" && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
                gap: "1rem",
                background: "#FFF",
                padding: "1rem",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#FAF8F5",
                  border: "1px solid #DDD",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  flex: 1,
                }}
              >
                <Search size={16} color="#888" />
                <input
                  placeholder="Search customer name, email, phone…"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    width: "100%",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                background: "#FFF",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #EFEAE3",
                      background: "#FAF8F5",
                    }}
                  >
                    <th style={{ padding: "0.85rem" }}>Customer Name</th>
                    <th style={{ padding: "0.85rem" }}>Email</th>
                    <th style={{ padding: "0.85rem" }}>Phone</th>
                    <th style={{ padding: "0.85rem" }}>Total Orders</th>
                    <th style={{ padding: "0.85rem" }}>Total Spend</th>
                    <th style={{ padding: "0.85rem" }}>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust, idx) => {
                    const waUrl = buildWhatsAppUrl(
                      `Hi ${cust.displayName.split(" ")[0]}! This is Glam Skincare.`,
                      cust.whatsapp || cust.phone,
                    );

                    return (
                      <tr
                        key={cust.uid || idx}
                        style={{ borderBottom: "1px solid #EFEAE3" }}
                      >
                        <td style={{ padding: "0.85rem", fontWeight: "bold" }}>
                          {cust.displayName}
                        </td>
                        <td style={{ padding: "0.85rem" }}>{cust.email}</td>
                        <td style={{ padding: "0.85rem" }}>{cust.phone}</td>
                        <td style={{ padding: "0.85rem" }}>
                          {cust.orderCount} orders
                        </td>
                        <td
                          style={{
                            padding: "0.85rem",
                            fontWeight: "bold",
                            color: "#2E7D32",
                          }}
                        >
                          {money(cust.totalSpent)}
                        </td>
                        <td style={{ padding: "0.85rem" }}>
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="button small"
                            style={{
                              background: "#25D366",
                              color: "#fff",
                              borderColor: "#25D366",
                            }}
                          >
                            <MessageCircle size={14} /> WhatsApp
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. ANALYTICS & PROFIT TAB */}
        {activeTab === "analytics" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "1.25rem",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  background: "#FFF",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  Delivered Revenue
                </span>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    marginTop: "4px",
                  }}
                >
                  {money(analyticsData.totalRevenue)}
                </div>
              </div>
              <div
                style={{
                  background: "#FFF",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  Total COGS
                </span>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    marginTop: "4px",
                    color: "#8A5A2B",
                  }}
                >
                  {money(analyticsData.totalCogs)}
                </div>
              </div>
              <div
                style={{
                  background: "#FFF",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  Estimated Product Margin
                </span>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    marginTop: "4px",
                    color: "#2E7D32",
                  }}
                >
                  {analyticsData.costsKnown
                    ? money(analyticsData.grossProfit)
                    : "Costs not configured"}
                </div>
              </div>
              <div
                style={{
                  background: "#FFF",
                  padding: "1.25rem",
                  borderRadius: "12px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  Profit Margin %
                </span>
                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    marginTop: "4px",
                    color: "#1565C0",
                  }}
                >
                  {analyticsData.costsKnown
                    ? analyticsData.profitMargin.toFixed(1)
                    : "?"}
                  %
                </div>
              </div>
            </div>

            {/* Profit by Product Table */}
            <div
              style={{
                background: "#FFF",
                padding: "1.5rem",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              }}
            >
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem" }}>
                Product Profitability Performance
              </h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #EFEAE3",
                      background: "#FAF8F5",
                    }}
                  >
                    <th style={{ padding: "0.75rem" }}>Product Name</th>
                    <th style={{ padding: "0.75rem" }}>Units Sold</th>
                    <th style={{ padding: "0.75rem" }}>Delivered Revenue</th>
                    <th style={{ padding: "0.75rem" }}>Total COGS</th>
                    <th style={{ padding: "0.75rem" }}>
                      Estimated Product Margin
                    </th>
                    <th style={{ padding: "0.75rem" }}>Profit Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analyticsData.productStats).map(
                    ([id, stat]) => {
                      const profit = stat.revenue - stat.cogs;
                      const marginPct =
                        stat.revenue > 0
                          ? ((profit / stat.revenue) * 100).toFixed(1)
                          : "0.0";

                      return (
                        <tr
                          key={id}
                          style={{ borderBottom: "1px solid #EFEAE3" }}
                        >
                          <td
                            style={{ padding: "0.75rem", fontWeight: "bold" }}
                          >
                            {stat.name}
                          </td>
                          <td style={{ padding: "0.75rem" }}>{stat.units}</td>
                          <td
                            style={{ padding: "0.75rem", fontWeight: "bold" }}
                          >
                            {money(stat.revenue)}
                          </td>
                          <td style={{ padding: "0.75rem", color: "#8A5A2B" }}>
                            {money(stat.cogs)}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              fontWeight: "bold",
                              color: "#2E7D32",
                            }}
                          >
                            {money(profit)}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              fontWeight: "bold",
                              color: "#1565C0",
                            }}
                          >
                            {marginPct}%
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. REVIEWS MODERATION TAB */}
        {activeTab === "reviews" && (
          <div>
            <div
              style={{
                marginBottom: "1.5rem",
                background: "#FFF",
                padding: "1rem",
                borderRadius: "10px",
                display: "flex",
                gap: "1rem",
              }}
            >
              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #DDD",
                }}
              >
                <option value="all">All Reviews</option>
                <option value="pending">Pending Moderation</option>
                <option value="approved">Approved</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            {filteredReviews.length === 0 ? (
              <div
                className="empty"
                style={{
                  background: "#FFF",
                  borderRadius: "12px",
                  padding: "3rem",
                }}
              >
                No customer reviews matching criteria.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {filteredReviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      background: "#FFF",
                      padding: "1.25rem",
                      borderRadius: "10px",
                      border: "1px solid #EFEAE3",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div>
                        <strong>{rev.author}</strong> ({"★".repeat(rev.rating)})
                        {rev.verifiedPurchase && (
                          <span
                            style={{
                              marginLeft: "8px",
                              background: "#E8F5E9",
                              color: "#2E7D32",
                              fontSize: "0.75rem",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#888",
                          textTransform: "uppercase",
                        }}
                      >
                        {rev.status}
                      </span>
                    </div>
                    <p style={{ margin: "0.5rem 0" }}>{rev.body}</p>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginTop: "1rem",
                      }}
                    >
                      {rev.status !== "approved" && (
                        <button
                          className="button small"
                          onClick={() => handleReviewAction(rev.id, "approved")}
                        >
                          Approve
                        </button>
                      )}
                      {rev.status !== "hidden" && (
                        <button
                          className="button secondary small"
                          onClick={() => handleReviewAction(rev.id, "hidden")}
                        >
                          Hide
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 8. STORE SETTINGS TAB */}
        {activeTab === "settings" && !storeSettings && (
          <p role="status">Loading store settings?</p>
        )}
        {activeTab === "settings" && storeSettings && (
          <div
            style={{
              background: "#FFF",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <h2 style={{ marginBottom: "1.5rem" }}>
              Central Business Settings
            </h2>

            <form
              onSubmit={handleSaveSettings}
              style={{
                maxWidth: "600px",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <label className="field">
                Store Name
                <input
                  name="name"
                  defaultValue={storeSettings?.name || business.name}
                  required
                />
              </label>

              <label className="field">
                Tagline
                <input
                  name="tagline"
                  defaultValue={storeSettings?.tagline || business.tagline}
                  required
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <label className="field">
                  WhatsApp Digits (e.g. 923224729343)
                  <input
                    name="whatsapp"
                    defaultValue={storeSettings?.whatsapp || business.whatsapp}
                    required
                  />
                </label>
                <label className="field">
                  Instagram Handle
                  <input
                    name="instagram"
                    defaultValue={
                      storeSettings?.instagram || business.instagram
                    }
                    required
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <label className="field">
                  Shipping Fee (PKR)
                  <input
                    name="shippingFee"
                    type="number"
                    defaultValue={
                      storeSettings?.shipping.fee ?? business.shipping.fee
                    }
                    required
                  />
                </label>
                <label className="field">
                  Free Shipping Above (PKR)
                  <input
                    name="freeAbove"
                    type="number"
                    defaultValue={
                      storeSettings?.shipping.freeAbove ??
                      business.shipping.freeAbove
                    }
                    required
                  />
                </label>
              </div>

              <label className="field">
                Delivery Days Estimate
                <input
                  name="estimatedDays"
                  defaultValue={
                    storeSettings?.shipping.estimatedDays ||
                    business.shipping.estimatedDays
                  }
                  required
                />
              </label>

              <fieldset
                style={{
                  border: "1px solid #EFEAE3",
                  borderRadius: "8px",
                  padding: "1rem",
                  margin: "0.5rem 0",
                }}
              >
                <legend style={{ fontWeight: "bold", padding: "0 0.5rem" }}>
                  Bank & Wallet Instructions
                </legend>
                <label
                  className="checkbox-label"
                  style={{ marginBottom: "0.75rem" }}
                >
                  <input
                    name="bankEnabled"
                    type="checkbox"
                    defaultChecked={
                      storeSettings?.bank.enabled ?? business.bank.enabled
                    }
                  />
                  Enable Manual Online Payment (Bank Transfer / Wallet)
                </label>
                <label className="field">
                  Bank Name
                  <input
                    name="bankName"
                    defaultValue={
                      storeSettings?.bank.name || business.bank.name
                    }
                  />
                </label>
                <label className="field">
                  Account Title
                  <input
                    name="accountTitle"
                    defaultValue={
                      storeSettings?.bank.accountTitle ||
                      business.bank.accountTitle
                    }
                  />
                </label>
                <label className="field">
                  Account Number / IBAN
                  <input
                    name="accountNumber"
                    defaultValue={
                      storeSettings?.bank.accountNumber ??
                      business.bank.accountNumber
                    }
                  />
                </label>
                <label className="field">
                  Easypaisa / JazzCash Wallet Details
                  <input
                    name="wallet"
                    defaultValue={
                      storeSettings?.bank.wallet ?? business.bank.wallet
                    }
                  />
                </label>
              </fieldset>

              <button
                type="submit"
                className="button"
                disabled={actionSubmitting}
              >
                {actionSubmitting
                  ? "Saving Settings..."
                  : "Save Store Settings"}
              </button>
            </form>
          </div>
        )}

        {/* 9. VARIANT-LEVEL INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div
            style={{
              background: "#FFF",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
                <h2 style={{ margin: 0, fontFamily: "Georgia, serif" }}>
                  Variant Inventory Control
                </h2>
                <p
                  style={{
                    color: "#666",
                    fontSize: "0.875rem",
                    margin: "4px 0 0 0",
                  }}
                >
                  Manage stock levels per variant (e.g. Blush Pink, Soft White)
                  in real time across the store.
                </p>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.9rem",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #EFEAE3",
                      background: "#FAF8F5",
                    }}
                  >
                    <th style={{ padding: "0.75rem" }}>Product & Variant</th>
                    <th style={{ padding: "0.75rem" }}>SKU</th>
                    <th style={{ padding: "0.75rem" }}>Color Swatch</th>
                    <th style={{ padding: "0.75rem" }}>Current Stock</th>
                    <th style={{ padding: "0.75rem" }}>Stock Status</th>
                    <th style={{ padding: "0.75rem" }}>Quick Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {productsList.flatMap((p) =>
                    (p.variants || []).map((v) => {
                      const isLow = v.stock <= (p.lowStockThreshold ?? 5);
                      const isOut = v.stock === 0;

                      return (
                        <tr
                          key={`${p.id}-${v.id}`}
                          style={{ borderBottom: "1px solid #EFEAE3" }}
                        >
                          <td style={{ padding: "0.75rem" }}>
                            <strong
                              style={{ color: "#302E2A", display: "block" }}
                            >
                              {p.name}
                            </strong>
                            <span
                              style={{ fontSize: "0.8rem", color: "#685F57" }}
                            >
                              {v.name}
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              fontFamily: "monospace",
                              fontSize: "0.85rem",
                            }}
                          >
                            {v.sku}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <span
                              style={{
                                display: "inline-block",
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                backgroundColor: v.color || "#CCC",
                                border: "1px solid #CCC",
                              }}
                            />
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              fontWeight: "bold",
                              fontSize: "1.05rem",
                            }}
                          >
                            {v.stock}
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <span
                              style={{
                                padding: "3px 10px",
                                borderRadius: "12px",
                                fontSize: "0.75rem",
                                fontWeight: "bold",
                                background: isOut
                                  ? "#FFEBEE"
                                  : isLow
                                    ? "#FFF3E0"
                                    : "#E8F5E9",
                                color: isOut
                                  ? "#C62828"
                                  : isLow
                                    ? "#E65100"
                                    : "#2E7D32",
                              }}
                            >
                              {isOut
                                ? "OUT OF STOCK"
                                : isLow
                                  ? "LOW STOCK"
                                  : "IN STOCK"}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                              <button
                                className="button secondary small"
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "0.8rem",
                                }}
                                onClick={() =>
                                  handleUpdateVariantStock(
                                    p.id,
                                    v.id,
                                    v.stock,
                                    -5,
                                  )
                                }
                              >
                                -5
                              </button>
                              <button
                                className="button secondary small"
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "0.8rem",
                                }}
                                onClick={() =>
                                  handleUpdateVariantStock(
                                    p.id,
                                    v.id,
                                    v.stock,
                                    -1,
                                  )
                                }
                              >
                                -1
                              </button>
                              <button
                                className="button small"
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "0.8rem",
                                }}
                                onClick={() =>
                                  handleUpdateVariantStock(
                                    p.id,
                                    v.id,
                                    v.stock,
                                    +1,
                                  )
                                }
                              >
                                +1
                              </button>
                              <button
                                className="button small"
                                style={{
                                  padding: "2px 8px",
                                  fontSize: "0.8rem",
                                }}
                                onClick={() =>
                                  handleUpdateVariantStock(
                                    p.id,
                                    v.id,
                                    v.stock,
                                    +5,
                                  )
                                }
                              >
                                +5
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 10. ADMIN PROFILE TAB */}
        {activeTab === "profile" && (
          <div
            style={{
              background: "#FFF",
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              maxWidth: "650px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#35342F",
                  color: "#E0C097",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                {(
                  profile?.displayName ||
                  user?.displayName ||
                  user?.email ||
                  "A"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0, fontFamily: "Georgia, serif" }}>
                  {profile?.displayName ||
                    user?.displayName ||
                    "Executive Administrator"}
                </h2>
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  {user?.email}
                </span>
              </div>
            </div>

            <div
              style={{
                background: "#FAF8F5",
                border: "1px solid #EFEAE3",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#2E7D32",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                }}
              >
                <ShieldCheck size={18} /> Account Role: Store Administrator
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#666",
                  margin: "4px 0 0 0",
                }}
              >
                Authenticated Executive Session. User UID: {user?.uid}
              </p>
            </div>

            <form
              onSubmit={handleSaveAdminProfile}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <label className="field">
                Admin Full Name
                <input
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                Admin Phone Number
                <input
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  required
                />
              </label>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="button"
                  disabled={actionSubmitting}
                >
                  {actionSubmitting ? "Saving..." : "Save Profile Details"}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={handleSignOut}
                >
                  Sign Out of Portal
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* EDIT/CREATE PRODUCT MODAL */}
      {editingProduct && (
        <Modal
          title={editingProduct.id ? "Edit Product" : "Create New Product"}
          onClose={() => setEditingProduct(null)}
        >
          <form
            onSubmit={handleSaveProduct}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              maxHeight: "75vh",
              overflowY: "auto",
            }}
          >
            <label className="field">
              Product Name
              <input
                value={editingProduct.name || ""}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, name: e.target.value })
                }
                required
              />
            </label>
            <label className="field">
              Subtitle
              <input
                value={editingProduct.subtitle || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    subtitle: e.target.value,
                  })
                }
                required
              />
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <label className="field">
                Selling Price (PKR)
                <input
                  type="number"
                  value={editingProduct.price ?? 850}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: Number(e.target.value),
                    })
                  }
                  required
                />
              </label>
              <label className="field">
                Compare At Price (PKR)
                <input
                  type="number"
                  value={editingProduct.compareAt ?? 0}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      compareAt: Number(e.target.value),
                    })
                  }
                  required
                />
              </label>
              <label className="field">
                Private COGS (PKR)
                <input
                  type="number"
                  value={editingProduct.costPrice ?? 0}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      costPrice: Number(e.target.value),
                    })
                  }
                  required
                />
              </label>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <div>
                {(editingProduct.variants || []).map((variant, index) => (
                  <label className="field" key={variant.id}>
                    {variant.name} stock
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={variant.stock}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          variants: editingProduct.variants?.map((v, i) =>
                            i === index
                              ? { ...v, stock: Number(e.target.value) }
                              : v,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                {!editingProduct.variants?.length && (
                  <p>
                    New products start with Pink and White variants. Adjust each
                    in Inventory after creating.
                  </p>
                )}
              </div>
              <label className="field">
                Category
                <input
                  value={editingProduct.category || "Cleansing essentials"}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: e.target.value,
                    })
                  }
                  required
                />
              </label>
            </div>

            <label className="field">
              Description
              <textarea
                rows={3}
                value={editingProduct.description || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct,
                    description: e.target.value,
                  })
                }
                required
              />
            </label>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                marginTop: "1rem",
              }}
            >
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditingProduct(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button"
                disabled={actionSubmitting}
              >
                {actionSubmitting ? "Saving..." : "Save Product"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* INSPECT ORDER MODAL */}
      {inspectingOrder && (
        <Modal
          title={`Order Details #${inspectingOrder.orderNumber}`}
          onClose={() => setInspectingOrder(null)}
        >
          <div style={{ fontSize: "0.925rem", lineHeight: "1.6" }}>
            <p>
              <strong>Customer Name:</strong> {inspectingOrder.customer?.name}
            </p>
            <p>
              <strong>Email:</strong> {inspectingOrder.customer?.email}
            </p>
            <p>
              <strong>Phone:</strong> {inspectingOrder.customer?.phone}
            </p>
            <p>
              <strong>Address:</strong> {inspectingOrder.customer?.address},{" "}
              {inspectingOrder.customer?.area}, {inspectingOrder.customer?.city}
              , {inspectingOrder.customer?.province}
            </p>
            <p>
              <strong>Payment Method:</strong>{" "}
              {inspectingOrder.paymentMethod === "cod"
                ? "Cash on Delivery"
                : "Manual Online Payment"}
            </p>
            <p>
              <strong>Payment Status:</strong> {inspectingOrder.paymentStatus}
            </p>
            <p>
              <strong>Order Status:</strong> {inspectingOrder.orderStatus}
            </p>

            <h4 style={{ marginTop: "1rem" }}>Items Ordered</h4>
            <ul>
              {inspectingOrder.items.map((item, idx) => (
                <li key={idx}>
                  {item.name} ({item.variantName}) — Qty {item.quantity} x{" "}
                  {money(item.unitPrice)} = {money(item.lineTotal)}
                </li>
              ))}
            </ul>
            <p style={{ fontWeight: "bold" }}>
              Total Amount: {money(inspectingOrder.total)}
            </p>

            {inspectingOrder.history?.length > 0 && (
              <div
                style={{
                  marginTop: "1rem",
                  borderTop: "1px solid #EFEAE3",
                  paddingTop: "0.75rem",
                }}
              >
                <h4>Audit History</h4>
                <ul style={{ paddingLeft: "1.25rem", fontSize: "0.85rem" }}>
                  {inspectingOrder.history.map((h, i) => (
                    <li key={i}>
                      {h.message} ({h.status})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* VERIFY PAYMENT MODAL */}
      {verifyingOrder && (
        <Modal
          title="Confirm Payment Verification"
          onClose={() => setVerifyingOrder(null)}
        >
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem" }}>
              Have you manually verified this customer's payment on WhatsApp or
              Bank Statement?
              <br />
              <strong style={{ display: "block", marginTop: "0.5rem" }}>
                Order #{verifyingOrder.orderNumber} —{" "}
                {money(verifyingOrder.total)}
              </strong>
            </p>

            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button
                className="button secondary"
                onClick={() => setVerifyingOrder(null)}
                disabled={actionSubmitting}
              >
                Cancel
              </button>
              <button
                className="button"
                style={{ background: "#2E7D32", borderColor: "#2E7D32" }}
                onClick={handleVerifyPayment}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? "Verifying..." : "Yes, Verify Payment"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* REJECT PAYMENT MODAL */}
      {rejectingOrder && (
        <Modal title="Reject Payment" onClose={() => setRejectingOrder(null)}>
          <div style={{ padding: "0.5rem 0" }}>
            <p style={{ marginBottom: "1rem" }}>
              Select a reason for rejecting payment for order{" "}
              <strong>#{rejectingOrder.orderNumber}</strong>:
            </p>

            <label className="field">
              Rejection Reason
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              >
                <option value="Payment not received">
                  Payment not received
                </option>
                <option value="Incorrect amount">Incorrect amount</option>
                <option value="Unable to verify transaction">
                  Unable to verify transaction
                </option>
                <option value="Other">Other</option>
              </select>
            </label>

            {rejectionReason === "Other" && (
              <label className="field" style={{ marginTop: "0.75rem" }}>
                Custom Reason
                <input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter details..."
                  required
                />
              </label>
            )}

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                marginTop: "1.5rem",
              }}
            >
              <button
                type="button"
                className="button secondary"
                onClick={() => setRejectingOrder(null)}
                disabled={actionSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button"
                style={{ background: "#C62828", borderColor: "#C62828" }}
                onClick={handleRejectPayment}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
