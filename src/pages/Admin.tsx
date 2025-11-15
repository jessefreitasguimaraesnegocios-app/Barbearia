import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

type StatItem = {
  key: string;
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  onCardClick?: () => void;
  onIconClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

const revenueViews = [
  { title: "Faturamento Mensal", value: "R$ 28.450" },
  { title: "Faturamento Semanal", value: "R$ 6.580" },
  { title: "Faturamento Diário", value: "R$ 940" },
];

const bookingViews = [
  { title: "Agendamentos Hoje", value: "23" },
  { title: "Agendamentos Semanal", value: "142" },
  { title: "Agendamentos Mensal", value: "587" },
];

const inventoryViews = [
  { title: "Estoque da Loja", value: "45" },
  { title: "Estoque da Barbearia", value: "42" },
];

const clientViews = [
  { title: "Cliente Vip Ativo", value: "28" },
  { title: "Cliente vip inativo", value: "12" },
];

const Admin = () => {
  const navigate = useNavigate();
  const [revenueViewIndex, setRevenueViewIndex] = useState(0);
  const [isRevenueHidden, setIsRevenueHidden] = useState(false);
  const [bookingViewIndex, setBookingViewIndex] = useState(0);
  const [inventoryViewIndex, setInventoryViewIndex] = useState(0);
  const [clientViewIndex, setClientViewIndex] = useState(0);

  const baseStats: StatItem[] = [
    { key: "bookings", title: "Agendamentos Hoje", value: "23", icon: Calendar, color: "text-primary" },
    { key: "clients", title: clientViews[0].title, value: clientViews[0].value, icon: Users, color: "text-blue-500" },
    { key: "revenue", title: revenueViews[0].title, value: revenueViews[0].value, icon: DollarSign, color: "text-green-500" },
    { key: "inventory", title: inventoryViews[0].title, value: inventoryViews[0].value, icon: Package, color: "text-orange-500" },
  ];

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

  const recentBookings = [
    { client: "João Silva", service: "Corte + Barba", time: "10:00", barber: "Miguel Santos" },
    { client: "Pedro Souza", service: "Corte Clássico", time: "11:30", barber: "Rafael Costa" },
    { client: "Carlos Lima", service: "Barba Completa", time: "14:00", barber: "André Silva" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold mb-2">
              Dashboard <span className="text-primary">Administrativo</span>
            </h1>
            <p className="text-muted-foreground">Visão geral da sua barbearia</p>
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
                  {recentBookings.map((booking, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
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
                  ))}
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
    </div>
  );
};

export default Admin;
