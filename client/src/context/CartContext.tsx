import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api/client";
import type { CartItem, Order } from "../types";
import { useAuth } from "./AuthContext";

type CheckoutPayload = {
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingLatitude?: number | null;
  shippingLongitude?: number | null;
};

type CartContextValue = {
  items: CartItem[];
  loading: boolean;
  count: number;
  subtotal: number;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number, vehicleId?: string | null) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  checkout: (payload: CheckoutPayload) => Promise<Order>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function refreshCart() {
    if (!user || user.role === "ADMIN") {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(await api<CartItem[]>("/cart"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshCart();
  }, [user?.id]);

  async function addItem(productId: string, quantity = 1) {
    await api<CartItem>("/cart", { method: "POST", body: { productId, quantity } });
    await refreshCart();
  }

  async function updateItem(itemId: string, quantity: number, vehicleId?: string | null) {
    await api<CartItem>(`/cart/${itemId}`, {
      method: "PATCH",
      body: vehicleId === undefined ? { quantity } : { quantity, vehicleId }
    });
    await refreshCart();
  }

  async function removeItem(itemId: string) {
    await api(`/cart/${itemId}`, { method: "DELETE" });
    await refreshCart();
  }

  async function checkout(payload: CheckoutPayload) {
    const order = await api<Order>("/orders", { method: "POST", body: payload });
    setItems([]);
    return order;
  }

  const value = useMemo(
    () => ({
      items,
      loading,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      refreshCart,
      addItem,
      updateItem,
      removeItem,
      checkout
    }),
    [items, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
