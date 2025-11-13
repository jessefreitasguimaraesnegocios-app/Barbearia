import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Calendar, Scissors, ShoppingBag, Clock, Star, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-barber.jpg";

const Index = () => {
  const features = [
    {
      icon: Calendar,
      title: "Agendamento Inteligente",
      description: "Sistema de agendamento em tempo real com calendário interativo e confirmação automática."
    },
    {
      icon: ShoppingBag,
      title: "Loja Integrada",
      description: "Venda produtos para seus clientes com carrinho de compras e checkout seguro."
    },
    {
      icon: TrendingUp,
      title: "Dashboard Completo",
      description: "Gerencie sua barbearia com visão completa de agendamentos, clientes e finanças."
    },
    {
      icon: Clock,
      title: "Gestão de Horários",
      description: "Controle total sobre disponibilidade de barbeiros e horários de funcionamento."
    },
    {
      icon: Star,
      title: "Perfil de Barbeiros",
      description: "Portfólio individual para cada profissional com avaliações de clientes."
    },
    {
      icon: Scissors,
      title: "Catálogo de Serviços",
      description: "Organize seus serviços com preços, duração e descrições detalhadas."
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight">
              Gestão Profissional para sua
              <span className="text-primary gradient-gold bg-clip-text text-transparent"> Barbearia</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Plataforma completa com agendamento online, e-commerce integrado e dashboard administrativo.
              Tudo que você precisa em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/barbearias">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Scissors className="mr-2 h-5 w-5" />
                  Ver Barbearias
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-dark">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Recursos que <span className="text-primary">Transformam</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tecnologia de ponta para otimizar cada aspecto da gestão da sua barbearia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card hover:shadow-gold transition-all duration-300 border-border bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="shadow-gold border-primary/20 bg-gradient-to-br from-card to-secondary">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Pronto para Transformar sua Barbearia?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Junte-se às melhores barbearias que já utilizam o BarberBook Pro
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="hero" size="lg">
                    Começar Agora
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button variant="outline" size="lg">
                    Área Administrativa
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
