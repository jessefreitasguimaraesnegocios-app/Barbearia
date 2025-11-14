import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Clock, User, Check, ArrowLeft } from "lucide-react";
import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";
import { loadServices } from "@/lib/services-storage";

interface Appointment {
  id: string;
  serviceId: string;
  barberId: string;
  date: Date;
  time: string;
  clientName?: string;
}

interface PaymentData {
  fullName: string;
  phone: string;
  cpf: string;
}

const barbers = [
  {
    id: "miguel-santos",
    name: "Miguel Santos",
    specialty: "Cortes Clássicos",
  },
  {
    id: "rafael-costa",
    name: "Rafael Costa",
    specialty: "Barbas Desenhadas",
  },
  {
    id: "andre-silva",
    name: "André Silva",
    specialty: "Cortes Modernos",
  },
  {
    id: "lucas-oliveira",
    name: "Lucas Oliveira",
    specialty: "Coloração",
  },
];

const ConfirmBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    fullName: "",
    phone: "",
    cpf: "",
  });

  useEffect(() => {
    const nextServices = loadServices();
    setServices(nextServices);

    const storedAppointments = localStorage.getItem("bookingAppointments");
    if (storedAppointments) {
      try {
        const parsed = JSON.parse(storedAppointments);
        const appointmentsWithDates = parsed.map((apt: Omit<Appointment, "date"> & { date: string }) => ({
          ...apt,
          date: new Date(apt.date),
        }));
        setAppointments(appointmentsWithDates);
      } catch {
        navigate("/booking");
      }
    } else {
      navigate("/booking");
    }
  }, [navigate]);

  const handleClientNameChange = (appointmentId: string, name: string) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === appointmentId ? { ...apt, clientName: name } : apt))
    );
  };

  const handlePaymentDataChange = (field: keyof PaymentData, value: string) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const isPaymentFormValid = () => {
    return (
      paymentData.fullName.trim().length >= 3 &&
      paymentData.phone.replace(/\D/g, "").length >= 10 &&
      paymentData.cpf.replace(/\D/g, "").length === 11
    );
  };

  const areAllClientNamesFilled = () => {
    return appointments.every((apt) => apt.clientName && apt.clientName.trim().length > 0);
  };

  const handlePayment = () => {
    if (isPaymentFormValid() && areAllClientNamesFilled()) {
      const bookingData = {
        appointments: appointments.map((apt) => ({
          ...apt,
          date: apt.date.toISOString(),
        })),
        payment: paymentData,
        timestamp: new Date().toISOString(),
      };
      
      localStorage.setItem("bookingConfirmation", JSON.stringify(bookingData));
      
      alert("Agendamento confirmado com sucesso!");
      localStorage.removeItem("bookingAppointments");
      navigate("/");
    }
  };

  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  const calculateTotal = () => {
    let total = 0;
    const vipServiceFirstOccurrence = new Map<string, boolean>();
    
    appointments.forEach((apt) => {
      const service = services.find((s) => s.id === apt.serviceId);
      if (service) {
        const hasDiscount =
          service.promotionScope !== "none" &&
          service.discountPercentage !== null &&
          service.discountPercentage > 0;
        
        if (hasDiscount && service.promotionScope === "vip") {
          const isFirst = !vipServiceFirstOccurrence.has(apt.serviceId);
          vipServiceFirstOccurrence.set(apt.serviceId, true);
          
          if (isFirst) {
            const discountedPrice = service.price * (1 - (service.discountPercentage! / 100));
            total += discountedPrice;
          } else {
            total += service.price;
          }
        } else if (hasDiscount) {
          const discountedPrice = service.price * (1 - (service.discountPercentage! / 100));
          total += discountedPrice;
        } else {
          total += service.price;
        }
      }
    });
    return total;
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/booking")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Confirmar <span className="text-primary">Agendamento</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Revise seus agendamentos e complete os dados para finalizar
            </p>
          </div>

          <div className="space-y-6">
            {/* Appointments Section */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl">Agendamentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointments.map((appointment, index) => {
                  const service = services.find((s) => s.id === appointment.serviceId);
                  const barber = barbers.find((b) => b.id === appointment.barberId);
                  const dateStr = appointment.date.toLocaleDateString("pt-BR");
                  
                  const hasDiscount =
                    service?.promotionScope !== "none" &&
                    service?.discountPercentage !== null &&
                    service?.discountPercentage > 0;
                  
                  const isVipFirstOccurrence = hasDiscount && 
                    service?.promotionScope === "vip" &&
                    appointments.findIndex((apt) => apt.serviceId === appointment.serviceId) === index;
                  
                  const finalPrice = hasDiscount && service?.promotionScope === "vip"
                    ? (isVipFirstOccurrence 
                        ? service!.price * (1 - (service!.discountPercentage! / 100))
                        : service!.price)
                    : hasDiscount
                      ? service!.price * (1 - (service!.discountPercentage! / 100))
                      : service?.price || 0;

                  return (
                    <div key={appointment.id} className="p-4 border border-border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{service?.title}</h3>
                            {isVipFirstOccurrence && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                VIP -{service?.discountPercentage}% (1ª vez)
                              </span>
                            )}
                            {service?.promotionScope === "vip" && hasDiscount && !isVipFirstOccurrence && (
                              <span className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded">
                                Sem desconto VIP
                              </span>
                            )}
                            {service?.promotionScope !== "vip" && hasDiscount && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                -{service?.discountPercentage}%
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{barber?.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{dateStr}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary">
                            {currencyFormatter.format(finalPrice)}
                          </p>
                          {hasDiscount && (
                            <p className="text-xs text-muted-foreground line-through">
                              {currencyFormatter.format(service!.price)}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`name-${appointment.id}`} className="text-sm font-medium">
                          Nome do Cliente para este serviço
                        </Label>
                        <Input
                          id={`name-${appointment.id}`}
                          value={appointment.clientName || ""}
                          onChange={(e) => handleClientNameChange(appointment.id, e.target.value)}
                          placeholder="Digite o nome do cliente"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Payment Section */}
            {areAllClientNamesFilled() && (
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle className="text-2xl">Dados para Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Nome Completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={paymentData.fullName}
                      onChange={(e) => handlePaymentDataChange("fullName", e.target.value)}
                      placeholder="Digite seu nome completo"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Número de Telefone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={paymentData.phone}
                      onChange={(e) => handlePaymentDataChange("phone", formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="mt-1"
                      maxLength={15}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cpf" className="text-sm font-medium">
                      CPF <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="cpf"
                      value={paymentData.cpf}
                      onChange={(e) => handlePaymentDataChange("cpf", formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="mt-1"
                      maxLength={14}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Total and Payment Button */}
            <Card className="shadow-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {currencyFormatter.format(calculateTotal())}
                  </span>
                </div>
                
                <Button
                  variant="hero"
                  className="w-full"
                  disabled={!isPaymentFormValid() || !areAllClientNamesFilled()}
                  onClick={handlePayment}
                >
                  Realizar Pagamento
                </Button>
                
                {(!areAllClientNamesFilled() || !isPaymentFormValid()) && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {!areAllClientNamesFilled()
                      ? "Preencha o nome do cliente em todos os serviços"
                      : "Preencha todos os campos obrigatórios para continuar"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ConfirmBooking;

