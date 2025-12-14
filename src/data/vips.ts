export type VipBillingCycle = "monthly" | "annual";
export type VipPaymentStatus = "paid" | "pending" | "overdue";

export interface VipConfig {
  priceMonthly: number;
  priceAnnual: number;
  billingCycle: VipBillingCycle;
  benefits: string[];
}

export interface VipMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  billingCycle: VipBillingCycle;
  paymentStatus: VipPaymentStatus;
  joinedAt: string;
  expiresAt: string;
}

export interface VipData {
  config: VipConfig;
  members: VipMember[];
}

export const DEFAULT_VIP_DATA: VipData = {
  config: {
    priceMonthly: 199.9,
    priceAnnual: 500.0,
    billingCycle: "monthly",
    benefits: [
      "10% de desconto em todos os serviços",
      "Atendimento prioritário",
      "Sessão mensal de hidratação",
    ],
  },
  members: [
    {
      id: "vip-1",
      name: "Lucas Mendes",
      email: "lucas.mendes@example.com",
      phone: "(11) 98765-4321",
      cpf: "321.654.987-00",
      billingCycle: "monthly",
      paymentStatus: "paid",
      joinedAt: new Date("2024-04-01T10:00:00Z").toISOString(),
      expiresAt: new Date("2024-05-01T10:00:00Z").toISOString(),
    },
    {
      id: "vip-2",
      name: "Carla Ribeiro",
      email: "carla.ribeiro@example.com",
      phone: "(11) 91234-5678",
      cpf: "456.789.123-00",
      billingCycle: "annual",
      paymentStatus: "pending",
      joinedAt: new Date("2024-01-10T14:30:00Z").toISOString(),
      expiresAt: new Date("2025-01-10T14:30:00Z").toISOString(),
    },
  ],
};


