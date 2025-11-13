import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Scissors, Clock, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";
import { loadServices } from "@/lib/services-storage";

const Services = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [selectedBarbershop, setSelectedBarbershop] = useState<{
    id: number;
    name: string;
    email: string;
  } | null>(null);
  const [isCheckingSelection, setIsCheckingSelection] = useState(true);
  const [contactName, setContactName] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isContactOpen, setIsContactOpen] = useState(false);
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  const calculateDiscountedPrice = (price: number, discountPercentage: number) => {
    const discounted = price * (1 - discountPercentage / 100);
    return Math.max(Number(discounted.toFixed(2)), 0);
  };

  useEffect(() => {
    const storedSelection = localStorage.getItem("selectedBarbershop");

    if (!storedSelection) {
      setIsCheckingSelection(false);
      navigate("/barbearias", { replace: true });
      return;
    }

    try {
      const parsedSelection = JSON.parse(storedSelection) as { id: number; name: string; email?: string };
      if (!parsedSelection?.id || !parsedSelection?.name || !parsedSelection?.email) {
        throw new Error("Barbershop selection incomplete");
      }
      setSelectedBarbershop({
        id: parsedSelection.id,
        name: parsedSelection.name,
        email: parsedSelection.email,
      });
    } catch {
      localStorage.removeItem("selectedBarbershop");
      setIsCheckingSelection(false);
      navigate("/barbearias", { replace: true });
      return;
    } finally {
      setIsCheckingSelection(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!isCheckingSelection && !selectedBarbershop) {
      navigate("/barbearias", { replace: true });
    }
  }, [isCheckingSelection, selectedBarbershop, navigate]);

  useEffect(() => {
    const nextServices = loadServices();
    setServices(nextServices);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "barberbook_admin_services") {
        setServices(loadServices());
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const adminEmail = useMemo(() => "admin@barberbook.com", []);

  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBarbershop) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: "Selecione uma barbearia antes de enviar a mensagem.",
      });
      return;
    }

    const subject = `Contato BarberBook - ${selectedBarbershop.name}`;
    const body = `
Barbearia: ${selectedBarbershop.name}
E-mail cadastrado: ${selectedBarbershop.email}
Nome do cliente: ${contactName}

Mensagem:
${contactMessage}
    `.trim();

    const mailtoLink = `mailto:${encodeURIComponent(adminEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;

    toast({
      title: "Mensagem pronta para envio",
      description: "Abrimos seu cliente de e-mail com a mensagem preenchida.",
    });

    setIsContactOpen(false);
    setContactName("");
    setContactMessage("");
  };

  if (isCheckingSelection || !selectedBarbershop) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
              Nossos <span className="text-primary">Serviços</span>
            </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Serviços profissionais com barbeiros experientes e produtos de alta qualidade
            </p>
            <div className="mt-4">
              <span className="text-sm uppercase tracking-wide text-muted-foreground">
                Barbearia selecionada:
              </span>
              <p className="text-2xl font-display font-semibold text-primary mt-1">
                {selectedBarbershop.name}
              </p>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {services.map((service, index) => (
              <Card key={service.id} className="shadow-card hover:shadow-gold transition-all duration-300 border-border">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Scissors className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-right">
                      {service.promotionScope !== "none" &&
                      service.discountPercentage !== null &&
                      service.discountPercentage > 0 ? (
                        <>
                          <div className="text-2xl font-bold text-primary">
                            {currencyFormatter.format(
                              calculateDiscountedPrice(service.price, service.discountPercentage)
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground line-through">
                            {currencyFormatter.format(service.price)}
                          </div>
                        </>
                      ) : (
                        <div className="text-2xl font-bold text-primary">
                          {currencyFormatter.format(service.price)}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {service.duration}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-start gap-2 mb-4">
                    <p className="text-muted-foreground flex-1">{service.description}</p>
                    {service.promotionScope !== "none" && (
                      <Badge variant={service.promotionScope === "vip" ? "default" : "outline"}>
                        {service.promotionScope === "vip" ? "Promoção VIP" : "Promoção Geral"}
                        {service.discountPercentage ? ` • -${service.discountPercentage}%` : ""}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 mb-6">
                    {service.features.length > 0 &&
                      service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/booking" className="block">
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => {
                        localStorage.setItem(
                          "selectedService",
                          JSON.stringify({
                            serviceId: service.id,
                            serviceName: service.title,
                            serviceIds: [service.id],
                            serviceNames: [service.title],
                          })
                        );
                      }}
                    >
                      Agendar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center">
            <Card className="shadow-gold border-primary/20 bg-gradient-to-br from-card to-secondary inline-block">
              <CardContent className="p-8">
                <h3 className="text-2xl font-display font-bold mb-2">Não encontrou o que procurava?</h3>
                <p className="text-muted-foreground mb-4">Entre em contato e fale com nossos especialistas</p>
                <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                  <DialogTrigger asChild>
                    <Button variant="hero">Fale Conosco</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Fale com a barbearia</DialogTitle>
                      <DialogDescription>
                        Envie sua mensagem que encaminhamos automaticamente para a equipe administrativa.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">Seu nome</Label>
                        <Input
                          id="contact-name"
                          placeholder="Digite seu nome"
                          value={contactName}
                          onChange={(event) => setContactName(event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">E-mail</Label>
                        <Input
                          id="contact-email"
                          value={selectedBarbershop.email}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-message">Mensagem</Label>
                        <Textarea
                          id="contact-message"
                          placeholder="Conte mais sobre o que você procura."
                          value={contactMessage}
                          onChange={(event) => setContactMessage(event.target.value)}
                          required
                          className="min-h-[140px]"
                        />
                      </div>
                      <DialogFooter className="flex flex-row items-center justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsContactOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" variant="hero" disabled={!contactName || !contactMessage}>
                          Enviar mensagem
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
