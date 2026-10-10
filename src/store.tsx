import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CartLine } from "./types";
import { readStorage, sanitizeCart, writeStorage } from "./lib/commerce";
import { useCatalog, useSettings } from "./contexts/SiteContext";
import { totals } from "./lib/commerce";
type Store = {
  cart: CartLine[];
  drawer: boolean;
  setDrawer: (open: boolean) => void;
  add: (id: string, variant: string, quantity?: number, open?: boolean) => void;
  update: (id: string, variant: string, quantity: number) => void;
  clear: () => void;
  toast: (message: string) => void;
  message: string;
  sums: ReturnType<typeof totals>;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const { products, getProduct, loading } = useCatalog();
  const settings = useSettings();
  const [rawCart, setCart] = useState<CartLine[]>(() => {
    const saved = readStorage<unknown>("glam.cart.v1", []);
    return Array.isArray(saved)
      ? saved.filter(
          (l) =>
            l &&
            typeof l.productId === "string" &&
            typeof l.variantId === "string" &&
            Number.isFinite(l.quantity) &&
            l.quantity > 0,
        )
      : [];
  });
  const cart = loading ? [] : sanitizeCart(rawCart, products);
  const sums = totals(cart, undefined, products, settings.shipping);
  const [drawer, setDrawer] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (loading) return;
    const next = sanitizeCart(rawCart, products);
    if (JSON.stringify(next) !== JSON.stringify(rawCart)) {
      setCart(next);
      setMessage("Your bag was updated to match current availability.");
    }
    if (!writeStorage("glam.cart.v1", next))
      setMessage("Your browser could not save your bag. Keep this tab open.");
  }, [rawCart, products, loading]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  const add: Store["add"] = (id, variantId, quantity = 1, open = true) => {
    const variant = getProduct(id)?.variants.find((v) => v.id === variantId);
    if (!variant || variant.stock < 1) {
      setMessage("This colour is currently unavailable.");
      return;
    }
    setCart((current) =>
      sanitizeCart(
        [...current, { productId: id, variantId, quantity }],
        products,
      ),
    );
    setMessage("A softer ritual, added to your bag.");
    if (open) setDrawer(true);
  };
  const update: Store["update"] = (id, variant, quantity) =>
    setCart((current) =>
      sanitizeCart(
        current.map((l) =>
          l.productId === id && l.variantId === variant
            ? { ...l, quantity }
            : l,
        ),
        products,
      ),
    );
  return (
    <Context.Provider
      value={{
        cart,
        drawer,
        setDrawer,
        add,
        update,
        clear: () => setCart([]),
        toast: setMessage,
        message,
        sums,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("StoreProvider missing");
  return value;
}
