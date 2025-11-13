import { Collaborator, DEFAULT_COLLABORATORS } from "@/data/collaborators";
import { hashPassword } from "@/lib/password";

const STORAGE_KEY = "barberbook_admin_collaborators";

const isValidCollaborator = (entry: unknown): entry is Collaborator => {
  if (!entry || typeof entry !== "object") {
    return false;
  }

  const typed = entry as Partial<Collaborator>;

  return (
    typeof typed.id === "string" &&
    typed.id.length > 0 &&
    typeof typed.name === "string" &&
    typed.name.length > 0 &&
    typeof typed.phone === "string" &&
    typeof typed.email === "string" &&
    typed.email.includes("@") &&
    typeof typed.cpf === "string" &&
    typeof typed.password === "string" &&
    typeof typed.role === "string" &&
    ["barbeiro", "barbeiro-junior", "faxineira", "socio", "atendente"].includes(typed.role) &&
    typeof typed.specialty === "string" &&
    typeof typed.createdAt === "string"
  );
};

const sanitizeCollaborator = (entry: Collaborator): Collaborator => ({
  ...entry,
  password: entry.password || hashPassword(entry.cpf),
  specialty: entry.specialty ?? "",
});

export const loadCollaborators = (): Collaborator[] => {
  if (typeof window === "undefined") {
    return DEFAULT_COLLABORATORS;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return DEFAULT_COLLABORATORS;
  }

  try {
    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return DEFAULT_COLLABORATORS;
    }

    const validCollaborators = parsed.filter(isValidCollaborator).map(sanitizeCollaborator);

    if (!validCollaborators.length) {
      return DEFAULT_COLLABORATORS;
    }

    return validCollaborators;
  } catch {
    return DEFAULT_COLLABORATORS;
  }
};

export const persistCollaborators = (collaborators: Collaborator[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(collaborators.map(sanitizeCollaborator)),
  );
};

export const resetCollaboratorsToDefault = () => {
  if (typeof window === "undefined") {
    return;
  }

  persistCollaborators(DEFAULT_COLLABORATORS);
};

