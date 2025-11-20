import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Barbershop, DEFAULT_BARBERSHOPS } from "@/data/barbershops";
import { loadBarbershops, persistBarbershops, resetBarbershopsToDefault } from "@/lib/barbershops-storage";
import { getEmptyInventory, persistInventory } from "@/lib/inventory-storage";
import { ArrowLeft, MapPin, Star, Phone, Clock, Trash2, Plus, RefreshCcw } from "lucide-react";

const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
};

const AdminProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [barbershops, setBarbershops] = useState<Barbershop[]>(DEFAULT_BARBERSHOPS);
  const [activeId, setActiveId] = useState<string | null>(DEFAULT_BARBERSHOPS[0]?.id ?? null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const initializedRef = useRef(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) {
      return numbers.length > 0 ? `(${numbers}` : numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  useEffect(() => {
    const data = loadBarbershops();
    setBarbershops(data);
    const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
    const initialId = storedActiveId ?? (data[0]?.id ?? null);
    setActiveId(initialId);
    if (initialId) {
      localStorage.setItem("admin_active_barbershop_id", initialId);
    }
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }
    persistBarbershops(barbershops);
  }, [barbershops]);

  const selectedBarbershop = useMemo(
    () => barbershops.find((item) => item.id === activeId) ?? null,
    [barbershops, activeId],
  );

  const handleSelect = (id: string) => {
    setActiveId(id);
    localStorage.setItem("admin_active_barbershop_id", id);
  };

  const handleUpdate = <Key extends keyof Barbershop>(field: Key, value: Barbershop[Key]) => {
    if (!selectedBarbershop) {
      return;
    }

    setBarbershops((previous) =>
      previous.map((item) =>
        item.id === selectedBarbershop.id ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSave = () => {
    if (!selectedBarbershop) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhuma barbearia selecionada.",
      });
      return;
    }

    if (!selectedBarbershop.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Preencha o nome da barbearia.",
      });
      return;
    }

    if (!selectedBarbershop.email.trim()) {
      toast({
        variant: "destructive",
        title: "E-mail obrigatório",
        description: "Preencha o e-mail da barbearia.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(selectedBarbershop.email.trim())) {
      toast({
        variant: "destructive",
        title: "E-mail inválido",
        description: "Informe um e-mail válido.",
      });
      return;
    }

    if (!selectedBarbershop.address.trim()) {
      toast({
        variant: "destructive",
        title: "Endereço obrigatório",
        description: "Preencha o endereço da barbearia.",
      });
      return;
    }

    const phoneNumbers = selectedBarbershop.phone.replace(/\D/g, "");
    if (phoneNumbers.length !== 11) {
      toast({
        variant: "destructive",
        title: "Telefone inválido",
        description: "O telefone deve conter exatamente 11 dígitos (DDD + 9 dígitos).",
      });
      return;
    }

    if (!selectedBarbershop.hours.trim()) {
      toast({
        variant: "destructive",
        title: "Horário obrigatório",
        description: "Preencha o horário de funcionamento.",
      });
      return;
    }

    persistBarbershops(barbershops);

    toast({
      title: "Salvo com sucesso",
      description: "As informações da barbearia foram salvas.",
    });
  };

  const handleRatingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value.replace(",", "."));
    if (Number.isNaN(nextValue)) {
      return;
    }

    const clamped = Math.min(Math.max(nextValue, 0), 5);
    handleUpdate("rating", Number(clamped.toFixed(1)));
  };

  const handleAddBarbershop = () => {
    const today = new Date();
    const vencimento = new Date(today);
    vencimento.setDate(vencimento.getDate() + 30);

    const newBarbershop: Barbershop = {
      id: generateUUID(),
      name: "",
      rating: 0,
      address: "",
      phone: "",
      hours: "",
      isOpen: true,
      email: "",
      status: "disponivel",
      dataVencimento: vencimento.toISOString().split("T")[0],
    };

    setBarbershops((previous) => {
      const updated = [...previous, newBarbershop];
      setActiveId(newBarbershop.id);
      localStorage.setItem("admin_active_barbershop_id", newBarbershop.id);
      return updated;
    });

    const emptyInventory = getEmptyInventory();
    persistInventory(emptyInventory, newBarbershop.id);

    setAgreedToTerms(false);
    setShowTermsDialog(false);

    toast({
      title: "Barbearia adicionada",
      description: "Preencha os detalhes da nova unidade.",
    });
  };

  const handleRemoveBarbershop = (id: string) => {
    setBarbershops((previous) => {
      const filtered = previous.filter((item) => item.id !== id);
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
      title: "Barbearia removida",
      description: "Os dados foram atualizados.",
    });
  };

  const handleResetDefaults = () => {
    setBarbershops(DEFAULT_BARBERSHOPS);
    setActiveId(DEFAULT_BARBERSHOPS[0]?.id ?? null);
    resetBarbershopsToDefault();
    toast({
      title: "Lista restaurada",
      description: "Os perfis padrão foram carregados novamente.",
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
                  Perfil da <span className="text-primary">Barbearia</span>
                </h1>
                <p className="text-muted-foreground">
                  Configure as informações exibidas na página de barbearias disponíveis.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <AlertDialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" onClick={() => setShowTermsDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova barbearia
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Termo de Uso - Mensalidade e Pagamento</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4 pt-4">
                        <div className="text-left space-y-3 text-sm">
                          <p>
                            <strong>1. Obrigação de Pagamento Mensal:</strong>
                          </p>
                          <p className="pl-4">
                            Ao cadastrar sua barbearia na plataforma BarberBook Pro, você concorda em pagar uma mensalidade para manter sua unidade ativa e disponível para os clientes.
                          </p>

                          <p>
                            <strong>2. Valor e Periodicidade:</strong>
                          </p>
                          <p className="pl-4">
                            A mensalidade será cobrada mensalmente. O valor será informado no momento do cadastro e poderá ser atualizado com aviso prévio de 30 dias.
                          </p>

                          <p>
                            <strong>3. Vencimento e Status:</strong>
                          </p>
                          <p className="pl-4">
                            O pagamento deve ser efetuado até a data de vencimento estipulada. Caso o pagamento não seja realizado:
                          </p>
                          <ul className="pl-8 list-disc space-y-1">
                            <li>Sua barbearia ficará com status "Indisponível" após o vencimento</li>
                            <li>O botão "Selecionar Barbearia" será desabilitado para os clientes</li>
                            <li>Após 3 (três) dias de atraso sem pagamento, o anúncio será automaticamente removido da plataforma</li>
                          </ul>

                          <p>
                            <strong>4. Renovação Automática:</strong>
                          </p>
                          <p className="pl-4">
                            Ao realizar o pagamento, o vencimento será automaticamente atualizado para os próximos 30 dias, mantendo sua barbearia disponível.
                          </p>

                          <p>
                            <strong>5. Restauração:</strong>
                          </p>
                          <p className="pl-4">
                            Caso seu anúncio seja removido por falta de pagamento, será necessário cadastrar novamente a barbearia após regularizar a situação.
                          </p>

                          <p>
                            <strong>6. Aceitação dos Termos:</strong>
                          </p>
                          <p className="pl-4">
                            Ao adicionar uma nova barbearia, você declara ter lido, compreendido e concordado com todos os termos acima relacionados à mensalidade e pagamento.
                          </p>
                        </div>

                        <div className="flex items-start space-x-3 pt-4 border-t border-border">
                          <Checkbox
                            id="agree-terms"
                            checked={agreedToTerms}
                            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                            className="mt-1"
                          />
                          <Label
                            htmlFor="agree-terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            Eu li e concordo com os termos de mensalidade e pagamento acima descritos
                          </Label>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setAgreedToTerms(false)}>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (agreedToTerms) {
                          setShowTermsDialog(false);
                          handleAddBarbershop();
                        } else {
                          toast({
                            title: "Aceite obrigatório",
                            description: "Você precisa concordar com os termos para adicionar uma barbearia.",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={!agreedToTerms}
                    >
                      Concordar e Adicionar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle>Unidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {barbershops.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma barbearia cadastrada. Adicione uma nova unidade para começar.
                  </p>
                )}
                {barbershops.map((barbershop) => {
                  const isActive = barbershop.id === activeId;
                  return (
                    <button
                      key={barbershop.id}
                      onClick={() => handleSelect(barbershop.id)}
                      className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-primary bg-primary/5 shadow-gold"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{barbershop.name || "Nova Barbearia"}</p>
                          <span className="text-xs text-muted-foreground">
                            {barbershop.email || "E-mail não informado"}
                          </span>
                        </div>
                        {isActive && <Badge variant="secondary">Selecionado</Badge>}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                {barbershops.length} unidade(s) configurada(s)
              </CardFooter>
            </Card>

            <Card className="shadow-card border-border xl:col-span-2">
              <CardHeader>
                <CardTitle>
                  {selectedBarbershop && (!selectedBarbershop.name || selectedBarbershop.name.trim() === "") 
                    ? "Nova Barbearia" 
                    : "Detalhes da barbearia"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedBarbershop && (
                  <p className="text-sm text-muted-foreground">
                    Selecione uma barbearia na lista ao lado ou adicione uma nova unidade.
                  </p>
                )}

                {selectedBarbershop && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="barbershop-name">Nome</Label>
                        <Input
                          id="barbershop-name"
                          value={selectedBarbershop.name}
                          onChange={(event) => handleUpdate("name", event.target.value)}
                          placeholder="Nome da barbearia"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="barbershop-email">E-mail</Label>
                        <Input
                          id="barbershop-email"
                          type="email"
                          value={selectedBarbershop.email}
                          onChange={(event) => handleUpdate("email", event.target.value)}
                          placeholder="contato@barberbook.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="barbershop-address">Endereço</Label>
                      <Textarea
                        id="barbershop-address"
                        value={selectedBarbershop.address}
                        onChange={(event) => handleUpdate("address", event.target.value)}
                        placeholder="Endereço completo"
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="barbershop-phone">Telefone</Label>
                        <Input
                          id="barbershop-phone"
                          type="tel"
                          value={selectedBarbershop.phone}
                          onChange={(event) => handleUpdate("phone", formatPhone(event.target.value))}
                          placeholder="(11) 90000-0000"
                          maxLength={15}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="barbershop-hours">Horário de funcionamento</Label>
                        <Input
                          id="barbershop-hours"
                          value={selectedBarbershop.hours}
                          onChange={(event) => handleUpdate("hours", event.target.value)}
                          placeholder="Seg à Sáb • 09h às 20h"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="barbershop-rating">Avaliação</Label>
                        <Input
                          id="barbershop-rating"
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={selectedBarbershop.rating}
                          onChange={handleRatingChange}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <Star className="h-4 w-4 text-primary" />
                        </span>
                        <div>
                          <p className="font-semibold">Status da unidade</p>
                          <p className="text-sm text-muted-foreground">
                            Indica se a barbearia aparece como aberta ou fechada
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={selectedBarbershop.isOpen}
                        onCheckedChange={(checked) => handleUpdate("isOpen", checked)}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="hero"
                      className="w-full"
                      onClick={handleSave}
                    >
                      Salvar
                    </Button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-border bg-secondary/40">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-semibold">Pré-visualização</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{selectedBarbershop.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            <span>{selectedBarbershop.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{selectedBarbershop.hours}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`mr-2 h-3 w-3 rounded-full ${
                                selectedBarbershop.isOpen ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            <span
                              className={`font-semibold ${
                                selectedBarbershop.isOpen ? "text-emerald-500" : "text-red-500"
                              }`}
                            >
                              {selectedBarbershop.isOpen ? "Aberto" : "Fechado"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="h-full">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover barbearia
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover barbearia?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. A unidade deixará de ser exibida para os clientes.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveBarbershop(selectedBarbershop.id)}>
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProfile;


