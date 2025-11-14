import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, DollarSign, TrendingUp, UserCircle } from "lucide-react";
import { loadCollaborators } from "@/lib/collaborators-storage";
import { loadServices } from "@/lib/services-storage";
import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";
import { Collaborator } from "@/data/collaborators";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isSameDay, parseISO } from "date-fns";
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
}

type PeriodFilter = "day" | "week" | "month" | "year";

const CollaboratorDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [allBookings, setAllBookings] = useState<BookingConfirmation[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("day");

  useEffect(() => {
    const collaborators = loadCollaborators();
    const found = collaborators.find((c) => c.id === id);
    
    if (!found) {
      navigate("/admin/colaboradores");
      return;
    }
    
    setCollaborator(found);
    
    const nextServices = loadServices();
    setServices(nextServices);
    
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
  }, [id, navigate]);

  const getBarberIdFromCollaborator = (collaborator: Collaborator): string => {
    const nameSlug = collaborator.name.toLowerCase().replace(/\s+/g, "-");
    return nameSlug;
  };

  const getTodayAppointments = () => {
    if (!collaborator) return [];
    
    const today = startOfDay(new Date());
    const appointments: Array<AppointmentData & { clientName: string; serviceName: string }> = [];
    const barberId = getBarberIdFromCollaborator(collaborator);
    
    allBookings.forEach((booking) => {
      booking.appointments.forEach((apt) => {
        if (apt.barberId === collaborator.id || apt.barberId === barberId) {
          const aptDate = parseISO(apt.date);
          if (isSameDay(aptDate, today)) {
            const service = services.find((s) => s.id === apt.serviceId);
            appointments.push({
              ...apt,
              clientName: apt.clientName || booking.payment.fullName,
              serviceName: service?.title || "Serviço",
            });
          }
        }
      });
    });
    
    return appointments.sort((a, b) => a.time.localeCompare(b.time));
  };

  const getFilteredAppointments = () => {
    if (!collaborator) return [];
    
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
      case "year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }
    
    const appointments: Array<AppointmentData & { clientName: string; serviceName: string; price: number }> = [];
    const barberId = getBarberIdFromCollaborator(collaborator);
    
    allBookings.forEach((booking) => {
      booking.appointments.forEach((apt) => {
        if (apt.barberId === collaborator.id || apt.barberId === barberId) {
          const aptDate = parseISO(apt.date);
          if (aptDate >= startDate && aptDate <= endDate) {
            const service = services.find((s) => s.id === apt.serviceId);
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
                price,
              });
            }
          }
        }
      });
    });
    
    return appointments;
  };

  const getStats = () => {
    const filtered = getFilteredAppointments();
    const totalServices = filtered.length;
    const totalRevenue = filtered.reduce((sum, apt) => sum + apt.price, 0);
    
    return { totalServices, totalRevenue };
  };

  const todayAppointments = useMemo(() => getTodayAppointments(), [collaborator, allBookings, services]);
  const filteredAppointments = useMemo(() => getFilteredAppointments(), [collaborator, allBookings, services, periodFilter]);
  const stats = useMemo(() => getStats(), [filteredAppointments]);

  const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  if (!collaborator) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/colaboradores")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {!showProfile ? (
            <>
              <div className="text-center mb-12">
                <div className="flex justify-center mb-4">
                  <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-20 w-20 text-primary" />
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                  {collaborator.name}
                </h1>
                <p className="text-xl text-muted-foreground">{collaborator.specialty}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="shadow-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Agendamentos de Hoje
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {todayAppointments.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        Nenhum agendamento para hoje
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {todayAppointments.map((apt) => (
                          <div
                            key={apt.id}
                            className="p-3 border border-border rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{apt.clientName}</p>
                                <p className="text-sm text-muted-foreground">{apt.serviceName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {apt.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Estatísticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total de Serviços</p>
                        <p className="text-2xl font-bold text-primary">{stats.totalServices}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Arrecadado</p>
                        <p className="text-2xl font-bold text-primary">
                          {currencyFormatter.format(stats.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="hero"
                  onClick={() => setShowProfile(true)}
                  className="w-full md:w-auto"
                >
                  Ver Perfil Completo
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-12">
                <div className="flex justify-center mb-4">
                  <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-20 w-20 text-primary" />
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
                  Perfil do Colaborador
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="shadow-card border-border">
                  <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Nome Completo</p>
                        <p className="font-semibold">{collaborator.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{collaborator.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-semibold">{collaborator.phone}</p>
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline">{collaborator.specialty}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card border-border">
                  <CardHeader>
                    <CardTitle>Estatísticas de Serviços</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Período</label>
                      <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Hoje</SelectItem>
                          <SelectItem value="week">Esta Semana</SelectItem>
                          <SelectItem value="month">Este Mês</SelectItem>
                          <SelectItem value="year">Este Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-4 space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total de Serviços</p>
                        <p className="text-3xl font-bold text-primary">{stats.totalServices}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Arrecadado</p>
                        <p className="text-3xl font-bold text-primary flex items-center gap-2">
                          <DollarSign className="h-6 w-6" />
                          {currencyFormatter.format(stats.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {filteredAppointments.length > 0 && (
                <Card className="shadow-card border-border mb-6">
                  <CardHeader>
                    <CardTitle>Histórico de Serviços</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filteredAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{apt.clientName}</p>
                              <p className="text-sm text-muted-foreground">{apt.serviceName}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(apt.date), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {apt.time}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-primary">
                                {currencyFormatter.format(apt.price)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowProfile(false)}
                >
                  Voltar
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CollaboratorDetails;

