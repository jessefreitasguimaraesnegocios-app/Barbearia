import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Collaborator, COLLABORATOR_ROLES, CollaboratorRole, DEFAULT_COLLABORATORS } from "@/data/collaborators";
import { loadCollaborators, persistCollaborators, resetCollaboratorsToDefault } from "@/lib/collaborators-storage";
import { hashPassword } from "@/lib/password";
import { ArrowLeft, Trash2, RefreshCcw, Plus, Shield, Mail, Phone, UserCircle } from "lucide-react";

interface CollaboratorFormState {
  name: string;
  phone: string;
  email: string;
  cpf: string;
  role: CollaboratorRole;
  specialty: string;
  password: string;
}

const INITIAL_FORM_STATE: CollaboratorFormState = {
  name: "",
  phone: "",
  email: "",
  cpf: "",
  role: "barbeiro",
  specialty: "",
  password: "",
};

const AdminCollaborators = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collaborators, setCollaborators] = useState<Collaborator[]>(DEFAULT_COLLABORATORS);
  const [activeId, setActiveId] = useState<string | null>(DEFAULT_COLLABORATORS[0]?.id ?? null);
  const [formState, setFormState] = useState<CollaboratorFormState>(INITIAL_FORM_STATE);
  const initializedRef = useRef(false);

  useEffect(() => {
    const data = loadCollaborators();
    setCollaborators(data);
    setActiveId(data[0]?.id ?? null);
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }
    persistCollaborators(collaborators);
  }, [collaborators]);

  const selectedCollaborator = useMemo(
    () => collaborators.find((collaborator) => collaborator.id === activeId) ?? null,
    [collaborators, activeId],
  );

  useEffect(() => {
    if (selectedCollaborator) {
      setFormState({
        name: selectedCollaborator.name,
        phone: selectedCollaborator.phone,
        email: selectedCollaborator.email,
        cpf: selectedCollaborator.cpf,
        role: selectedCollaborator.role,
        specialty: selectedCollaborator.specialty,
        password: "",
      });
    } else {
      setFormState(INITIAL_FORM_STATE);
    }
  }, [selectedCollaborator]);

  const handleInputChange = <Key extends keyof CollaboratorFormState>(field: Key, value: CollaboratorFormState[Key]) => {
    setFormState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSelectCollaborator = (id: string) => {
    setActiveId(id);
  };

  const handleCreateNew = () => {
    setActiveId(null);
    setFormState(INITIAL_FORM_STATE);
  };

  const upsertCollaborator = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.name.trim() || !formState.email.trim() || !formState.cpf.trim()) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Preencha nome, e-mail e CPF do colaborador.",
      });
      return;
    }

    const normalizedEmail = formState.email.trim().toLowerCase();
    const normalizedCpf = formState.cpf.trim();

    const emailAlreadyUsed = collaborators.some(
      (collaborator) =>
        collaborator.email.toLowerCase() === normalizedEmail &&
        collaborator.id !== selectedCollaborator?.id,
    );

    if (emailAlreadyUsed) {
      toast({
        variant: "destructive",
        title: "E-mail já utilizado",
        description: "Escolha outro e-mail para o colaborador.",
      });
      return;
    }

    const cpfAlreadyUsed = collaborators.some(
      (collaborator) => collaborator.cpf === normalizedCpf && collaborator.id !== selectedCollaborator?.id,
    );

    if (cpfAlreadyUsed) {
      toast({
        variant: "destructive",
        title: "CPF já cadastrado",
        description: "Esse CPF já está vinculado a outro colaborador.",
      });
      return;
    }

    const applyPassword = (previousPassword: string) => {
      if (!formState.password) {
        return previousPassword;
      }
      return hashPassword(formState.password);
    };

    if (selectedCollaborator) {
      setCollaborators((previous) =>
        previous.map((collaborator) =>
          collaborator.id === selectedCollaborator.id
            ? {
                ...collaborator,
                name: formState.name.trim(),
                phone: formState.phone.trim(),
                email: normalizedEmail,
                cpf: normalizedCpf,
                role: formState.role,
                specialty: formState.specialty.trim(),
                password: applyPassword(collaborator.password),
              }
            : collaborator,
        ),
      );

      toast({
        title: "Colaborador atualizado",
        description: `${formState.name} teve os dados salvos com sucesso.`,
      });
      return;
    }

    const newCollaborator: Collaborator = {
      id: crypto.randomUUID(),
      name: formState.name.trim(),
      phone: formState.phone.trim(),
      email: normalizedEmail,
      cpf: normalizedCpf,
      role: formState.role,
      specialty: formState.specialty.trim(),
      password: hashPassword(formState.password || normalizedCpf),
      createdAt: new Date().toISOString(),
    };

    setCollaborators((previous) => {
      const updated = [...previous, newCollaborator];
      setActiveId(newCollaborator.id);
      return updated;
    });

    toast({
      title: "Colaborador adicionado",
      description: `${formState.name} foi incluído na equipe.`,
    });
  };

  const handleRemoveCollaborator = (id: string) => {
    setCollaborators((previous) => {
      const filtered = previous.filter((collaborator) => collaborator.id !== id);
      if (!filtered.length) {
        setActiveId(null);
        return [];
      }

      if (activeId === id) {
        setActiveId(filtered[0]?.id ?? null);
      }

      return filtered;
    });

    toast({
      title: "Colaborador removido",
      description: "Os dados de acesso foram atualizados.",
    });
  };

  const handleReset = () => {
    resetCollaboratorsToDefault();
    setCollaborators(DEFAULT_COLLABORATORS);
    setActiveId(DEFAULT_COLLABORATORS[0]?.id ?? null);
    toast({
      title: "Lista restaurada",
      description: "Os colaboradores padrão foram carregados novamente.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-display font-bold">
                  Gestão de <span className="text-primary">Colaboradores</span>
                </h1>
                <p className="text-muted-foreground">
                  Cadastre, edite e remova colaboradores com acesso ao painel e ao aplicativo.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Novo colaborador
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Restaurar padrão
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restaurar lista padrão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação substitui todos os colaboradores cadastrados pelos dados iniciais.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReset}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle>Equipe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {collaborators.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum colaborador cadastrado. Clique em &quot;Novo colaborador&quot; para adicionar.
                  </p>
                )}
                {collaborators.map((collaborator) => {
                  const isActive = collaborator.id === activeId;
                  return (
                    <button
                      key={collaborator.id}
                      onClick={() => handleSelectCollaborator(collaborator.id)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-gold"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-primary" />
                            {collaborator.name}
                          </p>
                          <span className="text-xs text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {collaborator.email}
                          </span>
                          {collaborator.specialty && (
                            <span className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                              <Shield className="h-3 w-3 text-muted-foreground" />
                              {collaborator.specialty}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline">
                          {
                            COLLABORATOR_ROLES.find((role) => role.value === collaborator.role)?.label ??
                            collaborator.role
                          }
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                {collaborators.length} colaborador(es) cadastrado(s)
              </CardFooter>
            </Card>

            <Card className="shadow-card border-border xl:col-span-2">
              <CardHeader>
                <CardTitle>{selectedCollaborator ? "Editar colaborador" : "Novo colaborador"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={upsertCollaborator}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collaborator-name">Nome completo</Label>
                      <Input
                        id="collaborator-name"
                        value={formState.name}
                        onChange={(event) => handleInputChange("name", event.target.value)}
                        placeholder="Nome e sobrenome"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collaborator-role">Função</Label>
                      <Select
                        value={formState.role}
                        onValueChange={(value: CollaboratorRole) => handleInputChange("role", value)}
                      >
                        <SelectTrigger id="collaborator-role">
                          <SelectValue placeholder="Escolha o cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          {COLLABORATOR_ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collaborator-email">E-mail</Label>
                      <Input
                        id="collaborator-email"
                        type="email"
                        value={formState.email}
                        onChange={(event) => handleInputChange("email", event.target.value)}
                        placeholder="colaborador@barberbook.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collaborator-specialty">Especialidade</Label>
                      <Input
                        id="collaborator-specialty"
                        value={formState.specialty}
                        onChange={(event) => handleInputChange("specialty", event.target.value)}
                        placeholder="Ex.: Barbearia clássica, atendimento ao cliente"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collaborator-phone">Telefone</Label>
                      <Input
                        id="collaborator-phone"
                        value={formState.phone}
                        onChange={(event) => handleInputChange("phone", event.target.value)}
                        placeholder="(11) 90000-0000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="collaborator-cpf">CPF</Label>
                      <Input
                        id="collaborator-cpf"
                        value={formState.cpf}
                        onChange={(event) => handleInputChange("cpf", event.target.value)}
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collaborator-password">
                        {selectedCollaborator ? "Nova senha (opcional)" : "Senha de acesso"}
                      </Label>
                      <Input
                        id="collaborator-password"
                        type="password"
                        value={formState.password}
                        onChange={(event) => handleInputChange("password", event.target.value)}
                        placeholder={selectedCollaborator ? "Informe apenas se desejar alterar" : "Defina uma senha"}
                        required={!selectedCollaborator}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-primary" />
                    <p className="text-muted-foreground">
                      Os dados cadastrados permitem o login em &quot;Entrar • Acesse sua conta&quot; utilizando
                      e-mail e senha.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-between gap-3">
                    <Button type="submit" variant="hero">
                      {selectedCollaborator ? "Salvar alterações" : "Adicionar colaborador"}
                    </Button>

                    {selectedCollaborator && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover colaborador
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. O colaborador perderá o acesso ao sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveCollaborator(selectedCollaborator.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminCollaborators;

