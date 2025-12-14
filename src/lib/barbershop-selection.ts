export type BarbershopSelection = {
  id: string;
  name: string;
  email?: string;
};

export const DEFAULT_BARBERSHOP_SELECTION_KEY = "barberbook_default_barbershop";

const normalizeSelection = (selection: { id: string | number; name: string; email?: string }): BarbershopSelection => ({
  id: typeof selection.id === "number" ? selection.id.toString() : selection.id,
  name: selection.name.trim(),
  email: selection.email?.trim() || undefined,
});

export const setDefaultBarbershopSelection = (
  selection: { id: string | number; name: string; email?: string } | null,
) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!selection || !selection.id || !selection.name.trim()) {
    window.localStorage.removeItem(DEFAULT_BARBERSHOP_SELECTION_KEY);
    return;
  }

  const normalized = normalizeSelection(selection);
  window.localStorage.setItem(DEFAULT_BARBERSHOP_SELECTION_KEY, JSON.stringify(normalized));
};

export const getDefaultBarbershopSelection = (): BarbershopSelection | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(DEFAULT_BARBERSHOP_SELECTION_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as Partial<BarbershopSelection>;
    if (!parsed || typeof parsed.id !== "string" || typeof parsed.name !== "string") {
      return null;
    }

    return {
      id: parsed.id,
      name: parsed.name,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
    };
  } catch {
    return null;
  }
};


