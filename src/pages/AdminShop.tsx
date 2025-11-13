import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DEFAULT_INVENTORY, InventoryData, StoreProduct } from "@/data/inventory";
import { loadInventory, persistInventory, resetInventory } from "@/lib/inventory-storage";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, ImageIcon, RefreshCcw, ShoppingCart, ShoppingBag, Star, Trash2, Plus, Sparkles } from "lucide-react";

interface ProductFormState {
  name: string;
  description: string;
  imageUrl: string;
  imageFileName: string | null;
  rating: string;
  price: string;
  vipPromotionLabel: string;
}

const PLACEHOLDER_IMAGE = "/placeholder.svg";

const INITIAL_PRODUCT_FORM: ProductFormState = {
  name: "",
  description: "",
  imageUrl: "",
  imageFileName: null,
  rating: "4.5",
  price: "0",
  vipPromotionLabel: "",
};

const AdminShop = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryData>(DEFAULT_INVENTORY);
  const [storefrontForm, setStorefrontForm] = useState(DEFAULT_INVENTORY.storefront);
  const [activeProductId, setActiveProductId] = useState<string | null>(DEFAULT_INVENTORY.storeProducts[0]?.id ?? null);
  const [productForm, setProductForm] = useState<ProductFormState>(INITIAL_PRODUCT_FORM);
  const initializedRef = useRef(false);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  useEffect(() => {
    const data = loadInventory();
    setInventory(data);
    setStorefrontForm(data.storefront);
    setActiveProductId(data.storeProducts[0]?.id ?? null);
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }
    persistInventory(inventory);
  }, [inventory]);

  const activeProduct = useMemo(
    () => inventory.storeProducts.find((product) => product.id === activeProductId) ?? null,
    [inventory.storeProducts, activeProductId]
  );

  useEffect(() => {
    if (activeProduct) {
      setProductForm({
        name: activeProduct.name,
        description: activeProduct.description,
        imageUrl: activeProduct.imageUrl,
        imageFileName: null,
        rating: activeProduct.rating.toString(),
        price: activeProduct.price.toString().replace(".", ","),
        vipPromotionLabel: activeProduct.vipPromotionLabel,
      });
    } else {
      setProductForm(INITIAL_PRODUCT_FORM);
    }
  }, [activeProduct]);

  const handleStorefrontChange = (field: keyof typeof storefrontForm, value: string) => {
    setStorefrontForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleStorefrontSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setInventory((previous) => ({
      ...previous,
      storefront: {
        title: storefrontForm.title.trim() || DEFAULT_INVENTORY.storefront.title,
        subtitle: storefrontForm.subtitle.trim() || DEFAULT_INVENTORY.storefront.subtitle,
        highlight: storefrontForm.highlight.trim() || DEFAULT_INVENTORY.storefront.highlight,
      },
    }));

    toast({
      title: "Vitrine atualizada",
      description: "As informações principais da loja foram salvas.",
    });
  };

  const handleProductFormChange = <Key extends keyof ProductFormState>(field: Key, value: ProductFormState[Key]) => {
    setProductForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleProductImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    event.target.value = "";

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result?.toString();
      if (!result) {
        toast({
          variant: "destructive",
          title: "Falha ao carregar imagem",
          description: "Não foi possível processar o arquivo. Tente novamente.",
        });
        return;
      }

      setProductForm((previous) => ({
        ...previous,
        imageUrl: result,
        imageFileName: file.name,
      }));

      toast({
        title: "Imagem carregada",
        description: "Pré-visualização atualizada com sucesso.",
      });
    };

    reader.onerror = () => {
      toast({
        variant: "destructive",
        title: "Falha ao carregar imagem",
        description: "Não foi possível processar o arquivo. Tente novamente.",
      });
    };

    reader.readAsDataURL(file);
  };

  const handleClearProductImage = () => {
    setProductForm((previous) => ({
      ...previous,
      imageUrl: "",
      imageFileName: null,
    }));
  };

  const parseCurrency = (value: string) => {
    const normalized = value.replace(/[^\d,]/g, "").replace(",", ".");
    return Number(normalized);
  };

  const upsertProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productForm.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Preencha o nome do produto.",
      });
      return;
    }

    const numericRating = Number(productForm.rating);
    const numericPrice = parseCurrency(productForm.price);

    const baseProduct: StoreProduct =
      activeProduct ??
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        imageUrl: "",
        rating: 0,
        price: 0,
        quantity: 0,
        minStock: 0,
        vipDiscount: 0,
        vipPromotionLabel: "",
        createdAt: new Date().toISOString(),
      };

    const sanitizedProduct: StoreProduct = {
      ...baseProduct,
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      imageUrl: productForm.imageUrl || "",
      rating: Number.isNaN(numericRating) ? baseProduct.rating : Math.min(Math.max(numericRating, 0), 5),
      price: Number.isNaN(numericPrice) ? baseProduct.price : Number(numericPrice.toFixed(2)),
      vipPromotionLabel: productForm.vipPromotionLabel.trim(),
    };

    setInventory((previous) => {
      const exists = previous.storeProducts.some((product) => product.id === sanitizedProduct.id);
      const storeProducts = exists
        ? previous.storeProducts.map((product) => (product.id === sanitizedProduct.id ? sanitizedProduct : product))
        : [...previous.storeProducts, sanitizedProduct];

      if (!exists) {
        setActiveProductId(sanitizedProduct.id);
      }

      return {
        ...previous,
        storeProducts,
      };
    });

    toast({
      title: "Produto salvo",
      description: `${sanitizedProduct.name} foi ${activeProduct ? "atualizado" : "adicionado"} à vitrine.`,
    });
  };

  const removeProduct = (id: string) => {
    setInventory((previous) => {
      const filtered = previous.storeProducts.filter((product) => product.id !== id);
      if (!filtered.length) {
        setActiveProductId(null);
      } else if (activeProductId === id) {
        setActiveProductId(filtered[0].id);
      }

      return {
        ...previous,
        storeProducts: filtered,
      };
    });

    toast({
      title: "Produto removido",
      description: "O item foi removido da loja.",
    });
  };

  const addNewProduct = () => {
    setActiveProductId(null);
    setProductForm(INITIAL_PRODUCT_FORM);
  };

  const handleResetShop = () => {
    resetInventory();
    const data = loadInventory();
    setInventory(data);
    setStorefrontForm(data.storefront);
    setActiveProductId(data.storeProducts[0]?.id ?? null);
    toast({
      title: "Loja restaurada",
      description: "Os dados padrão da loja foram carregados novamente.",
    });
  };

  const previewProducts = useMemo(() => inventory.storeProducts, [inventory.storeProducts]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-4xl font-display font-bold">
                  Vitrine da <span className="text-primary">Loja</span>
                </h1>
                <p className="text-muted-foreground">
                  Visualize a vitrine e personalize textos, imagens e preços dos produtos.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={addNewProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Novo produto
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Restaurar padrão
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Restaurar vitrine?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação sobrescreve produtos, textos e imagens com as configurações iniciais.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetShop}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Card className="mb-8 border-primary/20 shadow-gold/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pré-visualização da loja</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Assim seus clientes enxergam os produtos na página pública.
                </p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" />
                Preview
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-display font-bold mb-3">
                  {storefrontForm.title.split(" ").slice(0, -1).join(" ") || "Nossa"}{" "}
                  <span className="text-primary">
                    {storefrontForm.title.split(" ").slice(-1)[0] || "Loja"}
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  {storefrontForm.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {previewProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="shadow-card border-border overflow-hidden group"
                  >
                    <div className="relative h-56 overflow-hidden bg-secondary">
                      <img
                        src={product.imageUrl || PLACEHOLDER_IMAGE}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="text-sm font-semibold">
                          {product.rating?.toFixed(1) ?? "5.0"}
                        </span>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{product.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">
                          {currencyFormatter.format(product.price)}
                        </span>
                        <Button type="button" variant="hero" disabled>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                      {product.vipPromotionLabel && (
                        <Badge variant="outline" className="mt-3 text-xs">
                          {product.vipPromotionLabel}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-8 border-dashed border-primary/40 bg-secondary/30">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="text-xl font-semibold mb-2">Dica</h3>
                  <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    Utilize descrições envolventes e fotos de alta qualidade para aumentar a conversão da sua loja.
                    Todas as alterações são aplicadas instantaneamente à página pública.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <Card className="shadow-card border-border">
      <CardHeader>
        <CardTitle>Configurações da vitrine</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleStorefrontSubmit}>
          <div className="space-y-2">
            <Label htmlFor="store-title">Título</Label>
            <Input
              id="store-title"
              value={storefrontForm.title}
              onChange={(event) => handleStorefrontChange("title", event.target.value)}
              placeholder="Nossa Loja"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-subtitle">Subtítulo</Label>
            <Textarea
              id="store-subtitle"
              value={storefrontForm.subtitle}
              onChange={(event) => handleStorefrontChange("subtitle", event.target.value)}
              placeholder="Mensagem principal da vitrine"
              className="min-h-[80px]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-highlight">Mensagem destaque</Label>
            <Textarea
              id="store-highlight"
              value={storefrontForm.highlight}
              onChange={(event) => handleStorefrontChange("highlight", event.target.value)}
              placeholder="Informação exibida no rodapé da loja"
              className="min-h-[80px]"
            />
          </div>
          <Button type="submit" variant="hero" className="w-full">
            Salvar vitrine
          </Button>
        </form>
      </CardContent>
    </Card>

    <Card className="shadow-card border-border">
      <CardHeader>
        <CardTitle>Produtos cadastrados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {inventory.storeProducts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum produto cadastrado. Utilize o botão &quot;Novo produto&quot; para adicionar itens à loja.
          </p>
        )}
        {inventory.storeProducts.map((product) => {
          const isActive = product.id === activeProductId;
          return (
            <button
              key={product.id}
              onClick={() => setActiveProductId(product.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                isActive ? "border-primary bg-primary/5 shadow-gold" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-secondary">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{product.name}</p>
                    <span className="text-sm font-semibold text-primary">
                      {currencyFormatter.format(product.price)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 text-primary" />
                      {product.rating.toFixed(1)}
                    </span>
                    {product.vipPromotionLabel && (
                      <Badge variant="outline" className="text-[10px]">
                        {product.vipPromotionLabel}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {inventory.storeProducts.length} produto(s) publicados
      </CardFooter>
    </Card>

    <Card className="shadow-card border-border xl:col-span-1">
      <CardHeader>
        <CardTitle>{activeProduct ? "Editar produto" : "Novo produto"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={upsertProduct}>
          <div className="space-y-2">
            <Label htmlFor="product-name">Nome</Label>
            <Input
              id="product-name"
              value={productForm.name}
              onChange={(event) => handleProductFormChange("name", event.target.value)}
              placeholder="Nome do produto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-description">Descrição</Label>
            <Textarea
              id="product-description"
              value={productForm.description}
              onChange={(event) => handleProductFormChange("description", event.target.value)}
              placeholder="Descrição exibida na loja"
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-image">Imagem do produto</Label>
            <Input
              id="product-image"
              type="file"
              accept="image/*"
              onChange={handleProductImageUpload}
            />
            {productForm.imageUrl && (
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                <div className="h-16 w-16 overflow-hidden rounded-md bg-secondary">
                  <img
                    src={productForm.imageUrl}
                    alt={productForm.name || "Pré-visualização do produto"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 text-xs text-muted-foreground">
                  <p>Pré-visualização do produto</p>
                  {productForm.imageFileName && <p>{productForm.imageFileName}</p>}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleClearProductImage}>
                  Remover
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-price">Preço</Label>
              <Input
                id="product-price"
                value={productForm.price}
                onChange={(event) => handleProductFormChange("price", event.target.value)}
                placeholder="59,90"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-rating">Avaliação</Label>
              <Input
                id="product-rating"
                value={productForm.rating}
                onChange={(event) => handleProductFormChange("rating", event.target.value)}
                placeholder="4.8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-vip-label">Texto promocional (opcional)</Label>
            <Input
              id="product-vip-label"
              value={productForm.vipPromotionLabel}
              onChange={(event) => handleProductFormChange("vipPromotionLabel", event.target.value)}
              placeholder="VIP: 15% OFF e brinde exclusivo"
            />
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
            <p>
              Utilize promoções exclusivas para clientes VIP e destaque benefícios diretamente na vitrine.
            </p>
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <Button type="submit" variant="hero">
              {activeProduct ? "Salvar alterações" : "Adicionar produto"}
            </Button>

            {activeProduct && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover produto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover {activeProduct.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação remove o produto da vitrine da loja. Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => removeProduct(activeProduct.id)}>
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
        </div>
      </main>
    </div>
  );
};

export default AdminShop;

