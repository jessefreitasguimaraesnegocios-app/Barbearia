import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Trash2, ShoppingBag, Plus, Minus } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

const Cart = () => {
  const { items, removeItem, updateQuantity, clearCart, totalValue } = useCart();

  const formattedTotal = useMemo(() => {
    return totalValue.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  }, [totalValue]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Seu <span className="text-primary">Carrinho</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Confira os produtos selecionados e finalize sua compra.
            </p>
          </div>

          {items.length === 0 ? (
            <Card className="shadow-card border-border text-center py-16">
              <CardContent className="space-y-6">
                <ShoppingBag className="h-16 w-16 text-primary mx-auto" />
                <div>
                  <h2 className="text-2xl font-display font-semibold mb-2">
                    Seu carrinho está vazio
                  </h2>
                  <p className="text-muted-foreground">
                    Adicione produtos na página da Loja para visualizá-los aqui.
                  </p>
                </div>
                <Button variant="hero" size="lg" asChild>
                  <Link to="/shop">Voltar para a Loja</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="border-border shadow-card">
                    <CardContent className="flex flex-col md:flex-row gap-6 py-6">
                      <div className="h-32 w-full md:w-32 overflow-hidden rounded-xl bg-secondary">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== "/placeholder.svg") {
                              target.src = "/placeholder.svg";
                            }
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-semibold">{item.name}</h3>
                            <p className="text-primary font-medium text-lg">
                              {item.priceLabel}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Remover ${item.name}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            Quantidade
                          </span>
                          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label="Diminuir quantidade"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center text-sm font-medium py-1">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-none"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= 99}
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="h-fit border-primary/20 shadow-gold">
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span>Total</span>
                    <span className="font-semibold text-primary">
                      {formattedTotal}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Os valores podem variar de acordo com a barbearia selecionada no
                    momento da finalização do pedido.
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button variant="hero" className="w-full">
                    Finalizar Compra
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={clearCart}
                  >
                    Limpar Carrinho
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;

