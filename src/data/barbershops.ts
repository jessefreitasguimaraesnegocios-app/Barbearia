export type BarbershopStatus = "disponivel" | "indisponivel";

export interface Barbershop {
  id: string;
  name: string;
  rating: number;
  address: string;
  phone: string;
  hours: string;
  isOpen: boolean;
  email: string;
  status?: BarbershopStatus;
  dataPagamento?: string;
  dataVencimento?: string;
}

export const DEFAULT_BARBERSHOPS: Barbershop[] = [
  {
    id: "1",
    name: "BarberBook Premium Center",
    rating: 4.9,
    address: "Av. Paulista, 1000 - São Paulo, SP",
    phone: "(11) 90000-0001",
    hours: "Seg à Sáb • 09h às 21h",
    isOpen: true,
    email: "premium.center@barberbook.com",
    status: "disponivel",
  },
  {
    id: "2",
    name: "Barbearia Elite Jardins",
    rating: 4.8,
    address: "Rua Oscar Freire, 450 - São Paulo, SP",
    phone: "(11) 93333-0002",
    hours: "Seg à Sáb • 10h às 20h",
    isOpen: true,
    email: "elite.jardins@barberbook.com",
    status: "disponivel",
  },
  {
    id: "3",
    name: "Studio BarberBook Moema",
    rating: 5,
    address: "Alameda dos Anapurus, 320 - São Paulo, SP",
    phone: "(11) 95555-0003",
    hours: "Seg à Dom • 08h às 22h",
    isOpen: true,
    email: "studio.moema@barberbook.com",
    status: "disponivel",
  },
  {
    id: "4",
    name: "Barbearia Clube Alphaville",
    rating: 4.7,
    address: "Alameda Rio Negro, 120 - Barueri, SP",
    phone: "(11) 98888-0004",
    hours: "Seg à Sáb • 09h às 19h",
    isOpen: false,
    email: "clube.alphaville@barberbook.com",
    status: "disponivel",
  },
  {
    id: "5",
    name: "BarberBook Vila Olímpia",
    rating: 4.9,
    address: "Rua Funchal, 500 - São Paulo, SP",
    phone: "(11) 97777-0005",
    hours: "Seg à Dom • 08h às 21h",
    isOpen: true,
    email: "vila.olimpia@barberbook.com",
    status: "disponivel",
  },
  {
    id: "6",
    name: "Barbearia Concept Pinheiros",
    rating: 4.8,
    address: "Rua dos Pinheiros, 620 - São Paulo, SP",
    phone: "(11) 94444-0006",
    hours: "Seg à Sáb • 09h às 20h",
    isOpen: true,
    email: "concept.pinheiros@barberbook.com",
    status: "disponivel",
  },
];


