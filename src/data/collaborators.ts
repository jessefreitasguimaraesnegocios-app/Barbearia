import { hashPassword } from "@/lib/password";

export type CollaboratorRole = "barbeiro" | "barbeiro-junior" | "faxineira" | "socio" | "atendente";
export type PaymentMethod = "salario-fixo" | "aluguel-cadeira-100" | "aluguel-cadeira-50";

export interface Collaborator {
  id: string;
  name: string;
  phone: string;
  email: string;
  cpf: string;
  password: string;
  role: CollaboratorRole;
  specialty: string;
  paymentMethod?: PaymentMethod;
  photoUrl?: string;
  experience?: string;
  workSchedule?: string;
  createdAt: string;
}

export const DEFAULT_COLLABORATORS: Collaborator[] = [
  {
    id: "c1",
    name: "Miguel Santos",
    phone: "(11) 99999-1234",
    email: "miguel.santos@barberbook.com",
    cpf: "123.456.789-00",
    password: hashPassword("senha123"),
    role: "barbeiro",
    specialty: "Cortes clássicos e barbas",
    paymentMethod: "aluguel-cadeira-100",
    createdAt: new Date("2024-01-05T10:00:00Z").toISOString(),
  },
  {
    id: "c2",
    name: "Ana Oliveira",
    phone: "(11) 98888-5678",
    email: "ana.oliveira@barberbook.com",
    cpf: "987.654.321-00",
    password: hashPassword("barberbook"),
    role: "socio",
    specialty: "Gestão administrativa",
    paymentMethod: "salario-fixo",
    createdAt: new Date("2024-02-01T15:30:00Z").toISOString(),
  },
];

export const COLLABORATOR_ROLES: Array<{ value: CollaboratorRole; label: string }> = [
  { value: "barbeiro", label: "Barbeiro" },
  { value: "barbeiro-junior", label: "Barbeiro Júnior" },
  { value: "faxineira", label: "Faxineira" },
  { value: "atendente", label: "Atendente" },
  { value: "socio", label: "Sócio" },
];

