import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type CartProduct = {
  id: number;
  name: string;
  priceLabel: string;
  priceValue: number;
  image: string;
};

export type CartItem = CartProduct & {
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => boolean;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalQuantity: number;
  totalValue: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = "fadebook-cart";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }
      
      if (stored.length > 5000000) {
        console.warn("[Cart] Stored cart data too large, clearing");
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      
      const parsed = JSON.parse(stored) as CartItem[];
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      
      const limitedItems = parsed.slice(0, 50);
      
      return limitedItems;
    } catch (error) {
      console.error("[Cart] Error loading cart from localStorage:", error);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
      }
      return [];
    }
  });
  
  const itemsRef = useRef<CartItem[]>(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const serialized = JSON.stringify(items);
      
      if (serialized.length > 5000000) {
        console.warn("[Cart] Cart data too large, clearing old data");
        localStorage.removeItem(STORAGE_KEY);
        setItems([]);
        return;
      }
      
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        console.error("[Cart] localStorage quota exceeded, clearing cart");
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.clear();
        } catch (clearError) {
          console.error("[Cart] Failed to clear localStorage:", clearError);
        }
        setItems([]);
      } else {
        console.error("[Cart] Error saving cart to localStorage:", error);
      }
    }
  }, [items]);

  const addItem = (product: CartProduct, quantity = 1): boolean => {
    let wasAdded = false;
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        wasAdded = false;
        return prev;
      }
      
      let itemsToUpdate = prev;
      if (itemsToUpdate.length >= 50) {
        console.warn("[Cart] Cart limit reached (50 items), removing oldest item");
        itemsToUpdate = itemsToUpdate.slice(1);
      }
      
      wasAdded = true;
      return [...itemsToUpdate, { ...product, quantity }];
    });
    return wasAdded;
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!Number.isFinite(quantity)) {
      quantity = 1;
    }
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(1, Math.min(Math.floor(quantity), 99)) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const { totalQuantity, totalValue } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.totalQuantity += item.quantity;
        acc.totalValue += item.priceValue * item.quantity;
        return acc;
      },
      { totalQuantity: 0, totalValue: 0 }
    );
  }, [items]);

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalQuantity,
    totalValue,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

