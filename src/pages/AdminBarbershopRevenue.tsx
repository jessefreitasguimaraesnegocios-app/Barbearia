import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Scissors, TrendingUp, User, DollarSign } from "lucide-react";
import { loadServices } from "@/lib/services-storage";
import { loadCollaborators } from "@/lib/collaborators-storage";
import { loadVipData } from "@/lib/vips-storage";
import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";
import { Collaborator, PaymentMethod } from "@/data/collaborators";
import { VipData } from "@/data/vips";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AppointmentData {
  id: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  clientName?: string;
}

interface BookingConfirmation {
  appointments: AppointmentData[];
  payment: {
    fullName: string;
    phone: string;
    cpf: string;
  };
  timestamp: string;
  barbershopId?: string;
}

interface AppointmentRevenue {
  id: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  clientName: string;
  date: string;
  time: string;
  price: number;
  isVip: boolean;
  discountPercentage?: number;
}

interface BarberRevenue {
  barberId: string;
  barberName: string;
  totalRevenue: number;
  appointments: AppointmentRevenue[];
  appointmentCount: number;
}

interface VipRevenue {
  clientName: string;
  totalRevenue: number;
  appointments: AppointmentRevenue[];
  appointmentCount: number;
}

const AdminBarbershopRevenue = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [allBookings, setAllBookings] = useState<BookingConfirmation[]>([]);
  const [vipData, setVipData] = useState<VipData>(loadVipData());
  const currentMonth = new Date();

  useEffect(() => {
    const nextServices = loadServices();
    setServices(nextServices);
    
    const loadedCollaborators = loadCollaborators();
    setCollaborators(loadedCollaborators);
    
    const nextVipData = loadVipData();
    setVipData(nextVipData);
    
    const allStoredBookings: BookingConfirmation[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("bookingConfirmation")) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed && parsed.appointments) {
              if (Array.isArray(parsed)) {
                allStoredBookings.push(...parsed.filter((b: BookingConfirmation) => b && b.appointments));
              } else {
                allStoredBookings.push(parsed);
              }
            }
          }
        } catch {
          continue;
        }
      }
    }
    setAllBookings(allStoredBookings);

    const handleStorageChange = (event?: StorageEvent) => {
      if (!event || event.key === "barberbook_admin_vips") {
        const nextVipData = loadVipData();
        setVipData(nextVipData);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(...args) {
      originalSetItem.apply(this, args);
      if (args[0] === "barberbook_admin_vips") {
        handleStorageChange();
      }
    };

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  const getBarberIdFromCollaborator = (collaborator: Collaborator): string => {
    const nameSlug = collaborator.name.toLowerCase().replace(/\s+/g, "-");
    return nameSlug;
  };

  const getMonthAppointments = useMemo((): AppointmentRevenue[] => {
    const startDate = startOfMonth(currentMonth);
    const endDate = endOfMonth(currentMonth);
    
    const appointments: AppointmentRevenue[] = [];
    
    allBookings.forEach((booking) => {
      booking.appointments.forEach((apt) => {
        const aptDate = parseISO(apt.date);
        if (isWithinInterval(aptDate, { start: startDate, end: endDate })) {
          const service = services.find((s) => s.id === apt.serviceId);
          if (service) {
            const hasDiscount =
              service.promotionScope !== "none" &&
              service.discountPercentage !== null &&
              service.discountPercentage > 0;
            
            const isVip = service.promotionScope === "vip";
            
            const price = hasDiscount && isVip
              ? service.price * (1 - (service.discountPercentage! / 100))
              : hasDiscount
                ? service.price * (1 - (service.discountPercentage! / 100))
                : service.price;
            
            const collaborator = collaborators.find((c) => 
              c.id === apt.barberId || getBarberIdFromCollaborator(c) === apt.barberId
            );
            
            appointments.push({
              id: apt.id,
              serviceId: apt.serviceId,
              serviceName: service.title,
              barberId: apt.barberId,
              barberName: collaborator?.name || apt.barberId,
              clientName: apt.clientName || booking.payment.fullName,
              date: apt.date,
              time: apt.time,
              price,
              isVip,
              discountPercentage: hasDiscount ? service.discountPercentage : undefined,
            });
          }
        }
      });
    });
    
    return appointments;
  }, [allBookings, services, collaborators]);

  const barberRevenues = useMemo(() => {
    const barberMap = new Map<string, BarberRevenue>();
    
    getMonthAppointments.forEach((apt) => {
      if (!barberMap.has(apt.barberId)) {
        barberMap.set(apt.barberId, {
          barberId: apt.barberId,
          barberName: apt.barberName,
          totalRevenue: 0,
          appointments: [],
          appointmentCount: 0,
        });
      }
      
      const barber = barberMap.get(apt.barberId)!;
      barber.totalRevenue += apt.price;
      barber.appointments.push(apt);
      barber.appointmentCount += 1;
    });
    
    return Array.from(barberMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [getMonthAppointments]);

  const vipRevenues = useMemo(() => {
    const vipMap = new Map<string, VipRevenue>();
    
    // Adicionar agendamentos VIP do mês
    const vipAppointments = getMonthAppointments.filter((apt) => apt.isVip);
    
    vipAppointments.forEach((apt) => {
      const clientKey = apt.clientName.toLowerCase().trim();
      
      if (!vipMap.has(clientKey)) {
        vipMap.set(clientKey, {
          clientName: apt.clientName,
          totalRevenue: 0,
          appointments: [],
          appointmentCount: 0,
        });
      }
      
      const client = vipMap.get(clientKey)!;
      client.totalRevenue += apt.price;
      client.appointments.push(apt);
      client.appointmentCount += 1;
    });
    
    // Adicionar assinaturas VIP pagas (mesmo sem agendamentos no mês)
    vipData.members
      .filter((member) => member.paymentStatus === "paid")
      .forEach((member) => {
        const clientKey = member.name.toLowerCase().trim();
        const subscriptionPrice = member.billingCycle === "monthly" 
          ? vipData.config.priceMonthly 
          : vipData.config.priceAnnual;
        
        if (!vipMap.has(clientKey)) {
          vipMap.set(clientKey, {
            clientName: member.name,
            totalRevenue: 0,
            appointments: [],
            appointmentCount: 0,
          });
        }
        
        const client = vipMap.get(clientKey)!;
        client.totalRevenue += subscriptionPrice;
      });
    
    return Array.from(vipMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [getMonthAppointments, vipData]);

  const barbersWithChairRental = useMemo(() => {
    const barberIds = new Set<string>();
    collaborators.forEach((collaborator) => {
      const paymentMethod = collaborator.paymentMethod;
      const is100Percent = paymentMethod === "aluguel-cadeira-100" || paymentMethod === "recebe-100-por-cliente";
      const is50Percent = paymentMethod === "aluguel-cadeira-50" || paymentMethod === "recebe-50-por-cliente";
      
      if (is100Percent || is50Percent) {
        barberIds.add(collaborator.id);
        barberIds.add(getBarberIdFromCollaborator(collaborator));
      }
    });
    return barberIds;
  }, [collaborators]);

  const totalNonVipRevenue = useMemo(() => {
    return getMonthAppointments
      .filter((apt) => !apt.isVip && !barbersWithChairRental.has(apt.barberId))
      .reduce((sum, apt) => sum + apt.price, 0);
  }, [getMonthAppointments, barbersWithChairRental]);

  const totalVipRevenue = useMemo(() => {
    // Receita dos serviços VIP (com desconto)
    const vipFromNonRenters = getMonthAppointments
      .filter((apt) => apt.isVip && !barbersWithChairRental.has(apt.barberId))
      .reduce((sum, apt) => sum + apt.price, 0);
    
    const vipFromRenters = vipRevenues.reduce((sum, vip) => {
      const clientVipRevenue = vip.appointments
        .filter((apt) => !barbersWithChairRental.has(apt.barberId))
        .reduce((sum, apt) => sum + apt.price, 0);
      return sum + clientVipRevenue;
    }, 0);
    
    // Receita das assinaturas VIP pagas (mensais/anuais)
    const vipSubscriptionRevenue = vipData.members
      .filter((member) => member.paymentStatus === "paid")
      .reduce((sum, member) => {
        const subscriptionPrice = member.billingCycle === "monthly" 
          ? vipData.config.priceMonthly 
          : vipData.config.priceAnnual;
        return sum + subscriptionPrice;
      }, 0);
    
    return vipFromNonRenters + vipFromRenters + vipSubscriptionRevenue;
  }, [vipRevenues, getMonthAppointments, barbersWithChairRental, vipData]);

  const chairRentalRevenue = useMemo(() => {
    let totalRental = 0;
    
    collaborators.forEach((collaborator) => {
      const paymentMethod = collaborator.paymentMethod;
      const isChairRental = paymentMethod === "aluguel-cadeira-100" || 
                            paymentMethod === "aluguel-cadeira-50" ||
                            paymentMethod === "recebe-100-por-cliente" ||
                            paymentMethod === "recebe-50-por-cliente";
      
      // Usar apenas o valor personalizado do campo "Alugar Cadeira"
      if (isChairRental && collaborator.chairRentalAmount && collaborator.chairRentalAmount > 0) {
        totalRental += collaborator.chairRentalAmount;
      }
    });
    
    return totalRental;
  }, [collaborators]);

  const totalRevenue = useMemo(() => {
    return totalNonVipRevenue + totalVipRevenue + chairRentalRevenue;
  }, [totalNonVipRevenue, totalVipRevenue, chairRentalRevenue]);

  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/financas")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-display font-bold">
                Receita <span className="text-primary">Barbearia</span>
              </h1>
              <p className="text-muted-foreground">
                {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Receita Normal</p>
                    <p className="text-3xl font-bold text-primary">
                      {currencyFormatter.format(totalNonVipRevenue)}
                    </p>
                  </div>
                  <Scissors className="h-12 w-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Receita VIP</p>
                    <p className="text-3xl font-bold text-primary">
                      {currencyFormatter.format(totalVipRevenue)}
                    </p>
                  </div>
                  <TrendingUp className="h-12 w-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Aluguel de Cadeiras</p>
                    <p className="text-3xl font-bold text-primary">
                      {currencyFormatter.format(chairRentalRevenue)}
                    </p>
                  </div>
                  <User className="h-12 w-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Receita Total</p>
                    <p className="text-3xl font-bold text-primary">
                      {currencyFormatter.format(totalRevenue)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Normal + VIP + Aluguel
                    </p>
                  </div>
                  <DollarSign className="h-12 w-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5 text-primary" />
                  Receita por Barbeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {barberRevenues.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum agendamento registrado
                  </p>
                ) : (
                  <>
                    {barberRevenues.map((barber) => (
                      <div key={barber.barberId} className="p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <User className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-semibold">{barber.barberName}</span>
                          </div>
                          <span className="text-lg font-bold text-primary ml-2">
                            {currencyFormatter.format(barber.totalRevenue)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{barber.appointmentCount} {barber.appointmentCount === 1 ? "agendamento" : "agendamentos"}</span>
                          <span className="text-xs">
                            Média: {currencyFormatter.format(barber.totalRevenue / barber.appointmentCount)}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-border space-y-2 max-h-48 overflow-y-auto">
                          {barber.appointments.slice(0, 5).map((apt) => (
                            <div key={apt.id} className="flex items-center justify-between text-xs">
                              <div className="flex-1">
                                <span className="font-medium">{apt.serviceName}</span>
                                <span className="text-muted-foreground ml-2">
                                  {format(parseISO(apt.date), "dd/MM")} às {apt.time}
                                </span>
                                {apt.isVip && (
                                  <Badge variant="default" className="ml-2 text-xs">
                                    VIP
                                  </Badge>
                                )}
                              </div>
                              <span className="font-semibold">
                                {currencyFormatter.format(apt.price)}
                              </span>
                            </div>
                          ))}
                          {barber.appointments.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                              +{barber.appointments.length - 5} mais
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total</span>
                        <span className="text-2xl font-bold text-primary">
                          {currencyFormatter.format(totalRevenue)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Receita por Clientes VIP
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vipRevenues.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum cliente VIP registrado
                  </p>
                ) : (
                  <>
                    {vipRevenues.map((vip, index) => {
                      const hasAppointments = vip.appointments.length > 0;
                      const appointmentsRevenue = vip.appointments.reduce((sum, apt) => sum + apt.price, 0);
                      const hasSubscription = vip.totalRevenue > appointmentsRevenue;
                      
                      return (
                        <div key={`${vip.clientName}-${index}`} className="p-4 bg-secondary/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <User className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="font-semibold">{vip.clientName}</span>
                              <Badge variant="default" className="text-xs">
                                VIP
                              </Badge>
                            </div>
                            <span className="text-lg font-bold text-primary ml-2">
                              {currencyFormatter.format(vip.totalRevenue)}
                            </span>
                          </div>
                          {hasAppointments && (
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                              <span>{vip.appointmentCount} {vip.appointmentCount === 1 ? "agendamento" : "agendamentos"}</span>
                              {vip.appointmentCount > 0 && (
                                <span className="text-xs">
                                  Média: {currencyFormatter.format(vip.totalRevenue / vip.appointmentCount)}
                                </span>
                              )}
                            </div>
                          )}
                          {hasAppointments && (
                            <div className="pt-3 border-t border-border space-y-2 max-h-48 overflow-y-auto">
                              {vip.appointments.map((apt) => (
                                <div key={apt.id} className="flex items-center justify-between text-xs">
                                  <div className="flex-1">
                                    <span className="font-medium">{apt.serviceName}</span>
                                    <span className="text-muted-foreground ml-2">
                                      {format(parseISO(apt.date), "dd/MM")} às {apt.time}
                                    </span>
                                    <span className="text-muted-foreground ml-2">
                                      • {apt.barberName}
                                    </span>
                                    {apt.discountPercentage && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        -{apt.discountPercentage}%
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="font-semibold">
                                    {currencyFormatter.format(apt.price)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {hasSubscription && (
                            <div className="pt-3 border-t border-border">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Assinatura VIP</span>
                                <span className="font-semibold text-primary">
                                  {currencyFormatter.format(vip.totalRevenue - appointmentsRevenue)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total VIP</span>
                        <span className="text-2xl font-bold text-primary">
                          {currencyFormatter.format(totalVipRevenue)}
                        </span>
                      </div>
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

export default AdminBarbershopRevenue;

