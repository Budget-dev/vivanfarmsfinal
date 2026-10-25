"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { CartItem, Product } from '@/types';

const CART_STORAGE_KEY = 'vivaan_cart';
const CART_UPDATE_EVENT = 'vivaan_cart_updated';

/**
 * Global Cart Hook with real-time cross-component synchronization,
 * mobile double-tap protection, and localStorage persistence.
 */
export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Helper to safely read from localStorage
  const getStoredCart = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse cart from storage", e);
      return [];
    }
  };

  // Broadcast cart changes to all components & tabs
  const broadcastCart = (newCart: CartItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT, { detail: newCart }));
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  };

  // Initial load and event listeners for real-time sync
  useEffect(() => {
    const initialCart = getStoredCart();
    setCart(initialCart);
    setIsLoaded(true);

    const handleCartUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CartItem[]>;
      if (customEvent.detail) {
        setCart(customEvent.detail);
      } else {
        setCart(getStoredCart());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          setCart(JSON.parse(e.newValue));
        } catch {
          setCart(getStoredCart());
        }
      }
    };

    window.addEventListener(CART_UPDATE_EVENT, handleCartUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(CART_UPDATE_EVENT, handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addToCart = useCallback((product: Product, qty: number = 1) => {
    // Mobile double-tap debounce (prevent accidental rapid double-tap)
    const now = Date.now();
    if (now - lastTapRef.current < 200) {
      return;
    }
    lastTapRef.current = now;

    // Mobile haptic vibration feedback if supported
    if (typeof window !== 'undefined' && 'navigator' in window && typeof window.navigator.vibrate === 'function') {
      try { window.navigator.vibrate(15); } catch {}
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.vol === product.vol);
      let updated: CartItem[];
      if (existing) {
        updated = prev.map(item => 
          (item.id === product.id && item.vol === product.vol)
            ? { ...item, qty: item.qty + qty }
            : item
        );
      } else {
        updated = [...prev, { ...product, qty }];
      }
      broadcastCart(updated);
      return updated;
    });
  }, []);

  const setBuyNowItem = useCallback((product: Product, qty: number = 1) => {
    // Mobile double-tap debounce
    const now = Date.now();
    if (now - lastTapRef.current < 200) {
      return;
    }
    lastTapRef.current = now;

    setCart(prev => {
      // Find if this product (any variant) is already in the cart
      const existingSameIdIndex = prev.findIndex(item => item.id === product.id);
      let updated: CartItem[];
      
      if (existingSameIdIndex >= 0) {
        // Replace existing line item with exact selected variant & specified quantity
        updated = prev.map((item, idx) => 
          idx === existingSameIdIndex
            ? { ...product, qty: Math.max(1, qty) }
            : item
        );
      } else {
        updated = [...prev, { ...product, qty: Math.max(1, qty) }];
      }
      broadcastCart(updated);
      return updated;
    });
  }, []);

  const updateQty = useCallback((id: string, vol: string, delta: number) => {
    // Mobile haptic vibration feedback
    if (typeof window !== 'undefined' && 'navigator' in window && typeof window.navigator.vibrate === 'function') {
      try { window.navigator.vibrate(10); } catch {}
    }

    setCart(prev => {
      const updated = prev.map(item => 
        (item.id === id && item.vol === vol)
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      );
      broadcastCart(updated);
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((id: string, vol: string) => {
    setCart(prev => {
      const updated = prev.filter(item => !(item.id === id && item.vol === vol));
      broadcastCart(updated);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    broadcastCart([]);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
  const totalQty = cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  return { cart, addToCart, setBuyNowItem, updateQty, removeFromCart, clearCart, subtotal, totalQty, isLoaded };
}
