import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  Truck,
  MessageCircle,
  Search,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { firebase } from "../services/firebase";
import { watchOrders, updateOrder } from "../services/orders";
import { money, buildWhatsAppUrl, whatsappMessages } from "../config/business";
import { Eyebrow, Modal } from "../components/ui";
import type { ShopOrder, OrderStatus, StoreProduct, ModeratedReview } from "../domain/models";
import { collection, onSnapshot, query, doc, updateDoc } from "firebase/firestore";
import { products as seedProducts } from "../data/catalog";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "payments" | "products" | "reviews">("dashboard");
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [reviews, setReviews] = useState<ModeratedReview[]>([]);
  const [productsList, setProductsList] = useState<StoreProduct[]>([]);

  // Verification & Rejection Modals state
  const [verifyingOrder, setVerifyingOrder] = useState<ShopOrder | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<ShopOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("Payment not received");
  const [customReason, setCustomReason] = useState<string>("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!firebase) {
      return;
    }

    const unsubOrders = watchOrders(null, (fetchedOrders) => {
      setOrders(fetchedOrders);
    }, () => {});

    const unsubReviews = onSnapshot(query(collection(firebase.db, "reviews")), (snap) => {
      setReviews(snap.docs.map((d) => ({ ...d.data(), id: d.id } as ModeratedReview)));
    });

    const unsubProducts = onSnapshot(query(collection(firebase.db, "products")), (snap) => {
      if (!snap.empty) {
        setProductsList(snap.docs.map((d) => ({ ...d.data(), id: d.id } as StoreProduct)));
      }
    });

    return () => {
      unsubOrders();
      unsubReviews();
      unsubProducts();
    };
  }, []);

  // Compute Notification Badges & Stats
  const paymentsAwaiting = orders.filter((o) => o.paymentMethod === "manual_online_payment" && (o.paymentStatus === "awaiting_verification" || o.orderStatus === "payment_verification"));
  const newOrders = orders.filter((o) => o.orderStatus === "pending" || o.orderStatus === "payment_verification");
  const lowStockCount = (productsList.length ? productsList : (seedProducts as unknown as StoreProduct[])).filter((p) => (p.variants?.[0]?.stock || 0) <= (p.lowStockThreshold || 5)).length;
  const pendingReviews = reviews.filter((r) => r.status === "pending");

  const totalRevenue = orders.filter((o) => o.orderStatus === "delivered" || o.paymentStatus === "verified").reduce((sum, o) => sum + o.total, 0);

  // Order Actions
  async function handleVerifyPayment() {
    if (!verifyingOrder) return;
    setActionSubmitting(true);
    try {
      if (firebase) {
        await updateOrder(verifyingOrder.id, "verify");
      } else {
        // Fallback for dev mode
        setOrders((prev) =>
          prev.map((o) =>
            o.id === verifyingOrder.id
              ? { ...o, paymentStatus: "verified", orderStatus: "confirmed" }
              : o
          )
        );
      }
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
      } else {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === rejectingOrder.id
              ? { ...o, paymentStatus: "rejected", orderStatus: "payment_rejected", rejectionReason: reason }
              : o
          )
        );
      }
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
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: nextStatus } : o))
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Status update failed.");
    }
  }

  async function handleReviewAction(reviewId: string, status: "approved" | "hidden") {
    if (!firebase) return;
    await updateDoc(doc(firebase.db, "reviews", reviewId), { status });
  }

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer?.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || o.orderStatus === statusFilter || o.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <section className="container page-space admin-dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <Eyebrow>STORE ADMINISTRATION</Eyebrow>
          <h1>Glam Skincare Admin</h1>
        </div>
        <Link to="/account" className="button secondary small">
          Customer Portal
        </Link>
      </div>

      {/* Admin Navigation Header with Notification Badges */}
      <nav className="admin-tabs" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem', borderBottom: '1px solid #EFEAE3', paddingBottom: '0.75rem' }}>
        <button
          className={`button small ${activeTab === 'dashboard' ? '' : 'secondary'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>

        <button
          className={`button small ${activeTab === 'orders' ? '' : 'secondary'}`}
          onClick={() => setActiveTab('orders')}
          style={{ position: 'relative' }}
        >
          Orders
          {newOrders.length > 0 && (
            <span style={{ background: '#E65100', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', marginLeft: '6px' }}>
              {newOrders.length}
            </span>
          )}
        </button>

        <button
          className={`button small ${activeTab === 'payments' ? '' : 'secondary'}`}
          onClick={() => setActiveTab('payments')}
          style={{ position: 'relative' }}
        >
          Payments Queue
          {paymentsAwaiting.length > 0 && (
            <span style={{ background: '#C62828', color: '#fff', fontSize: '0.75rem', padding: '2px 7px', borderRadius: '10px', marginLeft: '6px', fontWeight: 'bold' }}>
              {paymentsAwaiting.length}
            </span>
          )}
        </button>

        <button
          className={`button small ${activeTab === 'products' ? '' : 'secondary'}`}
          onClick={() => setActiveTab('products')}
        >
          Products
          {lowStockCount > 0 && (
            <span style={{ background: '#F57C00', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', marginLeft: '6px' }}>
              {lowStockCount} low
            </span>
          )}
        </button>

        <button
          className={`button small ${activeTab === 'reviews' ? '' : 'secondary'}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
          {pendingReviews.length > 0 && (
            <span style={{ background: '#1565C0', color: '#fff', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '10px', marginLeft: '6px' }}>
              {pendingReviews.length}
            </span>
          )}
        </button>
      </nav>

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Notification Center */}
          <div style={{ background: '#FFFDF9', border: '1px solid #E0C097', padding: '1.25rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#8A5A2B" /> In-App Notification Center
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#FFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #EFEAE3' }}>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>Payments Awaiting Verification</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: paymentsAwaiting.length > 0 ? '#C62828' : '#2E7D32' }}>
                  {paymentsAwaiting.length}
                </div>
              </div>
              <div style={{ background: '#FFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #EFEAE3' }}>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>New Orders</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E65100' }}>
                  {newOrders.length}
                </div>
              </div>
              <div style={{ background: '#FFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #EFEAE3' }}>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>Low Stock Items</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: lowStockCount > 0 ? '#F57C00' : '#2E7D32' }}>
                  {lowStockCount}
                </div>
              </div>
              <div style={{ background: '#FFF', padding: '0.75rem', borderRadius: '8px', border: '1px solid #EFEAE3' }}>
                <span style={{ fontSize: '0.85rem', color: '#666' }}>Reviews Pending Moderation</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1565C0' }}>
                  {pendingReviews.length}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="account-card" style={{ padding: '1rem' }}>
              <Package size={22} />
              <h4>Total Orders</h4>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>{orders.length}</p>
            </div>
            <div className="account-card" style={{ padding: '1rem' }}>
              <DollarSign size={22} />
              <h4>Total Revenue</h4>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>{money(totalRevenue)}</p>
            </div>
            <div className="account-card" style={{ padding: '1rem' }}>
              <CheckCircle2 size={22} />
              <h4>Confirmed Orders</h4>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>
                {orders.filter((o) => o.orderStatus === 'confirmed').length}
              </p>
            </div>
            <div className="account-card" style={{ padding: '1rem' }}>
              <Truck size={22} />
              <h4>Shipped / Delivered</h4>
              <p style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>
                {orders.filter((o) => ['shipped', 'delivered'].includes(o.orderStatus)).length}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENTS QUEUE TAB */}
      {activeTab === 'payments' && (
        <div>
          <h2>Payment Verification Queue</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Review manual online payment orders (Bank Transfer / Easypaisa / JazzCash). Customers send proof on WhatsApp. Verify or reject below.
          </p>

          {paymentsAwaiting.length === 0 ? (
            <div className="empty" style={{ padding: '2rem' }}>
              <CheckCircle2 size={32} color="#2E7D32" />
              <h3>All caught up!</h3>
              <p>No payments are currently awaiting verification.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #EFEAE3', background: '#FAF8F5' }}>
                    <th style={{ padding: '0.75rem' }}>Order #</th>
                    <th style={{ padding: '0.75rem' }}>Customer</th>
                    <th style={{ padding: '0.75rem' }}>Phone / WhatsApp</th>
                    <th style={{ padding: '0.75rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem' }}>Method</th>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                    <th style={{ padding: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsAwaiting.map((order) => {
                    const waMessage = whatsappMessages.adminContactCustomer(order.customer?.name || 'Customer', order.orderNumber);
                    const waUrl = buildWhatsAppUrl(waMessage, order.customer?.whatsapp || order.customer?.phone);

                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid #EFEAE3' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>#{order.orderNumber}</td>
                        <td style={{ padding: '0.75rem' }}>{order.customer?.name}</td>
                        <td style={{ padding: '0.75rem' }}>{order.customer?.phone}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{money(order.total)}</td>
                        <td style={{ padding: '0.75rem' }}>{order.paymentMethod}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                          {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'New'}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="button small"
                              style={{ background: '#25D366', color: '#fff', borderColor: '#25D366' }}
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle size={14} /> WhatsApp
                            </a>
                            <button
                              className="button small"
                              style={{ background: '#2E7D32', color: '#fff', borderColor: '#2E7D32' }}
                              onClick={() => setVerifyingOrder(order)}
                            >
                              VERIFY PAYMENT
                            </button>
                            <button
                              className="button secondary small"
                              style={{ color: '#C62828', borderColor: '#C62828' }}
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

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div>
          <h2>All Orders</h2>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: '#FAF8F5', padding: '1rem', borderRadius: '8px' }}>
            <div className="search-field" style={{ flex: '1', minWidth: '220px' }}>
              <Search size={18} />
              <input
                placeholder="Search order #, customer name, phone…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #DDD' }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="payment_verification">Awaiting Verification</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="payment_rejected">Payment Rejected</option>
            </select>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="empty">No orders matching your criteria.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredOrders.map((order) => {
                const waMessage = whatsappMessages.adminContactCustomer(order.customer?.name || 'Customer', order.orderNumber);
                const waUrl = buildWhatsAppUrl(waMessage, order.customer?.whatsapp || order.customer?.phone);

                return (
                  <div
                    key={order.id}
                    style={{
                      border: '1px solid #EFEAE3',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      background: '#FFF',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '1.15rem' }}>Order #{order.orderNumber}</strong>
                        <span style={{ marginLeft: '1rem', fontSize: '0.85rem', color: '#666' }}>
                          {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'Recent'}
                        </span>
                      </div>
                      <strong>{money(order.total)}</strong>
                    </div>

                    <div style={{ margin: '0.75rem 0', fontSize: '0.925rem' }}>
                      <strong>Customer:</strong> {order.customer?.name} ({order.customer?.phone})
                      <br />
                      <strong>Address:</strong> {order.customer?.address}, {order.customer?.city}, {order.customer?.province}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                      <span className="quiet-badge" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                        Method: {order.paymentMethod === 'cod' ? 'COD' : 'Manual Online Payment'}
                      </span>
                      <span className="quiet-badge" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                        Payment Status: {order.paymentStatus}
                      </span>
                      <span className="quiet-badge" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                        Order Status: {order.orderStatus}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="button small"
                        style={{ background: '#25D366', color: '#fff', borderColor: '#25D366' }}
                      >
                        <MessageCircle size={14} /> Contact Customer on WhatsApp
                      </a>

                      {order.orderStatus === 'pending' && (
                        <button className="button small" onClick={() => handleStatusChange(order.id, 'confirmed')}>
                          Confirm Order
                        </button>
                      )}

                      {order.orderStatus === 'confirmed' && (
                        <button className="button small" onClick={() => handleStatusChange(order.id, 'processing')}>
                          Mark Processing
                        </button>
                      )}

                      {order.orderStatus === 'processing' && (
                        <button className="button small" onClick={() => handleStatusChange(order.id, 'shipped')}>
                          Mark Shipped
                        </button>
                      )}

                      {order.orderStatus === 'shipped' && (
                        <button className="button small" onClick={() => handleStatusChange(order.id, 'delivered')}>
                          Mark Delivered
                        </button>
                      )}

                      {!['delivered', 'cancelled'].includes(order.orderStatus) && (
                        <button className="button secondary small" style={{ color: '#C62828' }} onClick={() => handleStatusChange(order.id, 'cancelled')}>
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div>
          <h2>Product Inventory Management</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Manage catalog items, prices, and stock levels. Free-first architecture uses static/local image references.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {(productsList.length ? productsList : seedProducts).map((prod) => (
              <div key={prod.id} className="account-card" style={{ padding: '1.25rem' }}>
                <img src={prod.images[0]} alt={prod.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.75rem' }} />
                <h3>{prod.name}</h3>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>{prod.subtitle}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0', fontWeight: 'bold' }}>
                  <span>Price: {money(prod.price)}</span>
                  <span>Stock: {prod.variants?.[0]?.stock ?? 25}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REVIEWS TAB */}
      {activeTab === 'reviews' && (
        <div>
          <h2>Customer Reviews Moderation</h2>
          {reviews.length === 0 ? (
            <div className="empty">No customer reviews submitted yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((rev) => (
                <div key={rev.id} className="account-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{rev.author} ({'★'.repeat(rev.rating)})</strong>
                    <span className="quiet-badge">{rev.status}</span>
                  </div>
                  <p style={{ margin: '0.5rem 0' }}>{rev.body}</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {rev.status !== 'approved' && (
                      <button className="button small" onClick={() => handleReviewAction(rev.id, 'approved')}>
                        Approve
                      </button>
                    )}
                    {rev.status !== 'hidden' && (
                      <button className="button secondary small" onClick={() => handleReviewAction(rev.id, 'hidden')}>
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

      {/* VERIFY PAYMENT CONFIRMATION MODAL */}
      {verifyingOrder && (
        <Modal title="Confirm Payment Verification" onClose={() => setVerifyingOrder(null)}>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Have you manually verified this customer's payment on WhatsApp or Bank Statement?
              <br />
              <strong style={{ display: 'block', marginTop: '0.5rem' }}>
                Order #{verifyingOrder.orderNumber} — {money(verifyingOrder.total)}
              </strong>
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                className="button secondary"
                onClick={() => setVerifyingOrder(null)}
                disabled={actionSubmitting}
              >
                Cancel
              </button>
              <button
                className="button"
                style={{ background: '#2E7D32', borderColor: '#2E7D32' }}
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
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ marginBottom: '1rem' }}>
              Select a reason for rejecting payment for order <strong>#{rejectingOrder.orderNumber}</strong>:
            </p>

            <label className="field">
              Rejection Reason
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              >
                <option value="Payment not received">Payment not received</option>
                <option value="Incorrect amount">Incorrect amount</option>
                <option value="Unable to verify transaction">Unable to verify transaction</option>
                <option value="Other">Other</option>
              </select>
            </label>

            {rejectionReason === "Other" && (
              <label className="field" style={{ marginTop: '0.75rem' }}>
                Custom Reason
                <input
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter details..."
                  required
                />
              </label>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
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
                style={{ background: '#C62828', borderColor: '#C62828' }}
                onClick={handleRejectPayment}
                disabled={actionSubmitting}
              >
                {actionSubmitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
