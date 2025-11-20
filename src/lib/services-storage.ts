import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";

const STORAGE_KEY = "barberbook_admin_services";

const isValidService = (service: unknown): service is ServiceItem => {
  if (!service || typeof service !== "object") {
    return false;
  }

  const typed = service as Partial<ServiceItem>;

  return (
    typeof typed.id === "string" &&
    typeof typed.title === "string" &&
    typeof typed.price === "number" &&
    Number.isFinite(typed.price) &&
    typeof typed.duration === "string" &&
    typeof typed.description === "string" &&
    Array.isArray(typed.features) &&
    typed.features.every((feature) => typeof feature === "string") &&
    (typed.promotionScope === "all" || typed.promotionScope === "vip" || typed.promotionScope === "none") &&
    (typed.discountPercentage === null ||
      (typeof typed.discountPercentage === "number" &&
        Number.isFinite(typed.discountPercentage) &&
        typed.discountPercentage >= 0 &&
        typed.discountPercentage <= 100))
  );
};

export const loadServices = (): ServiceItem[] => {
  if (typeof window === "undefined") {
    return DEFAULT_SERVICES;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return DEFAULT_SERVICES;
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEFAULT_SERVICES;
    }

    const sanitized = parsed.filter(isValidService).map((service) => ({
      ...service,
      discountPercentage:
        service.promotionScope === "none"
          ? null
          : typeof service.discountPercentage === "number"
          ? service.discountPercentage
          : null,
    }));

    // Se a chave existe no localStorage, retornar o que está salvo (mesmo que vazio)
    // Isso permite que novos usuários comecem com dados vazios
    return sanitized;
  } catch {
    return DEFAULT_SERVICES;
  }
};

export const persistServices = (services: ServiceItem[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
};

export const resetServicesToDefault = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SERVICES));
};

