export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rating: number;
  price: number;
  quantity: number;
  minStock: number;
  vipDiscount: number;
  vipPromotionLabel: string;
  createdAt: string;
  category?: "produtos" | "consumo" | "bebidas" | "estilo" | "rascunho";
}

export interface ConsumableItem {
  id: string;
  name: string;
  imageUrl: string | null;
  imageFileName?: string | null;
  quantity: number;
  minStock: number;
  unit: string;
  notes: string;
  updatedAt: string;
}

export interface StorefrontSettings {
  title: string;
  subtitle: string;
  highlight: string;
}

export interface InventoryData {
  storeProducts: StoreProduct[];
  consumables: ConsumableItem[];
  storefront: StorefrontSettings;
}

export const DEFAULT_STORE_PRODUCTS: StoreProduct[] = [
  {
    id: "prod-1",
    name: "Pomada Modeladora Premium",
    description: "Fixação forte com acabamento fosco. Ideal para qualquer estilo.",
    imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    rating: 4.9,
    price: 79.9,
    quantity: 18,
    minStock: 5,
    vipDiscount: 15,
    vipPromotionLabel: "VIP: 15% OFF",
    createdAt: new Date("2024-02-12T09:30:00Z").toISOString(),
    category: "produtos",
  },
  {
    id: "prod-2",
    name: "Balm para Barba - Eucalipto",
    description: "Hidratação intensa com aroma exclusivo BarberBook.",
    imageUrl: "https://images.unsplash.com/photo-1625513976430-22f7c34c5981?auto=format&fit=crop&w=800&q=80",
    rating: 4.7,
    price: 59.5,
    quantity: 8,
    minStock: 10,
    vipDiscount: 10,
    vipPromotionLabel: "VIP: +Hidratação mensal",
    createdAt: new Date("2024-01-28T16:45:00Z").toISOString(),
    category: "produtos",
  },
  {
    id: "prod-3",
    name: "Kit Navalhete + Lâminas",
    description: "Pacote completo com navalhete inox e 20 lâminas descartáveis.",
    imageUrl: "https://images.unsplash.com/photo-1582090688171-96083c63d06c?auto=format&fit=crop&w=800&q=80",
    rating: 4.8,
    price: 129.9,
    quantity: 4,
    minStock: 6,
    vipDiscount: 20,
    vipPromotionLabel: "VIP: 20% OFF + frete grátis",
    createdAt: new Date("2024-03-03T11:20:00Z").toISOString(),
    category: "produtos",
  },
];

export const DEFAULT_CONSUMABLES: ConsumableItem[] = [
  {
    id: "cons-1",
    name: "Lâminas descartáveis",
    imageUrl: null,
    quantity: 120,
    minStock: 80,
    unit: "unidades",
    notes: "Trocar a cada atendimento completo.",
    updatedAt: new Date("2024-04-12T08:10:00Z").toISOString(),
  },
  {
    id: "cons-2",
    name: "Toalhas quentes",
    imageUrl: null,
    quantity: 45,
    minStock: 30,
    unit: "unidades",
    notes: "Enviar para lavanderia quando < 30.",
    updatedAt: new Date("2024-04-05T15:00:00Z").toISOString(),
  },
  {
    id: "cons-3",
    name: "Creme de barbear mentolado",
    imageUrl: null,
    quantity: 12,
    minStock: 15,
    unit: "bisnagas",
    notes: "Comprar da fornecedora padrão (lote mínimo 20).",
    updatedAt: new Date("2024-04-02T17:45:00Z").toISOString(),
  },
];

export const DEFAULT_INVENTORY: InventoryData = {
  storeProducts: DEFAULT_STORE_PRODUCTS,
  consumables: DEFAULT_CONSUMABLES,
  storefront: {
    title: "Nossa Loja",
    subtitle: "Produtos profissionais selecionados para cuidar do seu estilo",
    highlight: "Para compras acima de R$ 100,00 dentro da região metropolitana",
  },
};


