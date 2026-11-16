'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackAnalyticsEvent } from '@/lib/analytics';

export interface CartItem {
  id: string; // product_variant_id
  productId: string; // product_id
  title: string;
  slug: string;
  size: string;
  color: string;
  price: number; // in XAF / FCFA
  quantity: number;
  imageUrl: string;
  maxStock: number;
}

interface CartContextType {
  items: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number, shouldOpenCart?: boolean) => void;
  removeFromCart: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('kakos_cart');
      if (storedCart) {
        setItems(JSON.parse(storedCart));
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
    setIsInitialized(true);
  }, []);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('kakos_cart', JSON.stringify(items));
      } catch (e) {
        console.error('Failed to save cart to localStorage', e);
      }
    }
  }, [items, isInitialized]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>, qty = 1, shouldOpenCart = true) => {
    const itemMaxStock = typeof newItem.maxStock === 'number' && newItem.maxStock > 0 ? newItem.maxStock : 99;
    const addQty = Math.max(1, qty);

    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.id === newItem.id);

      if (existingItemIndex > -1) {
        const existingItem = prevItems[existingItemIndex];
        const newQty = Math.min(existingItem.quantity + addQty, itemMaxStock);
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...existingItem,
          price: Number(newItem.price) || existingItem.price,
          quantity: newQty,
          maxStock: itemMaxStock,
        };
        return updatedItems;
      }

      return [
        ...prevItems,
        {
          ...newItem,
          price: Number(newItem.price) || 0,
          quantity: Math.min(addQty, itemMaxStock),
          maxStock: itemMaxStock,
        },
      ];
    });
    if (shouldOpenCart) {
      openCart();
    }
    trackAnalyticsEvent({
      event: 'add_to_cart',
      productId: newItem.productId,
      value: Number(newItem.price) * addQty,
      properties: { variant_id: newItem.id, quantity: addQty, slug: newItem.slug },
    });
  };

  const removeFromCart = (variantId: string) => {
    const removed = items.find((item) => item.id === variantId);
    if (removed) {
      trackAnalyticsEvent({
        event: 'remove_from_cart',
        productId: removed.productId,
        value: Number(removed.price) * removed.quantity,
        properties: { variant_id: removed.id, quantity: removed.quantity, slug: removed.slug },
      });
    }
    setItems((prevItems) => prevItems.filter((item) => item.id !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === variantId) {
          const itemMaxStock = typeof item.maxStock === 'number' && item.maxStock > 0 ? item.maxStock : 99;
          return {
            ...item,
            quantity: Math.min(Math.max(1, quantity), itemMaxStock),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartCount = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  const cartSubtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
