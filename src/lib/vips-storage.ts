import { DEFAULT_VIP_DATA, VipBillingCycle, VipData, VipMember, VipPaymentStatus } from "@/data/vips";

const STORAGE_KEY = "barberbook_admin_vips";

const VALID_BILLING_CYCLES: VipBillingCycle[] = ["monthly", "annual"];
const VALID_PAYMENT_STATUSES: VipPaymentStatus[] = ["paid", "pending", "overdue"];

const isValidMember = (entry: unknown): entry is VipMember => {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const typed = entry as Partial<VipMember>;

  return (
    typeof typed.id === "string" &&
    typeof typed.name === "string" &&
    typeof typed.email === "string" &&
    typeof typed.phone === "string" &&
    typeof typed.cpf === "string" &&
    typeof typed.billingCycle === "string" &&
    VALID_BILLING_CYCLES.includes(typed.billingCycle as VipBillingCycle) &&
    typeof typed.paymentStatus === "string" &&
    VALID_PAYMENT_STATUSES.includes(typed.paymentStatus as VipPaymentStatus) &&
    typeof typed.joinedAt === "string" &&
    typeof typed.expiresAt === "string"
  );
};

const sanitizeMember = (member: VipMember): VipMember => ({
  ...member,
  billingCycle: VALID_BILLING_CYCLES.includes(member.billingCycle) ? member.billingCycle : "monthly",
  paymentStatus: VALID_PAYMENT_STATUSES.includes(member.paymentStatus) ? member.paymentStatus : "pending",
});

const isValidData = (entry: unknown): entry is VipData => {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const typed = entry as Partial<VipData>;

  if (
    !typed.config ||
    typeof typed.config !== "object" ||
    typeof typed.config.priceMonthly !== "number" ||
    Number.isNaN(typed.config.priceMonthly) ||
    typed.config.priceMonthly < 0 ||
    typeof typed.config.priceAnnual !== "number" ||
    Number.isNaN(typed.config.priceAnnual) ||
    typed.config.priceAnnual < 0 ||
    typeof typed.config.billingCycle !== "string" ||
    !VALID_BILLING_CYCLES.includes(typed.config.billingCycle as VipBillingCycle) ||
    !Array.isArray(typed.config.benefits) ||
    !typed.config.benefits.every((benefit) => typeof benefit === "string")
  ) {
    return false;
  }

  if (!Array.isArray(typed.members)) {
    return false;
  }

  return typed.members.every(isValidMember);
};

const sanitizeData = (data: VipData): VipData => ({
  config: {
    priceMonthly: Number(data.config.priceMonthly.toFixed(2)),
    priceAnnual: Number(data.config.priceAnnual.toFixed(2)),
    billingCycle: data.config.billingCycle,
    benefits: data.config.benefits.map((benefit) => benefit.trim()).filter(Boolean),
  },
  members: data.members.map(sanitizeMember),
});

export const loadVipData = (): VipData => {
  if (typeof window === "undefined") {
    return DEFAULT_VIP_DATA;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return DEFAULT_VIP_DATA;
  }

  try {
    const parsed = JSON.parse(stored);

    if (!isValidData(parsed)) {
      return DEFAULT_VIP_DATA;
    }

    return sanitizeData(parsed);
  } catch {
    return DEFAULT_VIP_DATA;
  }
};

export const persistVipData = (data: VipData) => {
  if (typeof window === "undefined") {
    return;
  }

  const sanitized = sanitizeData(data);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
};

export const resetVipData = () => {
  persistVipData(DEFAULT_VIP_DATA);
};


