import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/lib/api";

export interface CartItem extends Product {
  quantity: number;
  isSubscription?: boolean;
  frequency?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, qty: number, isSubscription?: boolean, frequency?: string) => void;
  removeFromCart: (productId: number, isSubscription?: boolean) => void;
  updateQuantity: (productId: number, qty: number, isSubscription?: boolean) => void;
  clearCart: () => void;
  totalPrice: number;
  totalQuantity: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
    return [];
  });

  // Save cart to local storage on change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, qty: number, isSubscription = false, frequency = "Monthly") => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.id === product.id && !!item.isSubscription === !!isSubscription
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { ...product, quantity: qty, isSubscription, frequency }];
    });
  };

  const removeFromCart = (productId: number, isSubscription = false) => {
    setItems((prev) => prev.filter((item) => !(item.id === productId && !!item.isSubscription === !!isSubscription)));
  };

  const updateQuantity = (productId: number, qty: number, isSubscription = false) => {
    if (qty <= 0) {
      removeFromCart(productId, isSubscription);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        (item.id === productId && !!item.isSubscription === !!isSubscription) ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => {
    const price = item.isSubscription && item.subscription_discount
      ? item.price * (1 - item.subscription_discount / 100)
      : item.price;
    return acc + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
