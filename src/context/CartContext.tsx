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
      
      // Limite muito maior para evitar limpeza desnecessária
      if (stored.length > 50000000) {
        console.error("[Cart] Stored cart data extremely large, this should not happen");
        // Não limpar automaticamente, apenas logar
        return [];
      }
      
      const parsed = JSON.parse(stored) as CartItem[];
      if (!Array.isArray(parsed)) {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      
      // Não limitar o número de itens - permitir todos os itens do carrinho
      return parsed;
    } catch (error) {
      console.error("[Cart] Error loading cart from localStorage:", error);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (removeError) {
        // Ignore removal errors
      }
      return [];
    }
  });
  
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || isUpdatingRef.current) return;
    
    // Garantir que items é sempre um array válido
    if (!Array.isArray(items)) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      // Verificar novamente se ainda está atualizando (pode ter mudado durante o timeout)
      if (isUpdatingRef.current) return;
      
      try {
        isUpdatingRef.current = true;
        
        // Capturar o estado atual dos items para garantir consistência
        const currentItems = items;
        const serialized = JSON.stringify(currentItems);
        
        // Limite muito maior (50MB) - um carrinho normal nunca chegaria perto disso
        // Se chegar, provavelmente há um bug, mas não vamos limpar o carrinho
        if (serialized.length > 50000000) {
          console.error("[Cart] Cart data extremely large, this should not happen. Size:", serialized.length);
          // Não limpar o carrinho, apenas logar o erro
          isUpdatingRef.current = false;
        return;
      }
      
      localStorage.setItem(STORAGE_KEY, serialized);
        isUpdatingRef.current = false;
    } catch (error) {
        isUpdatingRef.current = false;
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
          console.error("[Cart] localStorage quota exceeded");
          // Não limpar o carrinho automaticamente, apenas logar o erro
          // O usuário pode limpar manualmente se necessário
      } else {
        console.error("[Cart] Error saving cart to localStorage:", error);
      }
    }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [items]);

  const addItem = (product: CartProduct, quantity = 1): boolean => {
    let wasAdded = false;
    
    // Usar uma função de atualização que garante que o estado anterior seja preservado
    setItems((prev) => {
      // Garantir que prev é sempre um array válido
      const currentItems = Array.isArray(prev) ? prev : [];
      
      // Verificar se o produto já existe
      const existingIndex = currentItems.findIndex((item) => item.id === product.id);
      if (existingIndex !== -1) {
        wasAdded = false;
        return currentItems; // Retornar o array atual sem modificações
      }
      
      // Criar novo item e adicionar ao array
      const newItem: CartItem = { ...product, quantity };
      
      // Sempre adicionar ao final, sem limite de 50 itens
      // O limite de 50 estava causando problemas ao remover itens antigos
      const updatedItems: CartItem[] = [...currentItems, newItem];
      
      wasAdded = true;
      return updatedItems;
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

