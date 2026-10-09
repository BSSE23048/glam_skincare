import { useState } from "react";
import { Search, ShieldAlert } from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { firebase } from "../services/firebase";
import { money } from "../config/business";
import type { ShopOrder } from "../domain/models";

export function OrderTrackerModal({ onClose }: { onClose: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      if (!firebase?.db) {
        setError("Order tracking is currently initializing. Please try again in a moment.");
        setLoading(false);
        return;
      }

      // Try searching by Order ID (e.g. GS-1001)
      let docRef = doc(firebase.db, "orders", term);
      let snap = await getDoc(docRef);

      if (!snap.exists() && !term.startsWith("GS-")) {
        docRef = doc(firebase.db, "orders", `GS-${term}`);
        snap = await getDoc(docRef);
      }

      if (snap.exists()) {
        setOrder(snap.data() as ShopOrder);
      } else {
        // Query by phone number fallback
        const q = query(collection(firebase.db, "orders"), where("customer.phone", "==", term));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          setOrder(qSnap.docs[0].data() as ShopOrder);
        } else {
          setError(`No order found matching "${term}". Please verify your Order ID (e.g. GS-1001) or mobile number.`);
        }
      }
    } catch {
      setError("Could not retrieve order details. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(26, 25, 23, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FAF8F5",
          color: "#302E2A",
          width: "100%",
          maxWidth: "520px",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          fontFamily: "DM Sans, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.35rem", color: "#302E2A" }}>
            Track Your Skincare Order
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#685F57",
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <input
            type="text"
            placeholder="Enter Order # (e.g. GS-1001) or Phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid #D8D0C5",
              fontSize: "0.95rem",
              background: "#FFF",
            }}
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#35352E",
              color: "#FFF",
              border: "none",
              padding: "0.75rem 1.25rem",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Search size={16} />
            {loading ? "Searching..." : "Track"}
          </button>
        </form>

        {error && (
          <div
            style={{
              padding: "1rem",
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
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {order && (
          <div style={{ background: "#FFF", border: "1px solid #EFEAE3", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ fontWeight: 700, color: "#302E2A" }}>Order #{order.id}</span>
              <span
                style={{
                  background: order.paymentStatus === "verified" ? "#E8F5E9" : "#FFF3E0",
                  color: order.paymentStatus === "verified" ? "#2E7D32" : "#E65100",
                  padding: "0.25rem 0.6rem",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                {order.paymentStatus === "verified" ? "Payment Verified" : order.paymentStatus === "rejected" ? "Verification Action Required" : "Awaiting Verification"}
              </span>
            </div>

            <p style={{ fontSize: "0.875rem", color: "#685F57", marginBottom: "0.75rem" }}>
              Customer: <strong>{order.customer.name}</strong> ({order.customer.city})
            </p>

            <div style={{ borderTop: "1px solid #EFEAE3", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
              <p style={{ fontSize: "0.85rem", color: "#685F57", display: "flex", justifyContent: "space-between" }}>
                <span>Total Amount:</span>
                <strong style={{ color: "#302E2A" }}>{money(order.total)}</strong>
              </p>
              <p style={{ fontSize: "0.85rem", color: "#685F57", display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
                <span>Delivery Method:</span>
                <span>{order.paymentMethod === "cod" ? "Cash on Delivery" : "Manual Bank Transfer"}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
