import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, User, Check } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import type { Matcher } from "react-day-picker";
import { addDays, isBefore, isSameDay, parseISO, startOfToday } from "date-fns";
import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";
import { loadServices } from "@/lib/services-storage";

const Booking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState("");
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
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
    const uniqueIds = Array.from(new Set(serviceIds)).filter((id) =>
      services.some((service) => service.id === id)
    );

    const serviceNames = uniqueIds
      .map((id) => services.find((service) => service.id === id)?.title)
      .filter((name): name is string => Boolean(name));

    const payload: Record<string, unknown> = {
      serviceIds: uniqueIds,
      serviceNames,
    };

    if (uniqueIds.length > 0) {
      payload.serviceId = uniqueIds[0];
      payload.serviceName =
        serviceNames[0] ??
        services.find((service) => service.id === uniqueIds[0])?.title ??
        "";
    }

    localStorage.setItem("selectedService", JSON.stringify(payload));

    return uniqueIds;
  };

  const handleToggleService = (serviceId: string) => {
    setSelectedServices((previous) =>
      previous.includes(serviceId)
        ? previous.filter((id) => id !== serviceId)
        : [...previous, serviceId]
    );
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

  const disabledCalendarDays: Matcher[] = useMemo(() => {
    const base = [{ before: startOfToday() }];
    if (!selectedBarber || availableDates.length === 0) {
      return base;
    }

    return [
      ...base,
      (date: Date) => !availableDates.some((availableDate) => isSameDay(availableDate, date)),
    ];
  }, [selectedBarber, availableDates]);

  useEffect(() => {
    if (!selectedBarber) {
      setAvailableDates([]);
      setAvailableTimes([]);
      setSelectedDate(startOfToday());
      setSelectedTime("");
      return;
    }

    const barber = barbers.find((b) => b.id === selectedBarber);
    if (!barber) {
      setAvailableDates([]);
      setAvailableTimes([]);
      setSelectedDate(startOfToday());
      setSelectedTime("");
      return;
    }

    const parsedDates = barber.schedule
      .map((entry) => parseISO(entry.date))
      .filter((date) => !isBefore(date, startOfToday()));

    setAvailableDates(parsedDates);

    const hasCurrentDate = parsedDates.some((date) => isSameDay(date, selectedDate));
    if (!hasCurrentDate) {
      const nextDate = parsedDates[0] ?? startOfToday();
      if (!isSameDay(nextDate, selectedDate)) {
        setSelectedDate(nextDate);
        return;
      }
    }

    const scheduleEntry = barber.schedule.find((entry) =>
      isSameDay(parseISO(entry.date), selectedDate)
    );
    const slots = scheduleEntry?.slots ?? [];
    setAvailableTimes(slots);
    if (!slots.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedBarber, selectedDate]);

  const handleBack = () => {
    if (step === 1) {
      navigate("/services");
      return;
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => {
                    const hasDiscount =
                      service.promotionScope !== "none" &&
                      service.discountPercentage !== null &&
                      service.discountPercentage > 0;
                    const finalPrice = hasDiscount
                      ? calculateDiscountedPrice(service.price, service.discountPercentage!)
                      : service.price;

                    const isSelected = selectedServices.includes(service.id);

                    return (
                      <button
                        key={service.id}
                        onClick={() => handleToggleService(service.id)}
                        className={`p-6 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-gold"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{service.title}</h3>
                          {service.promotionScope === "vip" && (
                            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                              VIP
                            </span>
                          )}
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
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 2: Barber Selection */}
              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {barbers.map((barber) => (
                    <button
                      key={barber.id}
                      onClick={() => setSelectedBarber(barber.id)}
                      className={`p-6 rounded-lg border-2 text-left transition-all ${
                        selectedBarber === barber.id
                          ? "border-primary bg-primary/5 shadow-gold"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start mb-3">
                        <div className="p-2 bg-primary/10 rounded-full mr-3">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{barber.name}</h3>
                          <p className="text-sm text-muted-foreground">{barber.specialty}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Experiência: {barber.experience}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 3: Date & Time Selection */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                      Selecione a Data
                    </h3>
                    <div className="flex justify-center md:justify-start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        fromDate={startOfToday()}
                        disabled={disabledCalendarDays}
                        initialFocus
                        className="w-full rounded-2xl border border-border bg-card p-6 shadow-card"
                        numberOfMonths={1}
                        classNames={{
                          months: "flex flex-col gap-6 w-full",
                          month: "space-y-4 w-full",
                          caption: "flex justify-between items-center px-2",
                          caption_label: "text-lg font-semibold",
                          nav: "flex items-center space-x-2",
                          table: "w-full border-collapse space-y-2",
                          head_row: "flex w-full",
                          head_cell: "text-muted-foreground rounded-md text-base font-medium flex-1 text-center",
                          row: "flex w-full mt-2",
                          cell:
                            "h-14 flex-1 text-center text-base p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg focus-within:relative focus-within:z-20",
                          day: "h-14 w-14 max-w-full mx-auto rounded-xl text-base font-medium transition-colors hover:bg-primary/10 data-[selected]:bg-primary data-[selected]:text-primary-foreground",
                          day_today: "border border-primary font-semibold text-primary",
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-primary" />
                      Horários Disponíveis
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          disabled={!availableTimes.includes(time)}
                          onClick={() => {
                            if (!availableTimes.includes(time)) return;
                            setSelectedTime(time);
                          }}
                          className={`p-3 rounded-lg border transition-all text-center ${
                            selectedTime === time
                              ? "border-primary bg-primary/10 text-primary font-semibold shadow-gold"
                              : !availableTimes.includes(time)
                                ? "border-border/60 bg-secondary text-muted-foreground opacity-60 cursor-not-allowed"
                                : "border-border hover:border-primary hover:bg-primary/5"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
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
                    onClick={() => setStep(step + 1)}
                    disabled={
                      (step === 1 && selectedServices.length === 0) ||
                      (step === 2 && !selectedBarber)
                    }
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button variant="hero" disabled={!selectedDate || !selectedTime}>
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
