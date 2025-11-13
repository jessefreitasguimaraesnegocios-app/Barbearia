import {
  ConsumableItem,
  DEFAULT_INVENTORY,
  InventoryData,
  StoreProduct,
  StorefrontSettings,
} from "@/data/inventory";

const STORAGE_KEY = "barberbook_admin_inventory";

const isValidStoreProduct = (entry: unknown): entry is StoreProduct => {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const typed = entry as Partial<StoreProduct>;

  return (
    typeof typed.id === "string" &&
    typeof typed.name === "string" &&
    typeof typed.description === "string" &&
    typeof typed.imageUrl === "string" &&
    typeof typed.rating === "number" &&
    Number.isFinite(typed.rating) &&
    typed.rating >= 0 &&
    typed.rating <= 5 &&
    typeof typed.price === "number" &&
    Number.isFinite(typed.price) &&
    typed.price >= 0 &&
    typeof typed.quantity === "number" &&
    Number.isFinite(typed.quantity) &&
    typed.quantity >= 0 &&
    typeof typed.minStock === "number" &&
    Number.isFinite(typed.minStock) &&
    typed.minStock >= 0 &&
    typeof typed.vipDiscount === "number" &&
    Number.isFinite(typed.vipDiscount) &&
    typed.vipDiscount >= 0 &&
    typed.vipDiscount <= 100 &&
    typeof typed.vipPromotionLabel === "string" &&
    typeof typed.createdAt === "string"
  );
};

const sanitizeStoreProduct = (product: StoreProduct): StoreProduct => ({
  ...product,
  rating: Number(product.rating.toFixed(1)),
  price: Number(product.price.toFixed(2)),
  quantity: Math.max(0, Math.floor(product.quantity)),
  minStock: Math.max(0, Math.floor(product.minStock)),
  vipDiscount: Math.min(Math.max(product.vipDiscount, 0), 100),
});

const isValidConsumable = (entry: unknown): entry is ConsumableItem => {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const typed = entry as Partial<ConsumableItem>;

  return (
    typeof typed.id === "string" &&
    typeof typed.name === "string" &&
    (typed.imageUrl === null || typeof typed.imageUrl === "string") &&
    typeof typed.quantity === "number" &&
    Number.isFinite(typed.quantity) &&
    typed.quantity >= 0 &&
    typeof typed.minStock === "number" &&
    Number.isFinite(typed.minStock) &&
    typed.minStock >= 0 &&
    typeof typed.unit === "string" &&
    typeof typed.notes === "string" &&
    typeof typed.updatedAt === "string"
  );
};

const sanitizeConsumable = (item: ConsumableItem): ConsumableItem => ({
  ...item,
  quantity: Math.max(0, Math.floor(item.quantity)),
  minStock: Math.max(0, Math.floor(item.minStock)),
  imageUrl: item.imageUrl ?? null,
  imageFileName: item.imageFileName ?? null,
  notes: item.notes ?? "",
});

const isValidStorefront = (entry: unknown): entry is StorefrontSettings => {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const typed = entry as Partial<StorefrontSettings>;

  return (
    typeof typed.title === "string" &&
    typeof typed.subtitle === "string" &&
    typeof typed.highlight === "string"
  );
};

const isValidInventory = (entry: unknown): entry is InventoryData => {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const typed = entry as Partial<InventoryData>;

  if (
    !Array.isArray(typed.storeProducts) ||
    !Array.isArray(typed.consumables) ||
    !typed.storefront ||
    !isValidStorefront(typed.storefront)
  ) {
    return false;
  }

  return (
    typed.storeProducts.every(isValidStoreProduct) &&
    typed.consumables.every(isValidConsumable)
  );
};

const sanitizeInventory = (inventory: InventoryData): InventoryData => ({
  storeProducts: inventory.storeProducts.map(sanitizeStoreProduct),
  consumables: inventory.consumables.map(sanitizeConsumable),
  storefront: {
    title: inventory.storefront.title.trim() || DEFAULT_INVENTORY.storefront.title,
    subtitle: inventory.storefront.subtitle.trim() || DEFAULT_INVENTORY.storefront.subtitle,
    highlight: inventory.storefront.highlight.trim() || DEFAULT_INVENTORY.storefront.highlight,
  },
});

export const loadInventory = (): InventoryData => {
  if (typeof window === "undefined") {
    return DEFAULT_INVENTORY;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return DEFAULT_INVENTORY;
  }

  try {
    const parsed = JSON.parse(stored);

    if (!isValidInventory(parsed)) {
      return DEFAULT_INVENTORY;
    }

    return sanitizeInventory(parsed);
  } catch {
    return DEFAULT_INVENTORY;
  }
};

export const persistInventory = (inventory: InventoryData) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeInventory(inventory)));
};

export const resetInventory = () => {
  persistInventory(DEFAULT_INVENTORY);
};


