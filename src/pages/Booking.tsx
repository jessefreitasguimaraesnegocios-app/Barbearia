import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, User, Check, X, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import type { Matcher } from "react-day-picker";
import { addDays, isBefore, isSameDay, parseISO, startOfToday } from "date-fns";
import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";
import { loadServices } from "@/lib/services-storage";
import { loadCollaborators } from "@/lib/collaborators-storage";
import { Collaborator } from "@/data/collaborators";

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
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [existingBookings, setExistingBookings] = useState<Array<{
    barberId: string;
    date: string;
    time: string;
    serviceId?: string;
  }>>([]);
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

    const nextServices = loadServices();
    setServices(nextServices);

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
        const validIds = ids.filter((id) => nextServices.some((service) => service.id === id));
        if (validIds.length > 0) {
          setSelectedServices(validIds);
          
          setTimeout(() => {
            const firstSelectedId = validIds[0];
            const element = document.querySelector(`[data-service-id="${firstSelectedId}"]`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 300);
        }
      }
    } catch {
      localStorage.removeItem("selectedService");
      navigate("/services", { replace: true });
    }
  }, [navigate]);

  const loadExistingBookings = () => {
    const bookings: Array<{
      barberId: string;
      date: string;
      time: string;
      serviceId?: string;
    }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("bookingConfirmation")) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed && parsed.appointments && Array.isArray(parsed.appointments)) {
              parsed.appointments.forEach((apt: {
                barberId: string;
                date: string;
                time: string;
                serviceId?: string;
              }) => {
                if (apt.barberId && apt.date && apt.time) {
                  bookings.push({
                    barberId: apt.barberId,
                    date: apt.date,
                    time: apt.time,
                    serviceId: apt.serviceId,
                  });
                }
              });
            }
          }
        } catch {
          continue;
        }
      }
    }

    setExistingBookings(bookings);
  };

  useEffect(() => {
    const nextServices = loadServices();
    setServices(nextServices);

    const loadedCollaborators = loadCollaborators();
    setCollaborators(loadedCollaborators);

    loadExistingBookings();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "barberbook_admin_services") {
        const nextServices = loadServices();
        setServices(nextServices);
        
        const storedService = localStorage.getItem("selectedService");
        if (storedService) {
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

            if (ids.length > 0) {
              const validIds = ids.filter((id) => nextServices.some((service) => service.id === id));
              if (validIds.length > 0) {
                setSelectedServices(validIds);
              }
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }
      if (event.key === "barberbook_admin_collaborators") {
        setCollaborators(loadCollaborators());
      }
      if (event.key?.startsWith("bookingConfirmation")) {
        loadExistingBookings();
      }
    };

    window.addEventListener("storage", handleStorage);

    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(...args) {
      originalSetItem.apply(this, args);
      if (args[0]?.startsWith("bookingConfirmation")) {
        loadExistingBookings();
      }
    };

    return () => {
      window.removeEventListener("storage", handleStorage);
      localStorage.setItem = originalSetItem;
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

  const parseDurationToMinutes = (duration: string): number => {
    const match = duration.match(/(\d+)\s*(?:min|minutos?|m)?/i);
    return match ? parseInt(match[1], 10) : 0;
  };

  const getTotalDuration = (): number => {
    let totalMinutes = 0;
    selectedServices.forEach((serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        totalMinutes += parseDurationToMinutes(service.duration);
      }
    });
    return totalMinutes;
  };

  const formatTotalDuration = (minutes: number): string => {
    if (minutes === 0) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} ${hours === 1 ? "hora" : "horas"}`;
    return `${hours} ${hours === 1 ? "hora" : "horas"} e ${remainingMinutes} min`;
  };

  const getTimeSlotIndex = (time: string): number => {
    return timeSlots.indexOf(time);
  };

  const getNextTimeSlot = (time: string): string | null => {
    const currentIndex = getTimeSlotIndex(time);
    if (currentIndex === -1 || currentIndex >= timeSlots.length - 1) return null;
    return timeSlots[currentIndex + 1];
  };

  const getUnassignedServicesDuration = (): number => {
    const unassigned = getUnassignedServices();
    let totalMinutes = 0;
    unassigned.forEach((serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        totalMinutes += parseDurationToMinutes(service.duration);
      }
    });
    return totalMinutes;
  };

  const getRequiredSlotsForUnassignedServices = (): number => {
    const totalMinutes = getUnassignedServicesDuration();
    return Math.ceil(totalMinutes / 30);
  };

  const findSequentialSlots = (startTime: string, availableTimes: string[], requiredSlots: number): string[] => {
    const slots: string[] = [];
    let currentTime = startTime;

    for (let i = 0; i < requiredSlots && currentTime && availableTimes.includes(currentTime); i++) {
      slots.push(currentTime);
      currentTime = getNextTimeSlot(currentTime);
    }

    return slots.length === requiredSlots ? slots : [];
  };

  const createSequentialAppointments = (barberId: string, date: Date, startTime: string): void => {
    const unassigned = getUnassignedServices();
    if (unassigned.length === 0) return;

    const availableTimes = getAvailableTimesForBarber(barberId, date);
    const requiredSlots = getRequiredSlotsForUnassignedServices();
    const sequentialSlots = findSequentialSlots(startTime, availableTimes, requiredSlots);

    if (sequentialSlots.length === requiredSlots) {
      let slotIndex = 0;
      unassigned.forEach((serviceId) => {
        const service = services.find((s) => s.id === serviceId);
        if (service && slotIndex < sequentialSlots.length) {
          const serviceSlots = Math.ceil(parseDurationToMinutes(service.duration) / 30);
          const appointmentTime = sequentialSlots[slotIndex];
          
          addAppointment(serviceId, barberId, date, appointmentTime);
          slotIndex += serviceSlots;
        }
      });
    }
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

  const getBarberIdFromCollaborator = (collaborator: Collaborator): string => {
    const nameSlug = collaborator.name.toLowerCase().replace(/\s+/g, "-");
    return nameSlug;
  };

  const barbers = useMemo(() => {
    const barberCollaborators = collaborators.filter(
      (c) => c.role.includes("barbeiro")
    );

    if (barberCollaborators.length === 0) {
      return [
        {
          id: "miguel-santos",
          name: "Miguel Santos",
          specialty: "Cortes Clássicos",
          experience: "8 anos",
          photoUrl: undefined,
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
          photoUrl: undefined,
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
          photoUrl: undefined,
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
          photoUrl: undefined,
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
    }

    return barberCollaborators.map((collaborator) => {
      const barberId = getBarberIdFromCollaborator(collaborator);
      return {
        id: barberId,
        name: collaborator.name,
        specialty: collaborator.specialty || "Barbeiro",
        experience: collaborator.experience || "Experiente",
        photoUrl: collaborator.photoUrl,
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
      };
    });
  }, [collaborators]);

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

  const getOccupiedSlotsForService = (startTime: string, serviceId: string): string[] => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return [startTime];
    
    const durationMinutes = parseDurationToMinutes(service.duration);
    const requiredSlots = Math.ceil(durationMinutes / 30);
    const occupiedSlots: string[] = [];
    
    const currentIndex = getTimeSlotIndex(startTime);
    
    for (let i = 0; i < requiredSlots && currentIndex !== -1 && currentIndex + i < timeSlots.length; i++) {
      occupiedSlots.push(timeSlots[currentIndex + i]);
    }
    
    return occupiedSlots;
  };

  const getAvailableTimesForBarber = (barberId: string, date: Date): string[] => {
    const barber = barbers.find((b) => b.id === barberId);
    if (!barber) return [];
    
    const scheduleEntry = barber.schedule.find((entry) =>
      isSameDay(parseISO(entry.date), date)
    );
    const allSlots = scheduleEntry?.slots ?? [];
    
    // Filtrar horários já agendados para este barbeiro nesta data
    const bookedTimes = new Set<string>();
    
    // Verificar agendamentos existentes no localStorage
    existingBookings.forEach((booking) => {
      if (booking.barberId === barberId) {
        try {
          const bookingDate = parseISO(booking.date);
          if (isSameDay(bookingDate, date)) {
            // Bloquear todos os slots ocupados pelo serviço
            const occupiedSlots = booking.serviceId 
              ? getOccupiedSlotsForService(booking.time, booking.serviceId)
              : [booking.time];
            occupiedSlots.forEach((slot) => bookedTimes.add(slot));
          }
        } catch {
          // Ignorar datas inválidas
        }
      }
    });
    
    // Verificar também os agendamentos que estão sendo criados agora (mas não o atual)
    appointments.forEach((apt) => {
      if (apt.barberId === barberId && isSameDay(apt.date, date)) {
        // Bloquear todos os slots ocupados pelo serviço
        const occupiedSlots = getOccupiedSlotsForService(apt.time, apt.serviceId);
        occupiedSlots.forEach((slot) => bookedTimes.add(slot));
      }
    });
    
    // Retornar apenas os horários disponíveis que não estão agendados
    return allSlots.filter((time) => !bookedTimes.has(time));
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
    if (step === 2) {
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

  // Auto-selecionar barbeiro quando apenas um estiver selecionado
  useEffect(() => {
    if (step !== 2) return;
    
    const unassigned = getUnassignedServices();
    if (unassigned.length === 0) return;
    
    // Se houver exatamente 1 barbeiro selecionado e nenhum barbeiro temporário selecionado
    if (selectedBarbers.length === 1 && !tempBarberId) {
      const singleBarberId = selectedBarbers[0];
      setTempBarberId(singleBarberId);
      
      // Definir a primeira data disponível para esse barbeiro
      const dates = getAvailableDatesForBarber(singleBarberId);
      if (dates.length > 0) {
        setCurrentDate(dates[0]);
      }
    }
    
    // Não limpar tempBarberId quando há mais de um barbeiro - deixar o usuário escolher
    // A limpeza só acontece se o barbeiro selecionado não estiver mais na lista de selecionados
    if (tempBarberId && !selectedBarbers.includes(tempBarberId)) {
      const hasAppointmentsForThisBarber = appointments.some(apt => apt.barberId === tempBarberId);
      if (!hasAppointmentsForThisBarber) {
        setTempBarberId("");
        setTempTime("");
      }
    }
    
    // Se não houver barbeiros selecionados, limpar a seleção temporária
    if (selectedBarbers.length === 0 && tempBarberId) {
      const hasAppointmentsForThisBarber = appointments.some(apt => apt.barberId === tempBarberId);
      if (!hasAppointmentsForThisBarber) {
        setTempBarberId("");
        setTempTime("");
      }
    }
  }, [step, selectedBarbers, tempBarberId, appointments]);

  const handleBack = () => {
    if (step === 1) {
      navigate("/services");
      return;
    }
    if (step === 2) {
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
              Processo simples em 2 passos
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4">
              {[1, 2].map((num) => (
                <div key={num} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= num ? "bg-primary text-primary-foreground shadow-gold" : "bg-secondary text-muted-foreground"
                  }`}>
                    {step > num ? <Check className="h-5 w-5" /> : num}
                  </div>
                  {num < 2 && <div className={`w-16 h-1 ${step > num ? "bg-primary" : "bg-secondary"}`} />}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl">
                {step === 1 && "Escolha o Serviço"}
                {step === 2 && "Selecione o Barbeiro, Data e Horário"}
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
                                    className="text-destructive hover:text-destructive/80 p-1 rounded transition-colors"
                                    aria-label={`Remover ${service.title}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        <div className="flex items-center justify-between p-2 bg-primary/5 rounded border border-primary/20 mt-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">Tempo Total:</span>
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            {formatTotalDuration(getTotalDuration())}
                          </span>
                        </div>
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
                      const isSelected = count > 0;

                      return (
                        <button
                          key={service.id}
                          data-service-id={service.id}
                          onClick={() => handleAddService(service.id)}
                          className={`p-6 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-gold ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{service.title}</h3>
                                {isSelected && (
                                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                                )}
                              </div>
                              {count > 0 && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-semibold inline-block">
                                  {count}x selecionado{count > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
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

              {/* Step 2: Barber Selection with Date & Time */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">
                      Você selecionou <span className="font-semibold text-primary">{selectedServices.length}</span> {selectedServices.length === 1 ? "serviço" : "serviços"}
                    </p>
                    <p className="text-sm font-medium">
                      Selecione até <span className="text-primary font-semibold">{selectedServices.length}</span> {selectedServices.length === 1 ? "barbeiro" : "barbeiros"} e agende data e horário
                      {selectedBarbers.length > 0 && (
                        <span className="text-muted-foreground"> ({selectedBarbers.length} {selectedBarbers.length === 1 ? "selecionado" : "selecionados"})</span>
                      )}
                    </p>
                  </div>

                  {/* Barber Selection */}
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
                              setAppointments(appointments.filter(apt => apt.barberId !== barber.id));
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
                            <div className="h-12 w-12 rounded-full overflow-hidden bg-secondary border-2 border-primary mr-3 flex-shrink-0">
                              {barber.photoUrl ? (
                                <img
                                  src={barber.photoUrl}
                                  alt={barber.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center bg-primary/10">
                                  <User className="h-6 w-6 text-primary" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-lg">{barber.name}</h3>
                              <p className="text-sm text-muted-foreground">{barber.specialty}</p>
                              <p className="text-sm text-muted-foreground mt-1">Experiência: {barber.experience}</p>
                            </div>
                            {isSelected && (
                              <div className="ml-2 flex-shrink-0">
                                <Check className="h-5 w-5 text-primary" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Date & Time Selection for Selected Barbers */}
                  {selectedBarbers.length > 0 && (
                    <div className="space-y-4">
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
                                  <Check className="h-5 w-5 text-yellow-500 flex-shrink-0" />
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
                                <div className="text-center p-6 rounded-lg bg-primary/10 border border-primary/20 shadow-gold mb-4">
                                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                                    Agendando
                                  </p>
                                  <h3 className="text-2xl md:text-3xl font-display font-bold text-primary">
                                    {currentService.title}
                                  </h3>
                                </div>

                                {/* Só mostrar seleção de barbeiro se houver mais de um barbeiro selecionado */}
                                {selectedBarbers.length > 1 && (
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
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                                              tempBarberId === barber.id
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                            }`}
                                          >
                                            <div className="font-semibold text-sm">{barber.name}</div>
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Mostrar qual barbeiro está selecionado quando há apenas um */}
                                {selectedBarbers.length === 1 && tempBarberId && (
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Barbeiro Selecionado:</label>
                                    <div className="p-3 rounded-lg border-2 border-primary bg-primary/5">
                                      <div className="font-semibold text-sm">
                                        {barbers.find(b => b.id === tempBarberId)?.name || tempBarberId}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {tempBarberId && (
                                  <div className="space-y-4">
                                    <div>
                                      <label className="text-sm font-medium mb-2 block">Selecione a Data:</label>
                                      <div className="flex justify-center w-full">
                                        <Calendar
                                          mode="single"
                                          selected={currentDate}
                                          onSelect={(date) => {
                                            if (date) {
                                              setCurrentDate(date);
                                              setTempTime("");
                                            }
                                          }}
                                          disabled={(date) => {
                                            const dates = getAvailableDatesForBarber(tempBarberId);
                                            return !dates.some((d) => isSameDay(d, date));
                                          }}
                                          className="rounded-md border w-full max-w-lg"
                                        />
                                      </div>
                                    </div>

                                    {currentDate && (
                                      <div>
                                        <label className="text-sm font-medium mb-2 block">Selecione o Horário:</label>
                                        <div className="grid grid-cols-4 gap-2">
                                          {(() => {
                                            const times = getAvailableTimesForBarber(tempBarberId, currentDate);
                                            if (times.length === 0) {
                                              return (
                                                <div className="col-span-4 text-center py-8 px-4 bg-secondary/50 rounded-lg border border-border">
                                                  <p className="text-muted-foreground font-medium">Horários Esgotados</p>
                                                  <p className="text-sm text-muted-foreground mt-1">Não há horários disponíveis para este dia.</p>
                                                </div>
                                              );
                                            }
                                            return times.map((time) => {
                                              const isSelected = tempTime === time;
                                              const isAvailable = times.includes(time);
                                              
                                              const unassigned = getUnassignedServices();
                                              const willBeSequentiallySelected = unassigned.length > 1 && 
                                                tempTime && 
                                                time !== tempTime &&
                                                getTimeSlotIndex(time) > getTimeSlotIndex(tempTime) &&
                                                getTimeSlotIndex(time) <= getTimeSlotIndex(tempTime) + getRequiredSlotsForUnassignedServices() - 1;

                                              return (
                                                <button
                                                  key={time}
                                                  onClick={() => {
                                                    if (isAvailable) {
                                                      if (isSelected) {
                                                        setTempTime("");
                                                      } else {
                                                        setTempTime(time);
                                                      }
                                                    }
                                                  }}
                                                  className={`p-2 rounded-lg border text-center text-sm transition-all ${
                                                    isSelected
                                                      ? "border-primary bg-primary/10 text-primary font-semibold"
                                                      : willBeSequentiallySelected
                                                        ? "border-primary/50 bg-primary/5 text-primary font-medium"
                                                        : !isAvailable
                                                          ? "border-border/60 bg-secondary text-muted-foreground opacity-60 cursor-not-allowed"
                                                          : "border-border hover:border-primary hover:bg-primary/5"
                                                  }`}
                                                >
                                                  {time}
                                                </button>
                                              );
                                            });
                                          })()}
                                        </div>
                                      </div>
                                    )}

                                    {tempTime && (
                                      <Button
                                        variant="hero"
                                        className="w-full"
                                        onClick={() => {
                                          const unassigned = getUnassignedServices();
                                          
                                          if (unassigned.length > 1 && tempBarberId && currentDate) {
                                            const availableTimes = getAvailableTimesForBarber(tempBarberId, currentDate);
                                            const requiredSlotsForAll = getRequiredSlotsForUnassignedServices();
                                            const sequentialSlots = findSequentialSlots(tempTime, availableTimes, requiredSlotsForAll);
                                            
                                            if (sequentialSlots.length === requiredSlotsForAll) {
                                              createSequentialAppointments(tempBarberId, currentDate, tempTime);
                                            } else {
                                              if (currentServiceId) {
                                                addAppointment(currentServiceId, tempBarberId, currentDate, tempTime);
                                              }
                                            }
                                          } else {
                                            if (tempBarberId && currentDate && tempTime && currentServiceId) {
                                              addAppointment(currentServiceId, tempBarberId, currentDate, tempTime);
                                            }
                                          }
                                          
                                          setTempBarberId("");
                                          setTempTime("");
                                          const nextUnassigned = getUnassignedServices();
                                          if (nextUnassigned.length > 0) {
                                            const dates = getAllAvailableDates;
                                            if (dates.length > 0) {
                                              setCurrentDate(dates[0]);
                                            }
                                          }
                                        }}
                                      >
                                        {(() => {
                                          const unassigned = getUnassignedServices();
                                          if (unassigned.length > 1 && tempTime && tempBarberId && currentDate) {
                                            const availableTimes = getAvailableTimesForBarber(tempBarberId, currentDate);
                                            const requiredSlotsForAll = getRequiredSlotsForUnassignedServices();
                                            const sequentialSlots = findSequentialSlots(tempTime, availableTimes, requiredSlotsForAll);
                                            
                                            if (sequentialSlots.length === requiredSlotsForAll) {
                                              return `Agendar ${unassigned.length} Serviços Sequencialmente`;
                                            }
                                          }
                                          return "Confirmar Agendamento";
                                        })()}
                                      </Button>
                                    )}
                                  </div>
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
                </div>
              )}

              {/* Step 3 removed - integrated into Step 2 */}
              {step === 999 && (
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
                              <Check className="h-5 w-5 text-yellow-500 flex-shrink-0" />
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
                            <div className="text-center p-6 rounded-lg bg-primary/10 border border-primary/20 shadow-gold mb-4">
                              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">
                                Agendando
                              </p>
                              <h3 className="text-2xl md:text-3xl font-display font-bold text-primary">
                                {currentService.title}
                              </h3>
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
                                      <div className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-full overflow-hidden bg-secondary border border-primary flex-shrink-0">
                                          {barber.photoUrl ? (
                                            <img
                                              src={barber.photoUrl}
                                              alt={barber.name}
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <div className="h-full w-full flex items-center justify-center bg-primary/10">
                                              <User className="h-5 w-5 text-primary" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm">{barber.name}</div>
                                          <div className="text-xs text-muted-foreground">{barber.specialty}</div>
                                          {barber.experience && (
                                            <div className="text-xs text-muted-foreground">{barber.experience}</div>
                                          )}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            </div>

                            {tempBarberId && (
                              <>
                                <div>
                                  <label className="text-sm font-medium mb-4 block">Selecione a Data:</label>
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
                                      toDate={addDays(startOfToday(), 30)}
                                      disabled={(date) => {
                                        const today = startOfToday();
                                        const maxDate = addDays(today, 30);
                                        if (isBefore(date, today)) return true;
                                        if (isBefore(maxDate, date)) return true;
                                        return !selectedBarberDates.some((d) => isSameDay(d, date));
                                      }}
                                      className="w-full max-w-md mx-auto rounded-lg border border-border bg-card p-6"
                                      classNames={{
                                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                        month: "space-y-4",
                                        caption: "flex justify-center pt-1 relative items-center",
                                        caption_label: "text-base font-semibold",
                                        nav: "space-x-1 flex items-center",
                                        table: "w-full border-collapse space-y-1",
                                        head_row: "flex",
                                        head_cell: "text-muted-foreground rounded-md w-12 font-normal text-sm",
                                        row: "flex w-full mt-2",
                                        cell: "h-12 w-12 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                        day: "h-12 w-12 p-0 font-normal text-base aria-selected:opacity-100",
                                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                        day_today: "border-2 border-primary font-semibold",
                                        day_outside: "text-muted-foreground opacity-30",
                                        day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed",
                                      }}
                                    />
                                  </div>
                                </div>

                                {currentDate && (
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Selecione o Horário:</label>
                                    {(() => {
                                      const unassigned = getUnassignedServices();
                                      const requiredSlots = getRequiredSlotsForUnassignedServices();
                                      const selectedBarberTimes = tempBarberId && currentDate
                                        ? getAvailableTimesForBarber(tempBarberId, currentDate)
                                        : [];
                                      
                                      if (selectedBarberTimes.length === 0) {
                                        return (
                                          <div className="text-center py-8 px-4 bg-secondary/50 rounded-lg border border-border">
                                            <p className="text-muted-foreground font-medium">Horários Esgotados</p>
                                            <p className="text-sm text-muted-foreground mt-1">Não há horários disponíveis para este dia.</p>
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <>
                                          {unassigned.length > 1 && (
                                            <p className="text-xs text-muted-foreground mb-2">
                                              Selecionando um horário, serão agendados {unassigned.length} serviços sequencialmente ({formatTotalDuration(getUnassignedServicesDuration())})
                                            </p>
                                          )}
                                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                            {timeSlots.map((time) => {
                                              const isAvailable = selectedBarberTimes.includes(time);
                                              const isSelected = tempTime === time;
                                              
                                              let willBeSequentiallySelected = false;
                                              if (isAvailable && unassigned.length > 1 && tempTime) {
                                                const requiredSlotsForAll = getRequiredSlotsForUnassignedServices();
                                                const sequentialSlots = findSequentialSlots(tempTime, selectedBarberTimes, requiredSlotsForAll);
                                                willBeSequentiallySelected = sequentialSlots.includes(time) && time !== tempTime;
                                              }
                                              
                                              return (
                                                <button
                                                  key={time}
                                                  type="button"
                                                  disabled={!isAvailable}
                                                  onClick={() => {
                                                    if (isAvailable && tempBarberId && currentDate) {
                                                      if (unassigned.length > 1) {
                                                        const availableTimes = getAvailableTimesForBarber(tempBarberId, currentDate);
                                                        const requiredSlotsForAll = getRequiredSlotsForUnassignedServices();
                                                        const sequentialSlots = findSequentialSlots(time, availableTimes, requiredSlotsForAll);
                                                        
                                                        if (sequentialSlots.length === requiredSlotsForAll) {
                                                          createSequentialAppointments(tempBarberId, currentDate, time);
                                                          setTempBarberId("");
                                                          setTempTime("");
                                                          const nextUnassigned = getUnassignedServices();
                                                          if (nextUnassigned.length > 0) {
                                                            const dates = getAllAvailableDates;
                                                            if (dates.length > 0) {
                                                              setCurrentDate(dates[0]);
                                                            }
                                                          }
                                                        } else {
                                                          setTempTime(time);
                                                        }
                                                      } else {
                                                        setTempTime(time);
                                                      }
                                                    }
                                                  }}
                                                  className={`p-2 rounded-lg border text-center text-sm transition-all ${
                                                    isSelected
                                                      ? "border-primary bg-primary/10 text-primary font-semibold"
                                                      : willBeSequentiallySelected
                                                        ? "border-primary/50 bg-primary/5 text-primary font-medium"
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
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}

                                {tempTime && (
                                  <Button
                                    variant="hero"
                                    className="w-full"
                                    onClick={() => {
                                      const unassigned = getUnassignedServices();
                                      
                                      if (unassigned.length > 1 && tempBarberId && currentDate) {
                                        const availableTimes = getAvailableTimesForBarber(tempBarberId, currentDate);
                                        const requiredSlotsForAll = getRequiredSlotsForUnassignedServices();
                                        const sequentialSlots = findSequentialSlots(tempTime, availableTimes, requiredSlotsForAll);
                                        
                                        if (sequentialSlots.length === requiredSlotsForAll) {
                                          createSequentialAppointments(tempBarberId, currentDate, tempTime);
                                        } else {
                                          if (currentServiceId) {
                                            addAppointment(currentServiceId, tempBarberId, currentDate, tempTime);
                                          }
                                        }
                                      } else {
                                        if (tempBarberId && currentDate && tempTime && currentServiceId) {
                                          addAppointment(currentServiceId, tempBarberId, currentDate, tempTime);
                                        }
                                      }
                                      
                                      setTempBarberId("");
                                      setTempTime("");
                                      const nextUnassigned = getUnassignedServices();
                                      if (nextUnassigned.length > 0) {
                                        const dates = getAllAvailableDates;
                                        if (dates.length > 0) {
                                          setCurrentDate(dates[0]);
                                        }
                                      }
                                    }}
                                  >
                                    {(() => {
                                      const unassigned = getUnassignedServices();
                                      if (unassigned.length > 1 && tempTime && tempBarberId && currentDate) {
                                        const availableTimes = getAvailableTimesForBarber(tempBarberId, currentDate);
                                        const requiredSlotsForAll = getRequiredSlotsForUnassignedServices();
                                        const sequentialSlots = findSequentialSlots(tempTime, availableTimes, requiredSlotsForAll);
                                        
                                        if (sequentialSlots.length === requiredSlotsForAll) {
                                          return `Agendar ${unassigned.length} Serviços Sequencialmente`;
                                        }
                                      }
                                      return "Confirmar Agendamento";
                                    })()}
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
                {step === 1 ? (
                  <Button
                    variant="hero"
                    onClick={() => {
                      setStep(step + 1);
                    }}
                    disabled={selectedServices.length === 0}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button 
                    variant="hero" 
                    disabled={appointments.length !== selectedServices.length || selectedBarbers.length === 0}
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

