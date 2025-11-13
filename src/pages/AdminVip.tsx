import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_VIP_DATA, VipBillingCycle, VipData, VipMember, VipPaymentStatus } from "@/data/vips";
import { loadVipData, persistVipData, resetVipData } from "@/lib/vips-storage";
import { ArrowLeft, Calendar, Crown, Mail, Phone, RefreshCcw, Shield, Trash2, Wallet, PlusCircle } from "lucide-react";

interface VipMemberFormState {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  billingCycle: VipBillingCycle;
  paymentStatus: VipPaymentStatus;
}

const INITIAL_MEMBER_FORM: VipMemberFormState = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  billingCycle: "monthly",
  paymentStatus: "pending",
};

const BILLING_CYCLE_LABEL: Record<VipBillingCycle, string> = {
  monthly: "Mensal",
  annual: "Anual",
};

const PAYMENT_STATUS_LABEL: Record<VipPaymentStatus, string> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Em atraso",
};

const AdminVip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vipData, setVipData] = useState<VipData>(DEFAULT_VIP_DATA);
  const [memberForm, setMemberForm] = useState<VipMemberFormState>(INITIAL_MEMBER_FORM);
  const [benefitsInput, setBenefitsInput] = useState(DEFAULT_VIP_DATA.config.benefits.join("\n"));
  const initializedRef = useRef(false);

  useEffect(() => {
    const data = loadVipData();
    setVipData(data);
    setBenefitsInput(data.config.benefits.join("\n"));
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }
    persistVipData(vipData);
  }, [vipData]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    [],
  );

  const daysRemaining = (member: VipMember) => {
    const now = new Date();
    const expiresAt = new Date(member.expiresAt);
    const diff = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleConfigChange = <Key extends keyof VipData["config"]>(field: Key, value: VipData["config"][Key]) => {
    setVipData((previous) => ({
      ...previous,
      config: {
        ...previous.config,
        [field]: value,
      },
    }));
  };

  const handleBenefitsBlur = () => {
    const nextBenefits = benefitsInput
      .split("\n")
      .map((benefit) => benefit.trim())
      .filter(Boolean);

    handleConfigChange("benefits", nextBenefits);
    setBenefitsInput(nextBenefits.join("\n"));
  };

  const handleMemberFormChange = <Key extends keyof VipMemberFormState>(field: Key, value: VipMemberFormState[Key]) => {
    setMemberForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const durationToExpiration = (billingCycle: VipBillingCycle) => {
    const start = new Date();
    const expires = new Date(start);
    if (billingCycle === "monthly") {
      expires.setMonth(expires.getMonth() + 1);
    } else {
      expires.setFullYear(expires.getFullYear() + 1);
    }
    return expires.toISOString();
  };

  const handleAddVipMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!memberForm.name.trim() || !memberForm.email.trim() || !memberForm.cpf.trim()) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Informe nome, e-mail e CPF para cadastrar o VIP.",
      });
      return;
    }

    const normalizedEmail = memberForm.email.trim().toLowerCase();
    const exists = vipData.members.some((member) => member.email.toLowerCase() === normalizedEmail);

    if (exists) {
      toast({
        variant: "destructive",
        title: "Cadastro duplicado",
        description: "Já existe um VIP com este e-mail.",
      });
      return;
    }

    const joinedAt = new Date().toISOString();
    const newMember: VipMember = {
      id: crypto.randomUUID(),
      name: memberForm.name.trim(),
      email: normalizedEmail,
      phone: memberForm.phone.trim(),
      cpf: memberForm.cpf.trim(),
      billingCycle: memberForm.billingCycle,
      paymentStatus: memberForm.paymentStatus,
      joinedAt,
      expiresAt: durationToExpiration(memberForm.billingCycle),
    };

    setVipData((previous) => ({
      ...previous,
      members: [...previous.members, newMember],
    }));

    setMemberForm(INITIAL_MEMBER_FORM);

    toast({
      title: "VIP cadastrado",
      description: `${newMember.name} foi adicionado à lista.`,
    });
  };

  const handleRemoveVipMember = (id: string) => {
    setVipData((previous) => ({
      ...previous,
      members: previous.members.filter((member) => member.id !== id),
    }));

    toast({
      title: "VIP removido",
      description: "O acesso VIP foi revogado.",
    });
  };

  const handleUpdatePaymentStatus = (id: string, status: VipPaymentStatus) => {
    setVipData((previous) => ({
      ...previous,
      members: previous.members.map((member) =>
        member.id === id
          ? {
              ...member,
              paymentStatus: status,
            }
          : member,
      ),
    }));
  };

  const handleResetVipData = () => {
    resetVipData();
    setVipData(DEFAULT_VIP_DATA);
    setBenefitsInput(DEFAULT_VIP_DATA.config.benefits.join("\n"));
    toast({
      title: "Dados restaurados",
      description: "As informações padrão de VIP foram carregadas novamente.",
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
                  Clientes <span className="text-primary">VIP</span>
                </h1>
                <p className="text-muted-foreground">
                  Gerencie os assinantes VIP, benefícios disponíveis e condições de pagamento.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Restaurar padrão
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restaurar dados padrão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação substitui preços, benefícios e clientes cadastrados pelas informações iniciais.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetVipData}>
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
                <CardTitle>Configuração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vip-price">Valor da assinatura</Label>
                  <Input
                    id="vip-price"
                    value={vipData.config.price.toString().replace(".", ",")}
                    onChange={(event) => {
                      const normalized = event.target.value.replace(/[^\d,]/g, "").replace(",", ".");
                      const numeric = Number(normalized);
                      if (!Number.isNaN(numeric)) {
                        handleConfigChange("price", numeric);
                      }
                    }}
                    placeholder="Ex.: 199,90"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Plano padrão</Label>
                  <Select
                    value={vipData.config.billingCycle}
                    onValueChange={(value: VipBillingCycle) => handleConfigChange("billingCycle", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Benefícios</Label>
                  <Textarea
                    value={benefitsInput}
                    onChange={(event) => setBenefitsInput(event.target.value)}
                    onBlur={handleBenefitsBlur}
                    placeholder="Descreva cada benefício em uma linha"
                    className="min-h-[140px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Estes benefícios são apresentados aos clientes VIP.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span>
                      Valor atual:{" "}
                      <strong className="text-primary">
                        {currencyFormatter.format(vipData.config.price || 0)}
                      </strong>{" "}
                      ({BILLING_CYCLE_LABEL[vipData.config.billingCycle]})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border xl:col-span-2">
              <CardHeader>
                <CardTitle>Clientes VIP cadastrados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vipData.members.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum cliente VIP cadastrado. Utilize o formulário abaixo para registrar um novo assinante.
                  </p>
                )}

                <div className="space-y-3">
                  {vipData.members.map((member) => {
                    const remaining = daysRemaining(member);
                    const isExpired = remaining < 0;
                    const expiresLabel = isExpired
                      ? "Expirado"
                      : remaining === 0
                      ? "Expira hoje"
                      : `Restam ${remaining} dia(s)`;

                    return (
                      <Card key={member.id} className="border-border bg-secondary/30">
                        <CardContent className="p-4 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 text-lg font-semibold">
                                <Crown className="h-5 w-5 text-primary" />
                                {member.name}
                                <Badge variant="outline">{BILLING_CYCLE_LABEL[member.billingCycle]}</Badge>
                                <Badge
                                  variant={
                                    member.paymentStatus === "paid"
                                      ? "default"
                                      : member.paymentStatus === "pending"
                                      ? "outline"
                                      : "destructive"
                                  }
                                >
                                  {PAYMENT_STATUS_LABEL[member.paymentStatus]}
                                </Badge>
                              </div>
                              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-primary" />
                                  {member.email}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-primary" />
                                  {member.phone}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-primary" />
                                  {member.cpf}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground md:text-right">
                              <div className="flex items-center gap-2 justify-start md:justify-end">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>{expiresLabel}</span>
                              </div>
                              <div>Início: {new Date(member.joinedAt).toLocaleDateString()}</div>
                              <div>Expira: {new Date(member.expiresAt).toLocaleDateString()}</div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <Select
                              value={member.paymentStatus}
                              onValueChange={(value: VipPaymentStatus) => handleUpdatePaymentStatus(member.id, value)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Status de pagamento" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="overdue">Em atraso</SelectItem>
                              </SelectContent>
                            </Select>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover {member.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Essa ação revoga o acesso VIP imediatamente. Deseja continuar?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRemoveVipMember(member.id)}>
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                {vipData.members.length} cliente(s) VIP ativo(s)
              </CardFooter>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
            <Card className="shadow-card border-border xl:col-span-3">
              <CardHeader>
                <CardTitle>Adicionar novo VIP</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={handleAddVipMember}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vip-name">Nome completo</Label>
                      <Input
                        id="vip-name"
                        value={memberForm.name}
                        onChange={(event) => handleMemberFormChange("name", event.target.value)}
                        placeholder="Nome e sobrenome"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vip-email">E-mail</Label>
                      <Input
                        id="vip-email"
                        type="email"
                        value={memberForm.email}
                        onChange={(event) => handleMemberFormChange("email", event.target.value)}
                        placeholder="cliente@dominio.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vip-phone">WhatsApp</Label>
                      <Input
                        id="vip-phone"
                        value={memberForm.phone}
                        onChange={(event) => handleMemberFormChange("phone", event.target.value)}
                        placeholder="(11) 90000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vip-cpf">CPF</Label>
                      <Input
                        id="vip-cpf"
                        value={memberForm.cpf}
                        onChange={(event) => handleMemberFormChange("cpf", event.target.value)}
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Plano</Label>
                      <Select
                        value={memberForm.billingCycle}
                        onValueChange={(value: VipBillingCycle) => handleMemberFormChange("billingCycle", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="annual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status do pagamento</Label>
                      <Select
                        value={memberForm.paymentStatus}
                        onValueChange={(value: VipPaymentStatus) => handleMemberFormChange("paymentStatus", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="overdue">Em atraso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-primary" />
                      <span>Ao salvar, geramos a data de expiração automaticamente conforme o plano escolhido.</span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="hero">
                      Adicionar VIP
                    </Button>
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

export default AdminVip;


