import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CartLine, Order } from "./types";
import {
  readStorage,
  sanitizeCart,
  sanitizeOrders,
  writeStorage,
} from "./lib/commerce";
import { getProduct } from "./data/catalog";
type Store = {
  cart: CartLine[];
  drawer: boolean;
  setDrawer: (open: boolean) => void;
  add: (id: string, variant: string, quantity?: number, open?: boolean) => void;
  update: (id: string, variant: string, quantity: number) => void;
  clear: () => void;
  toast: (message: string) => void;
  message: string;
  orders: Order[];
  saveOrder: (order: Order) => void;
  clearOrders: () => void;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState(() =>
    sanitizeCart(readStorage("glam.cart.v1", [])),
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    sanitizeOrders(readStorage<unknown>("glam.previews.v1", [])),
  );
  const [drawer, setDrawer] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!writeStorage("glam.cart.v1", cart))
      setMessage("Your browser could not save your bag. Keep this tab open.");
  }, [cart]);
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
      sanitizeCart([...current, { productId: id, variantId, quantity }]),
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
      ),
    );
  const saveOrder = (order: Order) => {
    const next = [order, ...orders].slice(0, 20);
    setOrders(next);
    if (!writeStorage("glam.previews.v1", next))
      setMessage(
        "Preview saved for this session only; browser storage is unavailable.",
      );
  };
  const clearOrders = () => {
    setOrders([]);
    const saved = writeStorage("glam.previews.v1", []);
    setMessage(
      saved
        ? "Local order previews cleared."
        : "Could not clear saved previews. Use your browser’s site data settings.",
    );
  };
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
        orders,
        saveOrder,
        clearOrders,
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
