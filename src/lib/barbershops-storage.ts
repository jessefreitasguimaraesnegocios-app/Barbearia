import { Barbershop, DEFAULT_BARBERSHOPS } from "@/data/barbershops";

const STORAGE_KEY = "barberbook_admin_barbershops";

const isValidBarbershop = (entry: unknown): entry is Barbershop => {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const typed = entry as Partial<Barbershop>;

  return (
    typeof typed.id === "string" &&
    typed.id.length > 0 &&
    typeof typed.name === "string" &&
    typed.name.length > 0 &&
    typeof typed.rating === "number" &&
    Number.isFinite(typed.rating) &&
    typed.rating >= 0 &&
    typed.rating <= 5 &&
    typeof typed.address === "string" &&
    typeof typed.phone === "string" &&
    typeof typed.hours === "string" &&
    typeof typed.isOpen === "boolean" &&
    typeof typed.email === "string"
  );
};

const sanitizeBarbershop = (entry: Barbershop): Barbershop => ({
  ...entry,
  rating: Number(entry.rating.toFixed(1)),
});

export const loadBarbershops = (): Barbershop[] => {
  if (typeof window === "undefined") {
    return DEFAULT_BARBERSHOPS;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return DEFAULT_BARBERSHOPS;
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEFAULT_BARBERSHOPS;
    }

    const validBarbershops = parsed.filter(isValidBarbershop).map(sanitizeBarbershop);

    if (!validBarbershops.length) {
      return DEFAULT_BARBERSHOPS;
    }

    return validBarbershops;
  } catch {
    return DEFAULT_BARBERSHOPS;
  }
};

export const persistBarbershops = (barbershops: Barbershop[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(barbershops.map(sanitizeBarbershop)));
};

export const resetBarbershopsToDefault = () => {
  if (typeof window === "undefined") {
    return;
  }

  persistBarbershops(DEFAULT_BARBERSHOPS);
};


