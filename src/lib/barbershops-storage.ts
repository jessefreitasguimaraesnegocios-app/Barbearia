import { Barbershop, DEFAULT_BARBERSHOPS, BarbershopStatus } from "@/data/barbershops";
import { differenceInDays, parseISO, isAfter, addDays } from "date-fns";
import { syncBarbershopsFromSupabase } from "./sync-supabase";

const STORAGE_KEY = "barberbook_admin_barbershops";
const LAST_SYNC_KEY = "barberbook_admin_barbershops_last_sync";

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
    typeof typed.email === "string" &&
    (typed.pixKey === undefined || typeof typed.pixKey === "string") &&
    (typed.status === undefined || typed.status === "disponivel" || typed.status === "indisponivel") &&
    (typed.dataPagamento === undefined || typeof typed.dataPagamento === "string") &&
    (typed.dataVencimento === undefined || typeof typed.dataVencimento === "string")
  );
};

const sanitizeBarbershop = (entry: Barbershop): Barbershop => ({
  ...entry,
  rating: Number(entry.rating.toFixed(1)),
  pixKey: entry.pixKey ?? "",
});

export const checkPaymentStatus = (barbershop: Barbershop): Barbershop | null => {
  if (!barbershop.dataVencimento) {
    return { ...barbershop, status: barbershop.status || "disponivel" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const vencimento = parseISO(barbershop.dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  
  const diasAtraso = differenceInDays(today, vencimento);

  if (diasAtraso > 3) {
    return null;
  }

  if (diasAtraso >= 0) {
    if (!barbershop.dataPagamento) {
      return { ...barbershop, status: "indisponivel" };
    }
    
    const dataPagamento = parseISO(barbershop.dataPagamento);
    dataPagamento.setHours(0, 0, 0, 0);
    
    if (isAfter(dataPagamento, vencimento) || dataPagamento.getTime() >= vencimento.getTime()) {
      const proximoVencimento = addDays(dataPagamento, 30);
      return {
        ...barbershop,
        status: "disponivel",
        dataVencimento: proximoVencimento.toISOString().split("T")[0],
      };
    } else {
      return { ...barbershop, status: "indisponivel" };
    }
  }

  return { ...barbershop, status: barbershop.status || "disponivel" };
};

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

    const validBarbershops = parsed
      .filter(isValidBarbershop)
      .map(sanitizeBarbershop)
      .map(checkPaymentStatus)
      .filter((bs): bs is Barbershop => bs !== null);

    persistBarbershops(validBarbershops);
    return validBarbershops;
  } catch {
    return DEFAULT_BARBERSHOPS;
  }
};

// Função para forçar sincronização (chamada na inicialização)
export const syncBarbershopsIfNeeded = async () => {
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  const shouldSync = !lastSync || (now - parseInt(lastSync, 10)) > fiveMinutes;

  if (shouldSync) {
    try {
      const synced = await syncBarbershopsFromSupabase();
      if (synced && synced.length > 0) {
        localStorage.setItem(LAST_SYNC_KEY, now.toString());
        return true;
      }
    } catch (error) {
      console.warn('Erro ao sincronizar barbearias:', error);
    }
  }
  return false;
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


