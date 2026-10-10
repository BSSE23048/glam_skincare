import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { firebase } from "../services/firebase";
import { business } from "../config/business";
import { products as seedProducts, faqs } from "../data/catalog";
import type { Product } from "../types";
import type {
  SiteContent,
  StoreSettings,
  StoreProduct,
  SkuRecord,
  ModeratedReview,
} from "../domain/models";

export const defaultContent: SiteContent = {
  announcement: "A little water. A little care. A whole new ritual.",
  heroEyebrow: "LESS EFFORT. MORE YOU.",
  heroTitle: "Goodbye makeup.",
  heroAccent: "Hello, soft skin.",
  heroDescription:
    "A little warm water. One beautifully soft pad. Meet the everyday essential that makes taking it all off feel like a little act of self-care.",
  faqs,
};

interface SiteState {
  products: Product[];
  settings: StoreSettings;
  content: SiteContent;
  approvedReviews: ModeratedReview[];
  loading: boolean;
  error: string;
}

const Context = createContext<SiteState>({
  products: seedProducts,
  settings: business,
  content: defaultContent,
  approvedReviews: [],
  loading: false,
  error: "",
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(
    firebase ? [] : seedProducts,
  );
  const [settings, setSettings] = useState<StoreSettings>(business);
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [approvedReviews, setApprovedReviews] = useState<ModeratedReview[]>([]);
  const [loading, setLoading] = useState(Boolean(firebase));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!firebase) return;
    const db = firebase.db;
    let catalog: StoreProduct[] = [];
    let skus: SkuRecord[] = [];
    let catalogReady = false;
    let skusReady = false;

    const merge = () => {
      if (!catalogReady || !skusReady) return;
      if (catalog.length === 0) {
        setProducts([]);
      } else {
        const merged: Product[] = catalog.map((p) => ({
          ...p,
          variants: (p.variants || []).map((v) => {
            const skuMatch = skus.find(
              (s) =>
                s.productId === p.id &&
                (s.variantId === v.id || s.sku === v.sku || s.id === v.sku),
            );
            return {
              ...v,
              stock: skuMatch?.active ? skuMatch.stock : 0,
              active: Boolean(skuMatch?.active),
              priceOverride: skuMatch?.price ?? p.price,
            };
          }),
        })) as unknown as Product[];
        setProducts(merged);
      }
      setLoading(false);
    };

    const fail = (err: unknown) => {
      console.warn("Live catalog snapshot warning:", err);
      setError("Live catalog warning");
      setProducts([]);
      setLoading(false);
    };

    const contentFail = () =>
      setError("Some store information could not load. Please refresh.");
    const listeners = [
      onSnapshot(
        query(collection(db, "products"), where("active", "==", true)),
        (snap) => {
          catalog = snap.docs.map(
            (d) => ({ ...d.data(), id: d.id }) as StoreProduct,
          );
          catalogReady = true;
          merge();
        },
        fail,
      ),
      onSnapshot(
        query(collection(db, "skus"), where("active", "==", true)),
        (snap) => {
          skus = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as SkuRecord);
          skusReady = true;
          merge();
        },
        fail,
      ),
      onSnapshot(
        doc(db, "settings", "store"),
        (snap) => {
          if (snap.exists())
            setSettings({ ...business, ...snap.data() } as StoreSettings);
        },
        contentFail,
      ),
      onSnapshot(
        doc(db, "siteContent", "home"),
        (snap) => {
          if (snap.exists())
            setContent({ ...defaultContent, ...snap.data() } as SiteContent);
        },
        contentFail,
      ),
      onSnapshot(
        query(collection(db, "reviews"), where("status", "==", "approved")),
        (snap) => {
          setApprovedReviews(
            snap.docs.map(
              (d) => ({ ...d.data(), id: d.id }) as ModeratedReview,
            ),
          );
        },
        contentFail,
      ),
    ];

    return () => listeners.forEach((unsubscribe) => unsubscribe());
  }, []);

  return (
    <Context.Provider
      value={{ products, settings, content, approvedReviews, loading, error }}
    >
      {children}
    </Context.Provider>
  );
}

export const useSite = () => useContext(Context);

export function useCatalog() {
  const state = useSite();
  return {
    ...state,
    getProduct: (idOrSlug: string) =>
      state.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug),
  };
}

export const useSettings = () => useSite().settings;
