import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
  UserCog,
  Wallet,
  UserCircle,
  Scissors,
  ShoppingBag,
  Copy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect, useMemo, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { loadServices } from "@/lib/services-storage";
import { loadCollaborators } from "@/lib/collaborators-storage";
import { loadBarbershops } from "@/lib/barbershops-storage";
import { loadInventory } from "@/lib/inventory-storage";
import { loadVipData } from "@/lib/vips-storage";
import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";
import { Collaborator } from "@/data/collaborators";
import { VipData } from "@/data/vips";
import { InventoryData } from "@/data/inventory";
import { parseISO, isSameDay, startOfToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, isAfter } from "date-fns";

type StatItem = {
  key: string;
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  onCardClick?: () => void;
  onIconClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

// revenueViews será calculado dinamicamente baseado nas vendas e agendamentos reais

// bookingViews será calculado dinamicamente baseado nos agendamentos reais

// clientViews será calculado dinamicamente baseado nos clientes VIP reais

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

interface SelectedAppointment {
  apt: {
    serviceName: string;
    clientName: string;
    date: Date;
    time: string;
    barber: string;
  };
  payment: {
    fullName: string;
    phone: string;
    cpf: string;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [revenueViewIndex, setRevenueViewIndex] = useState(0);
  const [isRevenueHidden, setIsRevenueHidden] = useState(false);
  const [bookingViewIndex, setBookingViewIndex] = useState(0);
  const [inventoryViewIndex, setInventoryViewIndex] = useState(0);
  const [clientViewIndex, setClientViewIndex] = useState(0);
  const [allBookings, setAllBookings] = useState<BookingConfirmation[]>([]);
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<SelectedAppointment | null>(null);
  const [vipData, setVipData] = useState<VipData>(loadVipData());
  const [shopSales, setShopSales] = useState<Array<{ total: number; timestamp: string }>>([]);
  const [inventory, setInventory] = useState<InventoryData>(() => {
    const barbershops = loadBarbershops();
    const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
    const storedMatch = storedActiveId ? barbershops.find((shop) => shop.id === storedActiveId) : null;
    const fallbackBarbershop = barbershops[0] ?? null;
    const targetBarbershop = storedMatch ?? fallbackBarbershop;
    const resolvedBarbershopId = targetBarbershop?.id ?? null;
    return loadInventory(resolvedBarbershopId);
  });
  const [activeBarbershop, setActiveBarbershop] = useState<{ id: string; name: string } | null>(() => {
    const barbershops = loadBarbershops();
    const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
    const storedMatch = storedActiveId ? barbershops.find((shop) => shop.id === storedActiveId) : null;
    const fallbackBarbershop = barbershops[0] ?? null;
    const targetBarbershop = storedMatch ?? fallbackBarbershop;
    return targetBarbershop ? { id: targetBarbershop.id, name: targetBarbershop.name || "Barbearia" } : null;
  });


  const handleRevenueCardClick = () => {
    setRevenueViewIndex((prev) => (prev + 1) % revenueViews.length);
  };

  const handleRevenueIconClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsRevenueHidden((prev) => !prev);
  };

  const handleBookingCardClick = () => {
    setBookingViewIndex((prev) => (prev + 1) % bookingViews.length);
  };

  const handleInventoryCardClick = () => {
    setInventoryViewIndex((prev) => (prev + 1) % inventoryViews.length);
  };

  const handleClientCardClick = () => {
    setClientViewIndex((prev) => (prev + 1) % clientViews.length);
  };

  const loadBookings = () => {
    const barbershops = loadBarbershops();
    const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
    const storedMatch = storedActiveId ? barbershops.find((shop) => shop.id === storedActiveId) : null;
    const fallbackBarbershop = barbershops[0] ?? null;
    const targetBarbershop = storedMatch ?? fallbackBarbershop;
    const resolvedBarbershopId = targetBarbershop?.id ?? null;
    
    const updatedBookings: BookingConfirmation[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("bookingConfirmation")) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed && parsed.appointments) {
              if (Array.isArray(parsed)) {
                const filtered = parsed.filter((b: BookingConfirmation) => {
                  if (!b || !b.appointments) return false;
                  if (resolvedBarbershopId) {
                    return b.barbershopId === resolvedBarbershopId;
                  }
                  return !b.barbershopId;
                });
                updatedBookings.push(...filtered);
              } else {
                if (resolvedBarbershopId) {
                  if (parsed.barbershopId === resolvedBarbershopId) {
                    updatedBookings.push(parsed);
                  }
                } else {
                  if (!parsed.barbershopId) {
                    updatedBookings.push(parsed);
                  }
                }
              }
            }
          }
        } catch {
          continue;
        }
      }
    }
    setAllBookings(updatedBookings);
  };

  const loadShopSales = () => {
    const allSales: Array<{ total: number; timestamp: string }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("shop_sale_") || key.startsWith("completed_order_"))) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed && Array.isArray(parsed)) {
              parsed.forEach((sale: any) => {
                if (sale.total || (sale.price && sale.quantity)) {
                  allSales.push({
                    total: sale.total ?? (sale.price * sale.quantity),
                    timestamp: sale.timestamp || sale.date || new Date().toISOString(),
                  });
                }
              });
            } else if (parsed && parsed.items) {
              parsed.items.forEach((item: any) => {
                const itemTotal = (item.priceValue || item.price || 0) * (item.quantity || 1);
                allSales.push({
                  total: itemTotal,
                  timestamp: parsed.timestamp || parsed.date || new Date().toISOString(),
                });
              });
            } else if (parsed && parsed.total) {
              allSales.push({
                total: parsed.total,
                timestamp: parsed.timestamp || parsed.date || new Date().toISOString(),
              });
            }
          }
        } catch {
          continue;
        }
      }
    }
    setShopSales(allSales);
  };

  useEffect(() => {
    const nextServices = loadServices();
    setServices(nextServices);
    
    const loadedCollaborators = loadCollaborators();
    setCollaborators(loadedCollaborators);
    
    const nextVipData = loadVipData();
    setVipData(nextVipData);
    
    const barbershops = loadBarbershops();
    const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
    const storedMatch = storedActiveId ? barbershops.find((shop) => shop.id === storedActiveId) : null;
    const fallbackBarbershop = barbershops[0] ?? null;
    const targetBarbershop = storedMatch ?? fallbackBarbershop;
    const resolvedBarbershopId = targetBarbershop?.id ?? null;
    const nextInventory = loadInventory(resolvedBarbershopId);
    setInventory(nextInventory);
    
    if (targetBarbershop) {
      setActiveBarbershop({ id: targetBarbershop.id, name: targetBarbershop.name || "Barbearia" });
    } else {
      setActiveBarbershop(null);
    }
    
    loadBookings();
    loadShopSales();

    const handleStorage = (event: StorageEvent) => {
      if (event.key?.startsWith("bookingConfirmation")) {
        loadBookings();
      }
      if (event.key === "barberbook_admin_vips") {
        const nextVipData = loadVipData();
        setVipData(nextVipData);
      }
      if (event.key === "barberbook_admin_barbershops") {
        const barbershops = loadBarbershops();
        const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
        const storedMatch = storedActiveId ? barbershops.find((shop) => shop.id === storedActiveId) : null;
        const fallbackBarbershop = barbershops[0] ?? null;
        const targetBarbershop = storedMatch ?? fallbackBarbershop;
        if (targetBarbershop) {
          setActiveBarbershop({ id: targetBarbershop.id, name: targetBarbershop.name || "Barbearia" });
        } else {
          setActiveBarbershop(null);
        }
      }
      if (event.key === "admin_active_barbershop_id" || event.key?.startsWith("barberbook_admin_inventory")) {
        const barbershops = loadBarbershops();
        const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
        const storedMatch = storedActiveId ? barbershops.find((shop) => shop.id === storedActiveId) : null;
        const fallbackBarbershop = barbershops[0] ?? null;
        const targetBarbershop = storedMatch ?? fallbackBarbershop;
        const resolvedBarbershopId = targetBarbershop?.id ?? null;
        const nextInventory = loadInventory(resolvedBarbershopId);
        setInventory(nextInventory);
        if (targetBarbershop) {
          setActiveBarbershop({ id: targetBarbershop.id, name: targetBarbershop.name || "Barbearia" });
        } else {
          setActiveBarbershop(null);
        }
      }
      // Atualizar quando houver mudanças em vendas da loja
      if (event.key?.startsWith("shop_sale_") || event.key?.startsWith("completed_order_")) {
        loadShopSales();
      }
    };

    window.addEventListener("storage", handleStorage);

    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(...args) {
      originalSetItem.apply(this, args);
      if (args[0]?.startsWith("bookingConfirmation")) {
        loadBookings();
      }
      if (args[0] === "barberbook_admin_vips") {
        const nextVipData = loadVipData();
        setVipData(nextVipData);
      }
      if (args[0] === "barberbook_admin_barbershops") {
        const barbershops = loadBarbershops();
        const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
        const storedMatch = storedActiveId ? barbershops.find((shop) => shop.id === storedActiveId) : null;
        const fallbackBarbershop = barbershops[0] ?? null;
        const targetBarbershop = storedMatch ?? fallbackBarbershop;
        if (targetBarbershop) {
          setActiveBarbershop({ id: targetBarbershop.id, name: targetBarbershop.name || "Barbearia" });
        } else {
          setActiveBarbershop(null);
        }
      }
      if (args[0] === "admin_active_barbershop_id" || args[0]?.startsWith("barberbook_admin_inventory")) {
        const barbershops = loadBarbershops();
        const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
        const storedMatch = storedActiveId ? barbershops.find((shop) => shop.id === storedActiveId) : null;
        const fallbackBarbershop = barbershops[0] ?? null;
        const targetBarbershop = storedMatch ?? fallbackBarbershop;
        const resolvedBarbershopId = targetBarbershop?.id ?? null;
        const nextInventory = loadInventory(resolvedBarbershopId);
        setInventory(nextInventory);
        if (targetBarbershop) {
          setActiveBarbershop({ id: targetBarbershop.id, name: targetBarbershop.name || "Barbearia" });
        } else {
          setActiveBarbershop(null);
        }
      }
      // Atualizar quando houver mudanças em vendas da loja
      if (args[0]?.startsWith("shop_sale_") || args[0]?.startsWith("completed_order_")) {
        loadShopSales();
      }
    };

    return () => {
      window.removeEventListener("storage", handleStorage);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  const getBarberIdFromCollaborator = (collaborator: Collaborator): string => {
    const nameSlug = collaborator.name.toLowerCase().replace(/\s+/g, "-");
    return nameSlug;
  };

  const getBarberName = (barberId: string): string => {
    const collaborator = collaborators.find((c) => c.id === barberId);
    if (collaborator) {
      return collaborator.name;
    }
    const barberIdSlug = getBarberIdFromCollaborator({ id: barberId, name: barberId } as Collaborator);
    const collaboratorBySlug = collaborators.find((c) => {
      const slug = getBarberIdFromCollaborator(c);
      return slug === barberId || slug === barberIdSlug;
    });
    return collaboratorBySlug?.name || barberId;
  };

  // Calcular estatísticas de agendamentos
  const bookingStats = useMemo(() => {
    const today = startOfToday();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    const todayAppointmentsList: Array<{
      client: string;
      service: string;
      time: string;
      barber: string;
      date: Date;
      appointmentId: string;
      booking: BookingConfirmation;
    }> = [];

    allBookings.forEach((booking) => {
      booking.appointments.forEach((apt) => {
        const aptDate = parseISO(apt.date);
        
        if (isSameDay(aptDate, today)) {
          todayCount++;
          const service = services.find((s) => s.id === apt.serviceId);
          const barberName = getBarberName(apt.barberId);
          todayAppointmentsList.push({
            client: apt.clientName || booking.payment.fullName,
            service: service?.title || "Serviço",
            time: apt.time,
            barber: barberName,
            date: aptDate,
            appointmentId: apt.id,
            booking: booking,
          });
        }
        
        if (isWithinInterval(aptDate, { start: weekStart, end: weekEnd })) {
          weekCount++;
        }
        
        if (isWithinInterval(aptDate, { start: monthStart, end: monthEnd })) {
          monthCount++;
        }
      });
    });

    todayAppointmentsList.sort((a, b) => {
      if (a.time.localeCompare(b.time) !== 0) {
        return a.time.localeCompare(b.time);
      }
      return a.date.getTime() - b.date.getTime();
    });

    return {
      today: todayCount,
      week: weekCount,
      month: monthCount,
      todayList: todayAppointmentsList.slice(0, 4),
    };
  }, [allBookings, services, collaborators]);

  const bookingViews = useMemo(() => [
    { title: "Agendamentos Hoje", value: String(bookingStats.today) },
    { title: "Agendamentos Semanal", value: String(bookingStats.week) },
    { title: "Agendamentos Mensal", value: String(bookingStats.month) },
  ], [bookingStats]);

  const inventoryViews = useMemo(() => {
    const storeProductsCount = inventory.storeProducts.filter(
      (product) => product.category && product.category !== "rascunho"
    ).length;
    const consumablesCount = inventory.consumables.length;
    
    return [
      { title: "Estoque da Loja", value: String(storeProductsCount) },
      { title: "Estoque da Barbearia", value: String(consumablesCount) },
    ];
  }, [inventory]);

  const clientViews = useMemo(() => {
    const now = new Date();
    let activeCount = 0;
    let inactiveCount = 0;

    vipData.members.forEach((member) => {
      const expiresAt = parseISO(member.expiresAt);
      const isActive = member.paymentStatus === "paid" && isAfter(expiresAt, now);
      
      if (isActive) {
        activeCount++;
      } else {
        inactiveCount++;
      }
    });

    return [
      { title: "Cliente Vip Ativo", value: String(activeCount) },
      { title: "Cliente vip inativo", value: String(inactiveCount) },
    ];
  }, [vipData]);

  const revenueViews = useMemo(() => {
    const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const today = startOfToday();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    // Calcular receita de agendamentos
    let dailyBookingRevenue = 0;
    let weeklyBookingRevenue = 0;
    let monthlyBookingRevenue = 0;

    allBookings.forEach((booking) => {
      booking.appointments.forEach((apt) => {
        const aptDate = parseISO(apt.date);
        const service = services.find((s) => s.id === apt.serviceId);
        
        if (service) {
          const hasDiscount =
            service.promotionScope !== "none" &&
            service.discountPercentage !== null &&
            service.discountPercentage > 0;
          
          let price = service.price;
          if (hasDiscount) {
            if (service.promotionScope === "vip") {
              // Para VIP, aplicar desconto apenas na primeira vez
              price = service.price * (1 - (service.discountPercentage / 100));
            } else {
              price = service.price * (1 - (service.discountPercentage / 100));
            }
          }

          if (isSameDay(aptDate, today)) {
            dailyBookingRevenue += price;
          }
          if (isWithinInterval(aptDate, { start: weekStart, end: weekEnd })) {
            weeklyBookingRevenue += price;
          }
          if (isWithinInterval(aptDate, { start: monthStart, end: monthEnd })) {
            monthlyBookingRevenue += price;
          }
        }
      });
    });

    // Calcular receita de vendas da loja
    let dailyShopRevenue = 0;
    let weeklyShopRevenue = 0;
    let monthlyShopRevenue = 0;

    shopSales.forEach((sale) => {
      const saleDate = parseISO(sale.timestamp);
      const total = sale.total || 0;

      if (isSameDay(saleDate, today)) {
        dailyShopRevenue += total;
      }
      if (isWithinInterval(saleDate, { start: weekStart, end: weekEnd })) {
        weeklyShopRevenue += total;
      }
      if (isWithinInterval(saleDate, { start: monthStart, end: monthEnd })) {
        monthlyShopRevenue += total;
      }
    });

    // Calcular receita de assinaturas VIP pagas (mensal)
    const vipSubscriptionRevenue = vipData.members
      .filter((member) => member.paymentStatus === "paid")
      .reduce((sum, member) => {
        const subscriptionPrice = member.billingCycle === "monthly" 
          ? vipData.config.priceMonthly 
          : vipData.config.priceAnnual / 12; // Anual dividido por 12 para mensal
        return sum + subscriptionPrice;
      }, 0);

    // Calcular receita de aluguel de cadeiras (mensal)
    const chairRentalRevenue = collaborators.reduce((sum, collaborator) => {
      const paymentMethod = collaborator.paymentMethod;
      const isChairRental = paymentMethod === "aluguel-cadeira-100" || 
                            paymentMethod === "aluguel-cadeira-50" ||
                            paymentMethod === "recebe-100-por-cliente" ||
                            paymentMethod === "recebe-50-por-cliente";
      
      if (isChairRental && collaborator.chairRentalAmount && collaborator.chairRentalAmount > 0) {
        return sum + collaborator.chairRentalAmount;
      }
      return sum;
    }, 0);

    const dailyTotal = dailyBookingRevenue + dailyShopRevenue;
    const weeklyTotal = weeklyBookingRevenue + weeklyShopRevenue;
    const monthlyTotal = monthlyBookingRevenue + monthlyShopRevenue + vipSubscriptionRevenue + chairRentalRevenue;

    return [
      { title: "Faturamento Mensal", value: currencyFormatter.format(monthlyTotal) },
      { title: "Faturamento Semanal", value: currencyFormatter.format(weeklyTotal) },
      { title: "Faturamento Diário", value: currencyFormatter.format(dailyTotal) },
    ];
  }, [allBookings, services, shopSales, vipData, collaborators]);

  const baseStats: StatItem[] = useMemo(() => [
    { key: "bookings", title: "Agendamentos Hoje", value: "23", icon: Calendar, color: "text-primary" },
    { key: "clients", title: clientViews[0].title, value: clientViews[0].value, icon: Users, color: "text-blue-500" },
    { key: "revenue", title: revenueViews[0].title, value: revenueViews[0].value, icon: DollarSign, color: "text-green-500" },
    { key: "inventory", title: inventoryViews[0].title, value: inventoryViews[0].value, icon: Package, color: "text-orange-500" },
  ], [clientViews, inventoryViews, revenueViews]);

  const todayAppointments = bookingStats.todayList;

  const stats = baseStats.map((stat) => {
    if (stat.key === "revenue") {
      const currentView = revenueViews[revenueViewIndex];

      return {
        ...stat,
        title: currentView.title,
        value: isRevenueHidden ? "R$ ****" : currentView.value,
        onCardClick: handleRevenueCardClick,
        onIconClick: handleRevenueIconClick,
      };
    }

    if (stat.key === "bookings") {
      const currentView = bookingViews[bookingViewIndex];

      return {
        ...stat,
        title: currentView.title,
        value: currentView.value,
        onCardClick: handleBookingCardClick,
      };
    }

    if (stat.key === "inventory") {
      const currentView = inventoryViews[inventoryViewIndex];

      return {
        ...stat,
        title: currentView.title,
        value: currentView.value,
        onCardClick: handleInventoryCardClick,
      };
    }

    if (stat.key === "clients") {
      const currentView = clientViews[clientViewIndex];

      return {
        ...stat,
        title: currentView.title,
        value: currentView.value,
        onCardClick: handleClientCardClick,
      };
    }

    return stat;
  });

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        toast({
          title: "Copiado",
          description: "Texto copiado para a área de transferência",
        });
      }).catch(() => {
        copyWithFallback(text);
      });
      return;
    }

    copyWithFallback(text);

    function copyWithFallback(textToCopy: string) {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.left = "0";
      textArea.style.top = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      textArea.setAttribute("readonly", "");
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, 999999);
      
      try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        
        if (successful) {
          toast({
            title: "Copiado",
            description: "Texto copiado para a área de transferência",
          });
        } else {
          throw new Error("Copy command returned false");
        }
      } catch (err) {
        if (document.body.contains(textArea)) {
          document.body.removeChild(textArea);
        }
        toast({
          title: "Erro",
          description: "Não foi possível copiar o texto. Tente selecionar e copiar manualmente.",
          variant: "destructive",
        });
      }
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("adminAuth");
      localStorage.removeItem("activeCollaborator");
    } finally {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-4xl font-display font-bold">
                Dashboard <span className="text-primary">Administrativo</span>
              </h1>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">Sair</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deseja realmente sair?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={logout}>Sair</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-lg text-muted-foreground">
                Visão geral da
              </p>
              {activeBarbershop?.name ? (
                <span className="inline-flex items-center px-4 py-1.5 rounded-lg text-2xl md:text-3xl font-display font-bold bg-gradient-to-r from-primary/10 via-primary/15 to-primary/10 text-primary border border-primary/20 shadow-gold/30 hover:shadow-gold/50 transition-all duration-300 hover:scale-105">
                  {activeBarbershop.name}
                </span>
              ) : (
                <span className="text-lg text-muted-foreground">sua barbearia</span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <Card
                key={index}
                className={`shadow-card border-border ${stat.onCardClick ? "cursor-pointer transition-transform hover:-translate-y-1" : ""}`}
                onClick={stat.onCardClick}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    {stat.onIconClick ? (
                      <button
                        type="button"
                        onClick={stat.onIconClick}
                        className="-m-1 rounded-full p-1 transition-colors hover:bg-primary/10"
                        aria-label="Ocultar faturamento"
                      >
                        <stat.icon className={`h-8 w-8 ${stat.color}`} />
                      </button>
                    ) : (
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    )}
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.title}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Próximos Agendamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAppointments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum agendamento para hoje
                    </p>
                  ) : (
                    todayAppointments.map((booking, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
                      onClick={() => {
                        setSelectedAppointment({
                          apt: {
                            serviceName: booking.service,
                            clientName: booking.client,
                            date: booking.date,
                            time: booking.time,
                            barber: booking.barber,
                          },
                          payment: booking.booking.payment,
                        });
                      }}
                    >
                      <div>
                        <div className="font-semibold">{booking.client}</div>
                        <div className="text-sm text-muted-foreground">{booking.service}</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-primary font-semibold">
                          <Clock className="h-4 w-4 mr-1" />
                          {booking.time}
                        </div>
                        <div className="text-sm text-muted-foreground">{booking.barber}</div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/agendamentos")}
                    className="p-6 bg-secondary hover:bg-primary/10 rounded-lg transition-all text-left border border-border hover:border-primary"
                  >
                    <Calendar className="h-8 w-8 text-primary mb-2" />
                    <div className="font-semibold">Pré-Agendados</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/vips")}
                    className="p-6 bg-secondary hover:bg-primary/10 rounded-lg transition-all text-left border border-border hover:border-primary"
                  >
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <div className="font-semibold">Clientes VIP</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/estoque")}
                    className="p-6 bg-secondary hover:bg-primary/10 rounded-lg transition-all text-left border border-border hover:border-primary"
                  >
                    <Package className="h-8 w-8 text-primary mb-2" />
                    <div className="font-semibold">Estoque</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/loja")}
                    className="p-6 bg-secondary hover:bg-primary/10 rounded-lg transition-all text-left border border-border hover:border-primary"
                  >
                    <ShoppingBag className="h-8 w-8 text-primary mb-2" />
                    <div className="font-semibold">Loja</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/colaboradores")}
                    className="p-6 bg-secondary hover:bg-primary/10 rounded-lg transition-all text-left border border-border hover:border-primary"
                  >
                    <UserCog className="h-8 w-8 text-primary mb-2" />
                    <div className="font-semibold">Colaboradores</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/financas")}
                    className="p-6 bg-secondary hover:bg-primary/10 rounded-lg transition-all text-left border border-border hover:border-primary"
                  >
                    <Wallet className="h-8 w-8 text-primary mb-2" />
                    <div className="font-semibold">Finanças</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/perfil")}
                    className="p-6 bg-secondary hover:bg-primary/10 rounded-lg transition-all text-left border border-border hover:border-primary"
                  >
                    <UserCircle className="h-8 w-8 text-primary mb-2" />
                    <div className="font-semibold">Perfil</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/servicos")}
                    className="p-6 bg-secondary hover:bg-primary/10 rounded-lg transition-all text-left border border-border hover:border-primary"
                  >
                    <Scissors className="h-8 w-8 text-primary mb-2" />
                    <div className="font-semibold">Serviços</div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Informações do Cliente</DialogTitle>
            <DialogDescription>
              Dados do cliente para o agendamento de {selectedAppointment?.apt.serviceName}
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-semibold flex-1">{selectedAppointment.payment.fullName}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(selectedAppointment.payment.fullName)}
                    aria-label="Copiar nome completo"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Número de Telefone</label>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-semibold flex-1">{selectedAppointment.payment.phone}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(selectedAppointment.payment.phone)}
                    aria-label="Copiar telefone"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">CPF</label>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-semibold flex-1">{selectedAppointment.payment.cpf}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(selectedAppointment.payment.cpf)}
                    aria-label="Copiar CPF"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
