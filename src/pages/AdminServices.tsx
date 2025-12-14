import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_SERVICES, PromotionScope, ServiceItem } from "@/data/services";
import { loadServices, persistServices, resetServicesToDefault } from "@/lib/services-storage";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, RefreshCcw, ArrowLeft, CheckCircle2 } from "lucide-react";

interface ServiceFormState {
  title: string;
  price: string;
  duration: string;
  description: string;
  features: string;
  promotionScope: PromotionScope;
  discountPercentage: string;
}

const INITIAL_FORM_STATE: ServiceFormState = {
  title: "",
  price: "",
  duration: "",
  description: "",
  features: "",
  promotionScope: "none",
  discountPercentage: "",
};

const AdminServices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [formState, setFormState] = useState<ServiceFormState>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const draggedIndexRef = useRef<number | null>(null);
  const servicesRef = useRef<ServiceItem[]>(services);

  useEffect(() => {
    setServices(loadServices());
  }, []);

  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  useEffect(() => {
    if (!isReordering) {
      draggedIndexRef.current = null;
    }
  }, [isReordering]);

  const formatDuration = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return numbers;
  };

  const handleInputChange = (field: keyof ServiceFormState) => (value: string) => {
    if (field === "duration") {
      const numbersOnly = formatDuration(value);
      setFormState((previous) => ({ ...previous, [field]: numbersOnly }));
    } else {
      setFormState((previous) => ({ ...previous, [field]: value }));
    }
  };

  const handlePromotionChange = (value: PromotionScope) => {
    setFormState((previous) => ({
      ...previous,
      promotionScope: value,
      discountPercentage: value === "none" ? "" : previous.discountPercentage || "5",
    }));
  };

  const discountOptions = useMemo(() => Array.from({ length: 20 }, (_, index) => ((index + 1) * 5).toString()), []);

  const parseFeatures = (rawFeatures: string) => {
    return rawFeatures
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);
  };

  const parsePrice = (rawPrice: string) => {
    const normalized = rawPrice.replace(/\s/g, "").replace(/[R$\u00A0]/gi, "");
    const withDot = normalized.replace(/\./g, "").replace(",", ".");
    const numeric = Number(withDot);

    if (!Number.isFinite(numeric) || numeric <= 0) {
      return NaN;
    }

    return Number(numeric.toFixed(2));
  };

  const resetForm = () => {
    setFormState(INITIAL_FORM_STATE);
  };

  const handleCreateService = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const numericPrice = parsePrice(formState.price);

      if (Number.isNaN(numericPrice)) {
        toast({
          variant: "destructive",
          title: "Preço inválido",
          description: "Informe um valor numérico maior que zero.",
        });
        setIsSubmitting(false);
        return;
      }

      const features = parseFeatures(formState.features);
      let discountValue: number | null = null;

      if (formState.promotionScope !== "none") {
        const parsedDiscount = Number(formState.discountPercentage);

        if (
          Number.isNaN(parsedDiscount) ||
          parsedDiscount <= 0 ||
          parsedDiscount > 100 ||
          parsedDiscount % 5 !== 0
        ) {
          toast({
            variant: "destructive",
            title: "Desconto inválido",
            description: "Selecione uma porcentagem entre 5% e 100%, em incrementos de 5%.",
          });
          setIsSubmitting(false);
          return;
        }

        discountValue = parsedDiscount;
      }

      if (!formState.title.trim() || !formState.duration.trim() || !formState.description.trim()) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Preencha título, duração e descrição do serviço.",
        });
        setIsSubmitting(false);
        return;
      }

      const durationValue = formState.duration.trim() ? `${formState.duration.trim()} min` : "";

      const newService: ServiceItem = {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `service-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: formState.title.trim(),
        price: numericPrice,
        duration: durationValue,
        description: formState.description.trim(),
        features,
        promotionScope: formState.promotionScope,
        discountPercentage: discountValue,
      };

      const updatedServices = [...services, newService];
      setServices(updatedServices);
      persistServices(updatedServices);

      toast({
        title: "Serviço cadastrado",
        description: `${newService.title} foi adicionado à listagem.`,
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate("/services")}>
            Ver página
          </Button>
        ),
      });

      resetForm();
      setIsSubmitting(false);
    } catch (error) {
      console.error("Erro ao adicionar serviço:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro ao adicionar o serviço. Tente novamente.",
      });
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    const filtered = services.filter((service) => service.id !== serviceId);
    setServices(filtered.length ? filtered : DEFAULT_SERVICES);
    persistServices(filtered.length ? filtered : DEFAULT_SERVICES);
    toast({
      title: "Serviço removido",
      description: "A listagem foi atualizada.",
    });
  };

  const handleResetToDefault = () => {
    resetServicesToDefault();
    setServices(DEFAULT_SERVICES);
    toast({
      title: "Lista restaurada",
      description: "Os serviços padrão foram carregados novamente.",
    });
  };

  const reorderServices = (fromIndex: number, toIndex: number) => {
    setServices((previous) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= previous.length || toIndex >= previous.length) {
        return previous;
      }

      const updated = [...previous];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      servicesRef.current = updated;
      return updated;
    });
  };

  const handleDragStart = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    if (!isReordering) {
      return;
    }
    draggedIndexRef.current = index;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", services[index].id);
  };

  const handleDragEnter = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    if (!isReordering) {
      return;
    }
    event.preventDefault();
    const fromIndex = draggedIndexRef.current;
    if (fromIndex === null || fromIndex === index) {
      return;
    }
    reorderServices(fromIndex, index);
    draggedIndexRef.current = index;
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!isReordering) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = () => {
    if (!isReordering) {
      return;
    }
    draggedIndexRef.current = null;
    persistServices(servicesRef.current);
  };

  const toggleReordering = () => {
    setIsReordering((previous) => {
      if (previous) {
        persistServices(servicesRef.current);
      }
      return !previous;
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
                  Gestão de <span className="text-primary">Serviços</span>
                </h1>
                <p className="text-muted-foreground">
                  Cadastre e atualize os serviços que serão exibidos para os clientes.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate("/services")}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Visualizar como cliente
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="shadow-card border-border xl:col-span-1">
              <CardHeader>
                <CardTitle>Novo serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreateService}>
                  <div className="space-y-2">
                    <Label htmlFor="service-title">Nome do serviço</Label>
                    <Input
                      id="service-title"
                      value={formState.title}
                      onChange={(event) => handleInputChange("title")(event.target.value)}
                      placeholder="Ex.: Corte Clássico"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service-price">Preço (R$)</Label>
                      <Input
                        id="service-price"
                        value={formState.price}
                        onChange={(event) => handleInputChange("price")(event.target.value)}
                        placeholder="Ex.: 45,00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="service-duration">Duração</Label>
                      <div className="relative">
                        <Input
                          id="service-duration"
                          type="text"
                          inputMode="numeric"
                          value={formState.duration}
                          onChange={(event) => handleInputChange("duration")(event.target.value)}
                          placeholder="Ex.: 45"
                          className="pr-12"
                          maxLength={3}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                          min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-description">Descrição</Label>
                    <Textarea
                      id="service-description"
                      value={formState.description}
                      onChange={(event) => handleInputChange("description")(event.target.value)}
                      placeholder="Descreva o serviço em até algumas linhas."
                      required
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-features">Diferenciais (um por linha)</Label>
                    <Textarea
                      id="service-features"
                      value={formState.features}
                      onChange={(event) => handleInputChange("features")(event.target.value)}
                      placeholder="Ex.: Toalha quente"
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Promoção</Label>
                    <Select
                      value={formState.promotionScope}
                      onValueChange={handlePromotionChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o público" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem promoção</SelectItem>
                        <SelectItem value="all">Todos os clientes</SelectItem>
                        <SelectItem value="vip">Clientes VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formState.promotionScope !== "none" && (
                    <div className="space-y-2">
                      <Label>Desconto (%)</Label>
                      <Select
                        value={formState.discountPercentage || discountOptions[0]}
                        onValueChange={(value) => handleInputChange("discountPercentage")(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o desconto" />
                        </SelectTrigger>
                        <SelectContent>
                          {discountOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}%
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Salvando..." : "Adicionar serviço"}
                    </Button>
                  </div>
                </form>
                <div className="mt-16">
                  <Button
                    type="button"
                    variant={isReordering ? "default" : "outline"}
                    className="w-full"
                    onClick={toggleReordering}
                  >
                    {isReordering ? "Concluir movimentação" : "Mover serviços"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border xl:col-span-2">
              <CardHeader>
                <CardTitle>Serviços cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service, serviceIndex) => {
                    return (
                      <div
                        key={service.id}
                        className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border border-border rounded-lg transition-shadow ${
                          isReordering ? "cursor-move hover:shadow-gold" : ""
                        }`}
                        draggable={isReordering}
                        onDragStart={handleDragStart(serviceIndex)}
                        onDragEnter={handleDragEnter(serviceIndex)}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        data-reordering={isReordering}
                        aria-grabbed={isReordering}
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{service.title}</h3>
                            {service.promotionScope !== "none" && (
                              <Badge variant={service.promotionScope === "vip" ? "default" : "outline"}>
                                {service.promotionScope === "vip" ? "Promoção VIP" : "Promoção Geral"}
                                {service.discountPercentage ? ` • -${service.discountPercentage}%` : ""}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {service.description}
                          </div>
                          {service.features.length > 0 && (
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                              {service.features.map((feature, index) => (
                                <li key={`${service.id}-${index}`}>{feature}</li>
                              ))}
                            </ul>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <span>
                              <strong>Preço:</strong> {currencyFormatter.format(service.price)}
                            </span>
                            <span>
                              <strong>Duração:</strong> {service.duration}
                            </span>
                          {service.promotionScope !== "none" && service.discountPercentage !== null && (
                            <span>
                              <strong>Desconto:</strong> -{service.discountPercentage}%
                            </span>
                          )}
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" disabled={isReordering}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover serviço?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Essa ação não pode ser desfeita. O serviço será removido da listagem de clientes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteService(service.id)}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminServices;

