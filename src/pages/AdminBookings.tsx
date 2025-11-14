import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, DollarSign, Filter } from "lucide-react";
import { loadServices } from "@/lib/services-storage";
import { loadCollaborators } from "@/lib/collaborators-storage";
import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";
import { Collaborator } from "@/data/collaborators";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MouseEvent } from "react";

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
}

type PeriodFilter = "day" | "week" | "month";

const AdminBookings = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [allBookings, setAllBookings] = useState<BookingConfirmation[]>([]);
  const [isRevenueHidden, setIsRevenueHidden] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");

  useEffect(() => {
    const nextServices = loadServices();
    setServices(nextServices);
    
    const loadedCollaborators = loadCollaborators();
    setCollaborators(loadedCollaborators);
    
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
  }, []);

  const getBarberIdFromCollaborator = (collaborator: Collaborator): string => {
    const nameSlug = collaborator.name.toLowerCase().replace(/\s+/g, "-");
    return nameSlug;
  };

  const getFilteredAppointments = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (periodFilter) {
      case "day":
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case "week":
        startDate = startOfWeek(now, { locale: ptBR });
        endDate = endOfWeek(now, { locale: ptBR });
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }
    
    const appointments: Array<AppointmentData & { 
      clientName: string; 
      serviceName: string; 
      barberName: string;
      price: number;
      dateObj: Date;
    }> = [];
    
    allBookings.forEach((booking) => {
      booking.appointments.forEach((apt) => {
        const aptDate = parseISO(apt.date);
        if (isWithinInterval(aptDate, { start: startDate, end: endDate })) {
          const service = services.find((s) => s.id === apt.serviceId);
          const collaborator = collaborators.find((c) => 
            c.id === apt.barberId || getBarberIdFromCollaborator(c) === apt.barberId
          );
          
          if (service) {
            const hasDiscount =
              service.promotionScope !== "none" &&
              service.discountPercentage !== null &&
              service.discountPercentage > 0;
            
            const price = hasDiscount && service.promotionScope === "vip"
              ? service.price * (1 - (service.discountPercentage! / 100))
              : hasDiscount
                ? service.price * (1 - (service.discountPercentage! / 100))
                : service.price;
            
            appointments.push({
              ...apt,
              clientName: apt.clientName || booking.payment.fullName,
              serviceName: service.title,
              barberName: collaborator?.name || apt.barberId,
              price,
              dateObj: aptDate,
            });
          }
        }
      });
    });
    
    return appointments.sort((a, b) => {
      const dateCompare = a.dateObj.getTime() - b.dateObj.getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  };

  const filteredAppointments = useMemo(() => getFilteredAppointments(), [allBookings, services, collaborators, periodFilter]);

  const getAppointmentsByDate = () => {
    const grouped = new Map<string, typeof filteredAppointments>();
    
    filteredAppointments.forEach((apt) => {
      const dateKey = format(apt.dateObj, "yyyy-MM-dd");
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(apt);
    });
    
    return Array.from(grouped.entries()).map(([date, apts]) => ({
      date,
      dateObj: parseISO(date),
      appointments: apts,
    })).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  };

  const appointmentsByDate = useMemo(() => getAppointmentsByDate(), [filteredAppointments]);

  const totalRevenue = useMemo(() => {
    return filteredAppointments.reduce((sum, apt) => sum + apt.price, 0);
  }, [filteredAppointments]);

  const handleRevenueIconClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsRevenueHidden((prev) => !prev);
  };

  const handleAppointmentsCardClick = () => {
    const periods: PeriodFilter[] = ["day", "week", "month"];
    const currentIndex = periods.indexOf(periodFilter);
    const nextIndex = (currentIndex + 1) % periods.length;
    setPeriodFilter(periods[nextIndex]);
  };

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case "day":
        return "do Dia";
      case "week":
        return "da Semana";
      case "month":
        return "do Mês";
      default:
        return "do Mês";
    }
  };

  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-display font-bold">
                Agendamentos <span className="text-primary">{getPeriodLabel()}</span>
              </h1>
              <p className="text-muted-foreground">
                {periodFilter === "day" 
                  ? format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : periodFilter === "week"
                    ? `Semana de ${format(startOfWeek(new Date(), { locale: ptBR }), "dd/MM")} a ${format(endOfWeek(new Date(), { locale: ptBR }), "dd/MM/yyyy", { locale: ptBR })}`
                    : format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card 
              className="shadow-card border-border cursor-pointer transition-transform hover:-translate-y-1"
              onClick={handleAppointmentsCardClick}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total de Agendamentos</p>
                    <p className="text-3xl font-bold text-primary">{filteredAppointments.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</p>
                  </div>
                  <Calendar className="h-12 w-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Faturamento {getPeriodLabel()}</p>
                    <p className="text-3xl font-bold text-primary">
                      {isRevenueHidden ? "R$ ****" : currencyFormatter.format(totalRevenue)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRevenueIconClick}
                    className="-m-1 rounded-full p-1 transition-colors hover:bg-primary/10"
                    aria-label="Ocultar faturamento"
                  >
                    <DollarSign className="h-12 w-12 text-primary opacity-20" />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Dias com Agendamentos</p>
                    <p className="text-3xl font-bold text-primary">{appointmentsByDate.length}</p>
                  </div>
                  <Filter className="h-12 w-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {appointmentsByDate.length === 0 ? (
              <Card className="shadow-card border-border">
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">Nenhum agendamento este mês</p>
                  <p className="text-muted-foreground">
                    Não há agendamentos programados para o mês atual.
                  </p>
                </CardContent>
              </Card>
            ) : (
              appointmentsByDate.map(({ date, dateObj, appointments }) => (
                <Card key={date} className="shadow-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      <Badge variant="outline" className="ml-auto">
                        {appointments.length} {appointments.length === 1 ? "agendamento" : "agendamentos"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {appointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <User className="h-4 w-4 text-primary" />
                                <span className="font-semibold">{apt.clientName}</span>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">{apt.serviceName}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  Barbeiro: {apt.barberName}
                                </p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="flex items-center gap-1 text-primary font-semibold">
                                <Clock className="h-4 w-4" />
                                {apt.time}
                              </div>
                              <div className="text-sm font-medium text-primary">
                                {currencyFormatter.format(apt.price)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminBookings;

