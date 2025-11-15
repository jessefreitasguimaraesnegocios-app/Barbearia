import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Wallet, Scissors, ShoppingBag, Users } from "lucide-react";
import { loadServices } from "@/lib/services-storage";
import { loadCollaborators } from "@/lib/collaborators-storage";
import { loadInventory } from "@/lib/inventory-storage";
import { DEFAULT_SERVICES, ServiceItem } from "@/data/services";
import { Collaborator, PaymentMethod } from "@/data/collaborators";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Expense } from "./AdminExpenses";

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

interface ShopSale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
}

const AdminFinances = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [allBookings, setAllBookings] = useState<BookingConfirmation[]>([]);
  const [shopSales, setShopSales] = useState<ShopSale[]>([]);
  const [manualExpenses, setManualExpenses] = useState<Expense[]>([]);

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
    
    const allSales: ShopSale[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("shop_sale_") || key.startsWith("completed_order_"))) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            if (parsed && Array.isArray(parsed)) {
              allSales.push(...parsed);
            } else if (parsed && parsed.items) {
              parsed.items.forEach((item: any) => {
                allSales.push({
                  id: `${key}_${item.id}`,
                  productId: String(item.id),
                  productName: item.name || "Produto",
                  quantity: item.quantity || 1,
                  price: item.priceValue || item.price || 0,
                  total: (item.priceValue || item.price || 0) * (item.quantity || 1),
                  timestamp: parsed.timestamp || parsed.date || new Date().toISOString(),
                });
              });
            } else if (parsed) {
              allSales.push(parsed);
            }
          }
        } catch {
          continue;
        }
      }
    }
    setShopSales(allSales);

    const storedExpenses = localStorage.getItem("barberbook_admin_expenses");
    if (storedExpenses) {
      try {
        const parsed = JSON.parse(storedExpenses);
        if (Array.isArray(parsed)) {
          const now = new Date();
          const startDate = startOfMonth(now);
          const endDate = endOfMonth(now);
          
          const monthExpenses = parsed.filter((exp: Expense) => {
            if (!exp || !exp.date) return false;
            const expDate = parseISO(exp.date);
            return isWithinInterval(expDate, { start: startDate, end: endDate });
          });
          
          setManualExpenses(monthExpenses);
        }
      } catch {
        setManualExpenses([]);
      }
    }

    const handleStorageChange = () => {
      const storedExpenses = localStorage.getItem("barberbook_admin_expenses");
      if (storedExpenses) {
        try {
          const parsed = JSON.parse(storedExpenses);
          if (Array.isArray(parsed)) {
            const now = new Date();
            const startDate = startOfMonth(now);
            const endDate = endOfMonth(now);
            
            const monthExpenses = parsed.filter((exp: Expense) => {
              if (!exp || !exp.date) return false;
              const expDate = parseISO(exp.date);
              return isWithinInterval(expDate, { start: startDate, end: endDate });
            });
            
            setManualExpenses(monthExpenses);
          }
        } catch {
          setManualExpenses([]);
        }
      } else {
        setManualExpenses([]);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, []);

  const getBarberIdFromCollaborator = (collaborator: Collaborator): string => {
    const nameSlug = collaborator.name.toLowerCase().replace(/\s+/g, "-");
    return nameSlug;
  };

  const getMonthData = () => {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);
    
    const barbershopRevenue: Array<{ price: number; barberId: string; paymentMethod?: PaymentMethod }> = [];
    
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
            
            const price = hasDiscount && service.promotionScope === "vip"
              ? service.price * (1 - (service.discountPercentage! / 100))
              : hasDiscount
                ? service.price * (1 - (service.discountPercentage! / 100))
                : service.price;
            
            const collaborator = collaborators.find((c) => 
              c.id === apt.barberId || getBarberIdFromCollaborator(c) === apt.barberId
            );
            
            barbershopRevenue.push({
              price,
              barberId: apt.barberId,
              paymentMethod: collaborator?.paymentMethod,
            });
          }
        }
      });
    });
    
    const shopRevenue = shopSales.filter((sale) => {
      const saleDate = parseISO(sale.timestamp);
      return isWithinInterval(saleDate, { start: startDate, end: endDate });
    });
    
    return { barbershopRevenue, shopRevenue };
  };

  const { barbershopRevenue, shopRevenue } = useMemo(() => getMonthData(), [allBookings, services, collaborators, shopSales]);

  const appointmentRevenue = useMemo(() => {
    return barbershopRevenue.reduce((sum, apt) => sum + apt.price, 0);
  }, [barbershopRevenue]);

  const chairRentalRevenue = useMemo(() => {
    let totalRental = 0;
    
    collaborators.forEach((collaborator) => {
      if (collaborator.paymentMethod === "aluguel-cadeira-100" || collaborator.paymentMethod === "aluguel-cadeira-50") {
        const barberId = collaborator.id;
        const barberSlug = getBarberIdFromCollaborator(collaborator);
        
        const barberAppointments = barbershopRevenue.filter((apt) => 
          apt.barberId === barberId || apt.barberId === barberSlug
        );
        
        const barberRevenue = barberAppointments.reduce((sum, apt) => sum + apt.price, 0);
        
        if (collaborator.paymentMethod === "aluguel-cadeira-100") {
          totalRental += barberRevenue;
        } else if (collaborator.paymentMethod === "aluguel-cadeira-50") {
          totalRental += barberRevenue * 0.5;
        }
      }
    });
    
    return totalRental;
  }, [collaborators, barbershopRevenue]);

  const totalBarbershopRevenue = useMemo(() => {
    return appointmentRevenue + chairRentalRevenue;
  }, [appointmentRevenue, chairRentalRevenue]);

  const totalShopRevenue = useMemo(() => {
    return shopRevenue.reduce((sum, sale) => sum + sale.total, 0);
  }, [shopRevenue]);

  const calculateExpenses = () => {
    const expenses: Array<{ name: string; amount: number; type: "salario" | "aluguel" }> = [];
    
    collaborators.forEach((collaborator) => {
      if (collaborator.paymentMethod === "salario-fixo") {
        expenses.push({
          name: `${collaborator.name} - Salário Fixo`,
          amount: 0,
          type: "salario",
        });
      } else if (collaborator.paymentMethod === "aluguel-cadeira-100" || collaborator.paymentMethod === "aluguel-cadeira-50") {
        const barberId = collaborator.id;
        const barberSlug = getBarberIdFromCollaborator(collaborator);
        
        const barberAppointments = barbershopRevenue.filter((apt) => 
          apt.barberId === barberId || apt.barberId === barberSlug
        );
        
        const barberRevenue = barberAppointments.reduce((sum, apt) => sum + apt.price, 0);
        
        if (collaborator.paymentMethod === "aluguel-cadeira-100") {
          expenses.push({
            name: `${collaborator.name} - Aluguel de Cadeira (100%)`,
            amount: barberRevenue,
            type: "aluguel",
          });
        } else if (collaborator.paymentMethod === "aluguel-cadeira-50") {
          expenses.push({
            name: `${collaborator.name} - Aluguel de Cadeira (50%)`,
            amount: barberRevenue * 0.5,
            type: "aluguel",
          });
        }
      }
    });
    
    return expenses;
  };

  const expenses = useMemo(() => calculateExpenses(), [collaborators, barbershopRevenue]);

  const manualExpensesTotal = useMemo(() => {
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());
    
    const monthExpenses = manualExpenses.filter((exp) => {
      const expDate = parseISO(exp.date);
      return isWithinInterval(expDate, { start: startDate, end: endDate }) && exp.type === "despesa";
    });
    
    return monthExpenses.reduce((sum, exp) => sum + exp.value, 0);
  }, [manualExpenses]);

  const manualInvestmentsTotal = useMemo(() => {
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());
    
    const monthInvestments = manualExpenses.filter((exp) => {
      const expDate = parseISO(exp.date);
      return isWithinInterval(expDate, { start: startDate, end: endDate }) && exp.type === "investimento";
    });
    
    return monthInvestments.reduce((sum, exp) => sum + exp.value, 0);
  }, [manualExpenses]);

  const totalExpenses = useMemo(() => {
    const collaboratorExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return collaboratorExpenses + manualExpensesTotal;
  }, [expenses, manualExpensesTotal]);

  const netProfit = useMemo(() => {
    return totalBarbershopRevenue + totalShopRevenue - totalExpenses - manualInvestmentsTotal;
  }, [totalBarbershopRevenue, totalShopRevenue, totalExpenses, manualInvestmentsTotal]);

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
                Finanças <span className="text-primary">Mensais</span>
              </h1>
              <p className="text-muted-foreground">
                {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card 
              className="shadow-card border-border cursor-pointer transition-transform hover:-translate-y-1"
              onClick={() => navigate("/admin/financas/receita-barbearia")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Receita Barbearia</p>
                    <p className="text-3xl font-bold text-primary">
                      {currencyFormatter.format(totalBarbershopRevenue)}
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
                    <p className="text-sm text-muted-foreground mb-1">Receita Loja</p>
                    <p className="text-3xl font-bold text-primary">
                      {currencyFormatter.format(totalShopRevenue)}
                    </p>
                  </div>
                  <ShoppingBag className="h-12 w-12 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="shadow-card border-border cursor-pointer transition-transform hover:-translate-y-1"
              onClick={() => navigate("/admin/financas/despesas")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Despesas</p>
                    <p className="text-3xl font-bold text-destructive">
                      {currencyFormatter.format(totalExpenses)}
                    </p>
                  </div>
                  <TrendingDown className="h-12 w-12 text-destructive opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Lucro Líquido</p>
                    <p className={`text-3xl font-bold ${netProfit >= 0 ? "text-green-500" : "text-destructive"}`}>
                      {currencyFormatter.format(netProfit)}
                    </p>
                  </div>
                  <TrendingUp className={`h-12 w-12 ${netProfit >= 0 ? "text-green-500" : "text-destructive"} opacity-20`} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Receitas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Barbearia</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {currencyFormatter.format(totalBarbershopRevenue)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {barbershopRevenue.length} {barbershopRevenue.length === 1 ? "agendamento" : "agendamentos"}
                  </p>
                </div>

                <div className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Loja</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {currencyFormatter.format(totalShopRevenue)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {shopRevenue.length} {shopRevenue.length === 1 ? "venda" : "vendas"}
                  </p>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg">Total de Receitas</span>
                    <span className="text-2xl font-bold text-primary">
                      {currencyFormatter.format(totalBarbershopRevenue + totalShopRevenue)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  Despesas e Investimentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {expenses.length === 0 && manualExpenses.filter(e => e.type === "despesa").length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma despesa registrada
                  </p>
                ) : (
                  <>
                    {expenses.map((expense, index) => (
                      <div key={index} className="p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1">
                            <Users className="h-4 w-4 text-destructive flex-shrink-0" />
                            <span className="font-medium text-sm">{expense.name}</span>
                          </div>
                          <span className="text-lg font-bold text-destructive ml-2">
                            {expense.type === "salario" ? "A definir" : currencyFormatter.format(expense.amount)}
                          </span>
                        </div>
                        {expense.type === "salario" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Mensalidade fixa mensal
                          </p>
                        )}
                        {expense.type === "aluguel" && expense.amount > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Baseado nos atendimentos do mês
                          </p>
                        )}
                        {expense.type === "aluguel" && expense.amount === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Nenhum atendimento este mês
                          </p>
                        )}
                      </div>
                    ))}
                    {manualExpenses
                      .filter((exp) => exp.type === "despesa")
                      .map((expense) => (
                        <div key={expense.id} className="p-4 bg-secondary/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <TrendingDown className="h-4 w-4 text-destructive flex-shrink-0" />
                              <span className="font-medium text-sm">{expense.description || "Sem descrição"}</span>
                            </div>
                            <span className="text-lg font-bold text-destructive ml-2">
                              {currencyFormatter.format(expense.value)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Despesa manual
                          </p>
                        </div>
                      ))}
                    {manualExpenses
                      .filter((exp) => exp.type === "investimento")
                      .map((expense) => (
                        <div key={expense.id} className="p-4 bg-secondary/50 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1">
                              <TrendingUp className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="font-medium text-sm">{expense.description || "Sem descrição"}</span>
                            </div>
                            <span className="text-lg font-bold text-green-500 ml-2">
                              {currencyFormatter.format(expense.value)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Investimento
                          </p>
                        </div>
                      ))}
                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">Total de Despesas</span>
                        <span className="text-2xl font-bold text-destructive">
                          {currencyFormatter.format(totalExpenses)}
                        </span>
                      </div>
                      {manualInvestmentsTotal > 0 && (
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="font-medium text-sm text-muted-foreground">Total de Investimentos</span>
                          <span className="text-lg font-bold text-green-500">
                            {currencyFormatter.format(manualInvestmentsTotal)}
                          </span>
                        </div>
                      )}
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

export default AdminFinances;

