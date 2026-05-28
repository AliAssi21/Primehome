import React, { createContext, useContext, ReactNode, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/auth";

interface CartItem {
  productId: number;
  productName: string;
  price: number;
  salePrice: number | null;
  quantity: number;
  imageUrl: string;
  stock: number;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
}

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateCartItem: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => apiRequest("GET", "/cart", undefined, getToken() || undefined),
    enabled: !!user,
    staleTime: 30000,
  });

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addToCart = async (productId: number, quantity: number) => {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");
    await apiRequest("POST", "/cart", { productId, quantity }, token);
    await invalidateCart();
  };

  const updateCartItem = async (productId: number, quantity: number) => {
    const token = getToken();
    if (!token) return;
    if (quantity <= 0) {
      await apiRequest("DELETE", `/cart/${productId}`, undefined, token);
    } else {
      await apiRequest("PATCH", `/cart/${productId}`, { quantity }, token);
    }
    await invalidateCart();
  };

  const removeFromCart = async (productId: number) => {
    const token = getToken();
    if (!token) return;
    await apiRequest("DELETE", `/cart/${productId}`, undefined, token);
    await invalidateCart();
  };

  const clearCart = async () => {
    const token = getToken();
    if (!token) return;
    await apiRequest("DELETE", "/cart", undefined, token);
    await invalidateCart();
  };

  return (
    <CartContext.Provider value={{
      cart: user ? (cart ?? null) : null,
      isLoading: user ? isLoading : false,
      addToCart,
      updateCartItem,
      removeFromCart,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}
