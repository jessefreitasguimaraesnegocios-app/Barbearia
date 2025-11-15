import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Phone, Clock, AlertCircle } from "lucide-react";
import { Barbershop, DEFAULT_BARBERSHOPS } from "@/data/barbershops";
import { loadBarbershops } from "@/lib/barbershops-storage";

const Barbearias = () => {
  const navigate = useNavigate();
  const [barbershops, setBarbershops] = useState<Barbershop[]>(DEFAULT_BARBERSHOPS);

  useEffect(() => {
    const initialData = loadBarbershops();
    setBarbershops(initialData);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "barberbook_admin_barbershops") {
        setBarbershops(loadBarbershops());
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
              Barbearias <span className="text-primary">Disponíveis</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Selecionamos barbearias com alto padrão de atendimento para você aproveitar os melhores serviços.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {barbershops.map((barbershop) => (
              <Card key={barbershop.id} className="shadow-card hover:shadow-gold transition-all duration-300 border-border">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{barbershop.name}</CardTitle>
                      <div className="flex items-center text-muted-foreground mt-2">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span>{barbershop.address}</span>
                      </div>
                    </div>
                    <div className="flex items-center bg-primary/10 px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 text-primary mr-1" />
                      <span className="text-sm font-semibold">{barbershop.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2 text-primary" />
                    <span>{barbershop.phone}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary mr-2" />
                    {barbershop.hours}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <span
                        className={`mr-2 h-3 w-3 rounded-full ${
                          barbershop.isOpen ? "bg-emerald-500" : "bg-red-500"
                        }`}
                      />
                      <span
                        className={`font-semibold ${
                          barbershop.isOpen ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {barbershop.isOpen ? "Aberto" : "Fechado"}
                      </span>
                    </div>
                    {barbershop.status === "indisponivel" && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Indisponível
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="hero"
                    className="w-full"
                    disabled={barbershop.status === "indisponivel"}
                    onClick={() => {
                      if (barbershop.status === "indisponivel") return;
                      localStorage.setItem(
                        "selectedBarbershop",
                        JSON.stringify({
                          id: barbershop.id,
                          name: barbershop.name,
                          email: barbershop.email,
                        })
                      );
                      navigate("/services");
                    }}
                  >
                    {barbershop.status === "indisponivel" ? "Indisponível" : "Selecionar Barbearia"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Barbearias;

