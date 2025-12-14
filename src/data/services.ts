export type PromotionScope = "all" | "vip" | "none";

export interface ServiceItem {
  id: string;
  title: string;
  price: number;
  duration: string;
  description: string;
  features: string[];
  promotionScope: PromotionScope;
  discountPercentage: number | null;
}

export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: "corte-classico",
    title: "Corte Clássico",
    price: 45,
    duration: "30 min",
    description: "Corte tradicional com máquina e tesoura, acabamento impecável.",
    features: ["Lavagem dos cabelos", "Finalização com cera", "Massagem relaxante"],
    promotionScope: "all",
    discountPercentage: 10,
  },
  {
    id: "corte-barba",
    title: "Corte + Barba",
    price: 70,
    duration: "50 min",
    description: "Combo completo: corte moderno e barba desenhada.",
    features: ["Lavagem dos cabelos", "Design de barba", "Toalha quente", "Hidratação facial"],
    promotionScope: "vip",
    discountPercentage: 15,
  },
  {
    id: "barba-completa",
    title: "Barba Completa",
    price: 35,
    duration: "25 min",
    description: "Desenho e acabamento profissional da barba.",
    features: ["Toalha quente", "Navalha tradicional", "Hidratação pós-barba"],
    promotionScope: "all",
    discountPercentage: 5,
  },
  {
    id: "corte-premium",
    title: "Corte Premium",
    price: 65,
    duration: "45 min",
    description: "Corte sofisticado com técnicas avançadas e consultoria de estilo.",
    features: ["Análise capilar", "Lavagem premium", "Finalização profissional", "Produtos importados"],
    promotionScope: "vip",
    discountPercentage: 20,
  },
  {
    id: "platinado-luzes",
    title: "Platinado/Luzes",
    price: 150,
    duration: "90 min",
    description: "Coloração profissional com produtos de alta qualidade.",
    features: ["Descoloração", "Tonalização", "Tratamento capilar", "Finalização"],
    promotionScope: "vip",
    discountPercentage: 25,
  },
  {
    id: "sobrancelha",
    title: "Sobrancelha",
    price: 20,
    duration: "15 min",
    description: "Design e acabamento das sobrancelhas.",
    features: ["Design personalizado", "Acabamento com navalha"],
    promotionScope: "none",
    discountPercentage: null,
  },
];

