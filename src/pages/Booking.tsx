import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, User, Check, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import type { Matcher } from "react-day-picker";
import { addDays, isBefore, isSameDay, parseISO, startOfToday } from "date-fns";
import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";
import { loadServices } from "@/lib/services-storage";

interface Appointment {
  id: string;
  serviceId: string;
  barberId: string;
  date: Date;
  time: string;
}

const Booking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarbers, setSelectedBarbers] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(startOfToday());
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [tempBarberId, setTempBarberId] = useState<string>("");
  const [tempTime, setTempTime] = useState<string>("");
  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  const calculateDiscountedPrice = useMemo(
    () => (price: number, discountPercentage: number) => {
      const discounted = price * (1 - discountPercentage / 100);
      return Math.max(Number(discounted.toFixed(2)), 0);
    },
    []
  );

  useEffect(() => {
    const storedBarbershop = localStorage.getItem("selectedBarbershop");
    const storedService = localStorage.getItem("selectedService");

    if (!storedBarbershop || !storedService) {
      navigate("/services", { replace: true });
      return;
    }

    try {
      const parsedService = JSON.parse(storedService) as {
        serviceId?: string;
        serviceIds?: string[];
      };

      const ids =
        Array.isArray(parsedService.serviceIds) && parsedService.serviceIds.length > 0
          ? parsedService.serviceIds
          : parsedService.serviceId
          ? [parsedService.serviceId]
          : [];

      if (ids.length) {
        setSelectedServices(ids);
      }
    } catch {
      localStorage.removeItem("selectedService");
      navigate("/services", { replace: true });
    }
  }, [navigate]);

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

  const persistSelectedServices = (serviceIds: string[]) => {
    const validIds = serviceIds.filter((id) =>
      services.some((service) => service.id === id)
    );

    const serviceNames = validIds
      .map((id) => services.find((service) => service.id === id)?.title)
      .filter((name): name is string => Boolean(name));

    const payload: Record<string, unknown> = {
      serviceIds: validIds,
      serviceNames,
    };

    if (validIds.length > 0) {
      payload.serviceId = validIds[0];
      payload.serviceName =
        serviceNames[0] ??
        services.find((service) => service.id === validIds[0])?.title ??
        "";
    }

    localStorage.setItem("selectedService", JSON.stringify(payload));

    return validIds;
  };

  const handleAddService = (serviceId: string) => {
    setSelectedServices((previous) => [...previous, serviceId]);
  };

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices((previous) => {
      const serviceIndex = previous.findIndex((id) => id === serviceId);
      if (serviceIndex !== -1) {
        const newServices = [...previous];
        newServices.splice(serviceIndex, 1);
        return newServices;
      }
      return previous;
    });
  };

  const getServiceCount = (serviceId: string) => {
    return selectedServices.filter((id) => id === serviceId).length;
  };

  const getServicePrice = (service: ServiceItem, occurrenceIndex: number) => {
    const hasDiscount =
      service.promotionScope !== "none" &&
      service.discountPercentage !== null &&
      service.discountPercentage > 0;
    
    if (hasDiscount && service.promotionScope === "vip") {
      return occurrenceIndex === 0
        ? calculateDiscountedPrice(service.price, service.discountPercentage!)
        : service.price;
    }
    
    return hasDiscount
      ? calculateDiscountedPrice(service.price, service.discountPercentage!)
      : service.price;
  };

  useEffect(() => {
    setSelectedServices((previous) => {
      const filtered = previous.filter((id) => services.some((service) => service.id === id));

      if (filtered.length !== previous.length) {
        return persistSelectedServices(filtered);
      }

      return previous;
    });
  }, [services]);

  useEffect(() => {
    persistSelectedServices(selectedServices);
  }, [selectedServices, services]);

  useEffect(() => {
    if (selectedBarbers.length > selectedServices.length) {
      setSelectedBarbers(selectedBarbers.slice(0, selectedServices.length));
    }
  }, [selectedServices.length]);

  const barbers = [
    {
      id: "miguel-santos",
      name: "Miguel Santos",
      specialty: "Cortes Clássicos",
      experience: "8 anos",
      schedule: [
        {
          date: addDays(startOfToday(), 0).toISOString(),
          slots: ["09:00", "09:30", "10:30", "11:30", "14:00", "16:00"],
        },
        {
          date: addDays(startOfToday(), 1).toISOString(),
          slots: ["10:00", "11:00", "15:00", "17:00"],
        },
        {
          date: addDays(startOfToday(), 3).toISOString(),
          slots: ["09:30", "13:00", "18:00"],
        },
      ],
    },
    {
      id: "rafael-costa",
      name: "Rafael Costa",
      specialty: "Barbas Desenhadas",
      experience: "5 anos",
      schedule: [
        {
          date: addDays(startOfToday(), 0).toISOString(),
          slots: ["09:00", "11:00", "14:30", "18:00"],
        },
        {
          date: addDays(startOfToday(), 2).toISOString(),
          slots: ["10:30", "11:30", "15:30", "19:00"],
        },
        {
          date: addDays(startOfToday(), 4).toISOString(),
          slots: ["09:00", "09:30", "10:00", "16:00", "18:30"],
        },
      ],
    },
    {
      id: "andre-silva",
      name: "André Silva",
      specialty: "Cortes Modernos",
      experience: "10 anos",
      schedule: [
        {
          date: addDays(startOfToday(), 1).toISOString(),
          slots: ["09:30", "10:00", "14:00", "17:00"],
        },
        {
          date: addDays(startOfToday(), 2).toISOString(),
          slots: ["09:00", "09:30", "11:00", "15:30"],
        },
        {
          date: addDays(startOfToday(), 5).toISOString(),
          slots: ["08:00", "09:30", "11:30", "17:30", "19:00"],
        },
      ],
    },
    {
      id: "lucas-oliveira",
      name: "Lucas Oliveira",
      specialty: "Coloração",
      experience: "6 anos",
      schedule: [
        {
          date: addDays(startOfToday(), 0).toISOString(),
          slots: ["09:00", "10:00", "11:00", "14:00", "15:00"],
        },
        {
          date: addDays(startOfToday(), 2).toISOString(),
          slots: ["09:30", "10:30", "13:00", "16:30"],
        },
        {
          date: addDays(startOfToday(), 3).toISOString(),
          slots: ["09:00", "11:30", "14:00", "18:30"],
        },
      ],
    },
  ];

  const timeSlots = [
    "08:00", "08:30",
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];

  const getAvailableDatesForBarber = (barberId: string): Date[] => {
    const barber = barbers.find((b) => b.id === barberId);
    if (!barber) return [];
    
    return barber.schedule
      .map((entry) => parseISO(entry.date))
      .filter((date) => !isBefore(date, startOfToday()));
  };

  const getAvailableTimesForBarber = (barberId: string, date: Date): string[] => {
    const barber = barbers.find((b) => b.id === barberId);
    if (!barber) return [];
    
    const scheduleEntry = barber.schedule.find((entry) =>
      isSameDay(parseISO(entry.date), date)
    );
    return scheduleEntry?.slots ?? [];
  };

  const getAllAvailableDates = useMemo(() => {
    const allDates = new Set<number>();
    selectedBarbers.forEach((barberId) => {
      getAvailableDatesForBarber(barberId).forEach((date) => {
        allDates.add(date.getTime());
      });
    });
    return Array.from(allDates).map((time) => new Date(time));
  }, [selectedBarbers]);

  const disabledCalendarDays: Matcher[] = useMemo(() => {
    const base = [{ before: startOfToday() }];
    if (getAllAvailableDates.length === 0) {
      return base;
    }
    return [
      ...base,
      (date: Date) => !getAllAvailableDates.some((availableDate) => isSameDay(availableDate, date)),
    ];
  }, [getAllAvailableDates]);

  const getUnassignedServices = () => {
    const serviceCounts = new Map<string, number>();
    selectedServices.forEach((serviceId) => {
      serviceCounts.set(serviceId, (serviceCounts.get(serviceId) || 0) + 1);
    });
    
    const assignedCounts = new Map<string, number>();
    appointments.forEach((apt) => {
      assignedCounts.set(apt.serviceId, (assignedCounts.get(apt.serviceId) || 0) + 1);
    });
    
    const unassigned: string[] = [];
    serviceCounts.forEach((count, serviceId) => {
      const assigned = assignedCounts.get(serviceId) || 0;
      const remaining = count - assigned;
      for (let i = 0; i < remaining; i++) {
        unassigned.push(serviceId);
      }
    });
    
    return unassigned;
  };

  const addAppointment = (serviceId: string, barberId: string, date: Date, time: string) => {
    const newAppointment: Appointment = {
      id: `${Date.now()}-${Math.random()}`,
      serviceId,
      barberId,
      date,
      time,
    };
    setAppointments([...appointments, newAppointment]);
  };

  const removeAppointment = (appointmentId: string) => {
    setAppointments(appointments.filter((apt) => apt.id !== appointmentId));
  };

  useEffect(() => {
    if (step === 3) {
      if (tempBarberId) {
        const times = getAvailableTimesForBarber(tempBarberId, currentDate);
        setAvailableTimes(times);
      } else {
        const availableTimesForDate = new Set<string>();
        selectedBarbers.forEach((barberId) => {
          const times = getAvailableTimesForBarber(barberId, currentDate);
          times.forEach((time) => availableTimesForDate.add(time));
        });
        setAvailableTimes(Array.from(availableTimesForDate));
      }
    }
  }, [step, currentDate, selectedBarbers, tempBarberId]);

  const handleBack = () => {
    if (step === 1) {
      navigate("/services");
      return;
    }
    if (step === 3) {
      setTempBarberId("");
      setTempTime("");
    }
    setStep(Math.max(1, step - 1));
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Agendar <span className="text-primary">Horário</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Processo simples em 3 passos
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= num ? "bg-primary text-primary-foreground shadow-gold" : "bg-secondary text-muted-foreground"
                  }`}>
                    {step > num ? <Check className="h-5 w-5" /> : num}
                  </div>
                  {num < 3 && <div className={`w-16 h-1 ${step > num ? "bg-primary" : "bg-secondary"}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl">
                {step === 1 && "Escolha o Serviço"}
                {step === 2 && "Selecione o Barbeiro"}
                {step === 3 && "Escolha Data e Horário"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Step 1: Service Selection */}
              {step === 1 && (
                <div className="space-y-4">
                  {selectedServices.length > 0 && (
                    <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium">
                        Você selecionou <span className="font-semibold text-primary">{selectedServices.length}</span> {selectedServices.length === 1 ? "serviço" : "serviços"}
                      </p>
                    </div>
                  )}
                  
                  {selectedServices.length > 0 && (
                    <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                      <h4 className="font-semibold mb-3 text-sm">Serviços Selecionados:</h4>
                      <div className="space-y-2">
                        {services
                          .filter((service) => getServiceCount(service.id) > 0)
                          .map((service) => {
                            const count = getServiceCount(service.id);
                            const firstPrice = getServicePrice(service, 0);
                            const additionalPrice = service.promotionScope === "vip" && service.discountPercentage
                              ? service.price
                              : firstPrice;
                            const totalPrice = count === 1
                              ? firstPrice
                              : firstPrice + (additionalPrice * (count - 1));
                            
                            return (
                              <div key={service.id} className="flex items-center justify-between p-2 bg-background rounded border border-border">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{service.title}</span>
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      {count}x
                                    </span>
                                  </div>
                                  {service.promotionScope === "vip" && count > 1 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Desconto VIP aplicado apenas na 1ª unidade
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-primary">
                                    {currencyFormatter.format(totalPrice)}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveService(service.id);
                                    }}
                                    className="text-destructive hover:text-destructive/80 text-sm font-medium"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => {
                      const hasDiscount =
                        service.promotionScope !== "none" &&
                        service.discountPercentage !== null &&
                        service.discountPercentage > 0;
                      const finalPrice = hasDiscount
                        ? calculateDiscountedPrice(service.price, service.discountPercentage!)
                        : service.price;
                      const count = getServiceCount(service.id);

                      return (
                        <button
                          key={service.id}
                          onClick={() => handleAddService(service.id)}
                          className="p-6 rounded-lg border-2 text-left transition-all border-border hover:border-primary/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{service.title}</h3>
                            <div className="flex items-center gap-2">
                              {count > 0 && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-semibold">
                                  {count}x selecionado{count > 1 ? "s" : ""}
                                </span>
                              )}
                              {service.promotionScope === "vip" && (
                                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                                  VIP
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {service.duration}
                            </span>
                            <span className="flex flex-col items-end">
                              <span className="text-primary font-semibold text-base">
                                {currencyFormatter.format(finalPrice)}
                              </span>
                              {hasDiscount && (
                                <span className="text-xs text-muted-foreground line-through">
                                  {currencyFormatter.format(service.price)}
                                </span>
                              )}
                              {service.promotionScope === "vip" && hasDiscount && (
                                <span className="text-xs text-muted-foreground mt-1">
                                  Desconto apenas na 1ª vez
                                </span>
                              )}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Barber Selection */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">
                      Você selecionou <span className="font-semibold text-primary">{selectedServices.length}</span> {selectedServices.length === 1 ? "serviço" : "serviços"}
                    </p>
                    <p className="text-sm font-medium">
                      Selecione até <span className="text-primary font-semibold">{selectedServices.length}</span> {selectedServices.length === 1 ? "barbeiro" : "barbeiros"}
                      {selectedBarbers.length > 0 && (
                        <span className="text-muted-foreground"> ({selectedBarbers.length} {selectedBarbers.length === 1 ? "selecionado" : "selecionados"})</span>
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {barbers.map((barber) => {
                      const isSelected = selectedBarbers.includes(barber.id);
                      const maxSelected = selectedServices.length;
                      const canSelect = isSelected || selectedBarbers.length < maxSelected;
                      
                      return (
                        <button
                          key={barber.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedBarbers(selectedBarbers.filter(id => id !== barber.id));
                            } else if (canSelect) {
                              setSelectedBarbers([...selectedBarbers, barber.id]);
                            }
                          }}
                          disabled={!canSelect && !isSelected}
                          className={`p-6 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-gold"
                              : !canSelect
                                ? "border-border/50 bg-secondary/50 opacity-60 cursor-not-allowed"
                                : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start mb-3">
                            <div className="p-2 bg-primary/10 rounded-full mr-3">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{barber.name}</h3>
                              <p className="text-sm text-muted-foreground">{barber.specialty}</p>
                            </div>
                            {isSelected && (
                              <div className="ml-2">
                                <Check className="h-5 w-5 text-primary" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Experiência: {barber.experience}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Date & Time Selection */}
              {step === 3 && (
                <div className="space-y-6">
                  {appointments.length > 0 && (
                    <div className="p-4 bg-secondary/50 rounded-lg border border-border">
                      <h4 className="font-semibold mb-3 text-sm">Agendamentos Criados:</h4>
                      <div className="space-y-2">
                        {appointments.map((appointment) => {
                          const service = services.find((s) => s.id === appointment.serviceId);
                          const barber = barbers.find((b) => b.id === appointment.barberId);
                          const dateStr = appointment.date.toLocaleDateString("pt-BR");
                          
                          return (
                            <div key={appointment.id} className="flex items-center justify-between p-3 bg-background rounded border border-border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{service?.title}</span>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground">{barber?.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {dateStr} às {appointment.time}
                                </p>
                              </div>
                              <button
                                onClick={() => removeAppointment(appointment.id)}
                                className="text-destructive hover:text-destructive/80 p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {getUnassignedServices().length > 0 && (
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm font-medium">
                          Faltam <span className="font-semibold text-primary">{getUnassignedServices().length}</span> {getUnassignedServices().length === 1 ? "agendamento" : "agendamentos"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione barbeiro, data e horário para cada serviço
                        </p>
                      </div>

                      {(() => {
                        const unassigned = getUnassignedServices();
                        const currentServiceId = unassigned[0];
                        const currentService = services.find((s) => s.id === currentServiceId);

                        if (!currentService) return null;

                        const availableBarbersForService = selectedBarbers.length > 0 
                          ? selectedBarbers 
                          : barbers.map((b) => b.id);

                        const selectedBarberDates = tempBarberId 
                          ? getAvailableDatesForBarber(tempBarberId)
                          : getAllAvailableDates;

                        const selectedBarberTimes = tempBarberId && currentDate
                          ? getAvailableTimesForBarber(tempBarberId, currentDate)
                          : availableTimes;

                        return (
                          <div className="space-y-4 p-4 border border-border rounded-lg">
                            <div>
                              <h4 className="font-semibold mb-2 text-sm">
                                Agendando: <span className="text-primary">{currentService.title}</span>
                              </h4>
                            </div>

                            <div>
                              <label className="text-sm font-medium mb-2 block">Selecione o Barbeiro:</label>
                              <div className="grid grid-cols-2 gap-2">
                                {barbers
                                  .filter((b) => availableBarbersForService.includes(b.id))
                                  .map((barber) => (
                                    <button
                                      key={barber.id}
                                      onClick={() => {
                                        setTempBarberId(barber.id);
                                        setTempTime("");
                                        const dates = getAvailableDatesForBarber(barber.id);
                                        if (dates.length > 0) {
                                          setCurrentDate(dates[0]);
                                        }
                                      }}
                                      className={`p-3 rounded-lg border text-left transition-all ${
                                        tempBarberId === barber.id
                                          ? "border-primary bg-primary/5"
                                          : "border-border hover:border-primary/50"
                                      }`}
                                    >
                                      <div className="font-medium text-sm">{barber.name}</div>
                                      <div className="text-xs text-muted-foreground">{barber.specialty}</div>
                                    </button>
                                  ))}
                              </div>
                            </div>

                            {tempBarberId && (
                              <>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Selecione a Data:</label>
                                  <div className="flex justify-center">
                                    <Calendar
                                      mode="single"
                                      selected={currentDate}
                                      onSelect={(date) => {
                                        if (date) {
                                          setCurrentDate(date);
                                          setTempTime("");
                                        }
                                      }}
                                      fromDate={startOfToday()}
                                      disabled={(date) => {
                                        if (isBefore(date, startOfToday())) return true;
                                        return !selectedBarberDates.some((d) => isSameDay(d, date));
                                      }}
                                      className="w-full rounded-lg border border-border bg-card p-4"
                                    />
                                  </div>
                                </div>

                                {currentDate && (
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Selecione o Horário:</label>
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                      {timeSlots.map((time) => {
                                        const isAvailable = selectedBarberTimes.includes(time);
                                        const isSelected = tempTime === time;
                                        
                                        return (
                                          <button
                                            key={time}
                                            type="button"
                                            disabled={!isAvailable}
                                            onClick={() => {
                                              if (isAvailable) {
                                                setTempTime(time);
                                              }
                                            }}
                                            className={`p-2 rounded-lg border text-center text-sm transition-all ${
                                              isSelected
                                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                                : !isAvailable
                                                  ? "border-border/60 bg-secondary text-muted-foreground opacity-60 cursor-not-allowed"
                                                  : "border-border hover:border-primary hover:bg-primary/5"
                                            }`}
                                          >
                                            {time}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {tempTime && (
                                  <Button
                                    variant="hero"
                                    className="w-full"
                                    onClick={() => {
                                      if (tempBarberId && currentDate && tempTime && currentServiceId) {
                                        addAppointment(currentServiceId, tempBarberId, currentDate, tempTime);
                                        setTempBarberId("");
                                        setTempTime("");
                                        const nextUnassigned = getUnassignedServices().filter((id) => id !== currentServiceId);
                                        if (nextUnassigned.length > 0) {
                                          const dates = getAllAvailableDates;
                                          if (dates.length > 0) {
                                            setCurrentDate(dates[0]);
                                          }
                                        }
                                      }
                                    }}
                                  >
                                    Confirmar Agendamento
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {getUnassignedServices().length === 0 && appointments.length > 0 && (
                    <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium text-primary">
                        Todos os agendamentos foram criados!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  Voltar
                </Button>
                {step < 3 ? (
                  <Button
                    variant="hero"
                    onClick={() => {
                      if (step === 2 && selectedBarbers.length > 0) {
                        setSelectedBarber(selectedBarbers[0]);
                      }
                      if (step === 2) {
                        setTempBarberId("");
                        setTempTime("");
                        setAppointments([]);
                      }
                      setStep(step + 1);
                    }}
                    disabled={
                      (step === 1 && selectedServices.length === 0) ||
                      (step === 2 && selectedBarbers.length === 0)
                    }
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button 
                    variant="hero" 
                    disabled={appointments.length !== selectedServices.length}
                    onClick={() => {
                      if (appointments.length === selectedServices.length) {
                        const appointmentsToSave = appointments.map((apt) => ({
                          ...apt,
                          date: apt.date.toISOString(),
                        }));
                        localStorage.setItem("bookingAppointments", JSON.stringify(appointmentsToSave));
                        navigate("/booking/confirm");
                      }
                    }}
                  >
                    Confirmar Agendamento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Booking;

