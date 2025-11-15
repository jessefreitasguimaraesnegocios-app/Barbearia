import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_INVENTORY } from "@/data/inventory";
import { loadInventory } from "@/lib/inventory-storage";

const PLACEHOLDER_IMAGE = "/placeholder.svg";

type CategoryFilter = "produtos" | "consumo" | "bebidas";

const Shop = () => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState(DEFAULT_INVENTORY.storeProducts);
  const [storefront, setStorefront] = useState(DEFAULT_INVENTORY.storefront);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("produtos");
  const [selectedBarbershop, setSelectedBarbershop] = useState<{
    id: number | string;
    name: string;
    email?: string;
  } | null>(null);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  useEffect(() => {
    const applyInventory = () => {
      const storedSelection = localStorage.getItem("selectedBarbershop");
      let barbershopId: string | null = null;
      
      if (storedSelection) {
        try {
          const parsed = JSON.parse(storedSelection) as { id: number | string; name: string; email?: string };
          barbershopId = typeof parsed.id === "number" ? String(parsed.id) : (parsed.id || null);
          setSelectedBarbershop(parsed);
        } catch {
          // Ignore parse errors
        }
      }
      
      const data = loadInventory(barbershopId);
      setProducts(data.storeProducts);
      setStorefront(data.storefront);
    };

    applyInventory();

    const handleStorage = (event: StorageEvent) => {
      if (event.key?.startsWith("barberbook_admin_inventory") || event.key === "selectedBarbershop") {
        applyInventory();
      }
    };

    window.addEventListener("storage", handleStorage);
    
    const handleLocalStorageChange = () => {
      applyInventory();
    };
    
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(...args) {
      originalSetItem.apply(this, args);
      if (args[0]?.startsWith("barberbook_admin_inventory") || args[0] === "selectedBarbershop") {
        handleLocalStorageChange();
      }
    };

    return () => {
      window.removeEventListener("storage", handleStorage);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  const displayProducts = useMemo(() => {
    const allProducts = !products.length ? DEFAULT_INVENTORY.storeProducts : products;
    return allProducts.filter((product) => product.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleAddToCart = (product: (typeof displayProducts)[number]) => {
    const numericId = Number(product.id.toString().replace(/[^\d]/g, "")) || displayProducts.indexOf(product) + 1;

    addItem({
      id: numericId,
      name: product.name,
      priceLabel: currencyFormatter.format(product.price),
      priceValue: product.price,
      image: product.imageUrl || PLACEHOLDER_IMAGE,
    });

    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">
              {storefront.title.split(" ").slice(0, -1).join(" ") || "Nossa"}{" "}
              <span className="text-primary">
                {storefront.title.split(" ").slice(-1)[0] || "Loja"}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {storefront.subtitle}
            </p>
            {selectedBarbershop && (
              <div className="mt-4">
                <span className="text-sm uppercase tracking-wide text-muted-foreground">
                  Barbearia selecionada:
                </span>
                <p className="text-2xl font-display font-semibold text-primary mt-1">
                  {selectedBarbershop.name}
                </p>
              </div>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button
              variant={selectedCategory === "produtos" ? "hero" : "outline"}
              onClick={() => setSelectedCategory("produtos")}
              className="min-w-[120px]"
            >
              Produtos
            </Button>
            <Button
              variant={selectedCategory === "consumo" ? "hero" : "outline"}
              onClick={() => setSelectedCategory("consumo")}
              className="min-w-[120px]"
            >
              Consumo
            </Button>
            <Button
              variant={selectedCategory === "bebidas" ? "hero" : "outline"}
              onClick={() => setSelectedCategory("bebidas")}
              className="min-w-[120px]"
            >
              Bebidas
            </Button>
          </div>

          {/* Products Grid */}
          {displayProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProducts.map((product) => (
                <Card
                  key={product.id}
                  className="shadow-card hover:shadow-gold transition-all duration-300 border-border overflow-hidden group"
                >
                  <div className="relative h-64 overflow-hidden bg-secondary">
                    <img
                      src={product.imageUrl || PLACEHOLDER_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="text-sm font-semibold">
                        {product.rating?.toFixed(1) ?? "5.0"}
                      </span>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">{product.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {currencyFormatter.format(product.price)}
                      </span>
                      <Button
                        type="button"
                        variant="hero"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                Nenhum produto encontrado nesta categoria.
              </p>
            </div>
          )}

          {/* Bottom Info */}
          <div className="mt-16 text-center">
            <Link to="/cart" className="inline-block">
              <Card className="shadow-gold border-primary/20 bg-gradient-to-br from-card to-secondary max-w-2xl cursor-pointer transition-transform hover:-translate-y-1">
                <CardContent className="p-8">
                  <ShoppingCart className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-display font-bold mb-2">Carrinho</h3>
                  <p className="text-muted-foreground">
                    {storefront.highlight}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
