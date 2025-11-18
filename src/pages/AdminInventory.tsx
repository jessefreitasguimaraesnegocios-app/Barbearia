import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  ConsumableItem,
  DEFAULT_CONSUMABLES,
  DEFAULT_INVENTORY,
  DEFAULT_STORE_PRODUCTS,
  InventoryData,
  StoreProduct,
} from "@/data/inventory";
import { loadInventory, persistInventory, resetInventory } from "@/lib/inventory-storage";
import { loadBarbershops } from "@/lib/barbershops-storage";
import {
  AlertCircle,
  ArrowLeft,
  Box,
  Boxes,
  ImageIcon,
  Package,
  Percent,
  Plus,
  RefreshCcw,
  Shield,
  ShoppingBag,
  Star,
  Trash2,
} from "lucide-react";

interface ProductFormState {
  name: string;
  description: string;
  imageUrl: string;
  imageFileName: string | null;
  rating: string;
  price: string;
  quantity: string;
  minStock: string;
  vipDiscount: string;
  vipPromotionLabel: string;
}

interface ConsumableFormState {
  name: string;
  imageUrl: string | null;
  imageFileName: string | null;
  quantity: string;
  minStock: string;
  unit: string;
  notes: string;
}

const INITIAL_PRODUCT_FORM: ProductFormState = {
  name: "",
  description: "",
  imageUrl: "",
  imageFileName: null,
  rating: "4.5",
  price: "0",
  quantity: "0",
  minStock: "0",
  vipDiscount: "0",
  vipPromotionLabel: "",
};

const INITIAL_CONSUMABLE_FORM: ConsumableFormState = {
  name: "",
  imageUrl: null,
  imageFileName: null,
  quantity: "0",
  minStock: "0",
  unit: "unidades",
  notes: "",
};

const AdminInventory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryData>(DEFAULT_INVENTORY);
  const [activeProductId, setActiveProductId] = useState<string | null>(DEFAULT_STORE_PRODUCTS[0]?.id ?? null);
  const [activeConsumableId, setActiveConsumableId] = useState<string | null>(DEFAULT_CONSUMABLES[0]?.id ?? null);
  const [productForm, setProductForm] = useState<ProductFormState>(INITIAL_PRODUCT_FORM);
  const [consumableForm, setConsumableForm] = useState<ConsumableFormState>(INITIAL_CONSUMABLE_FORM);
  const [currentTab, setCurrentTab] = useState<"store" | "consumables">("store");
  const [activeBarbershopId, setActiveBarbershopId] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const alertedRef = useRef<{ store: Set<string>; consumables: Set<string> }>({
    store: new Set(),
    consumables: new Set(),
  });

  const isLowStock = (quantity: number, minStock: number) => quantity <= minStock;

  useEffect(() => {
    let isInternalUpdate = false;
    
    const loadData = () => {
      if (isInternalUpdate) {
        return;
      }
      
      const barbershops = loadBarbershops();
      const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
      const storedMatch = storedActiveId ? barbershops.find((shop) => shop.id === storedActiveId) : null;
      const fallbackBarbershop = barbershops[0] ?? null;
      const targetBarbershop = storedMatch ?? fallbackBarbershop;
      const resolvedBarbershopId = targetBarbershop?.id ?? null;

      setActiveBarbershopId(resolvedBarbershopId);

      const data = loadInventory(resolvedBarbershopId);
      setInventory(data);
      setActiveProductId(data.storeProducts[0]?.id ?? null);
      setActiveConsumableId(data.consumables[0]?.id ?? null);
      initializedRef.current = true;
    };

    loadData();

    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === "admin_active_barbershop_id" ||
        event.key?.startsWith("barberbook_admin_inventory")
      ) {
        loadData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const handleLocalStorageChange = () => {
      if (!isInternalUpdate) {
        loadData();
      }
    };

    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(...args) {
      const isInventoryKey = args[0] === "admin_active_barbershop_id" || args[0]?.startsWith("barberbook_admin_inventory");
      
      if (isInventoryKey && !args[0]?.includes("_default") && initializedRef.current) {
        isInternalUpdate = true;
        originalSetItem.apply(this, args);
        setTimeout(() => {
          isInternalUpdate = false;
        }, 100);
      } else {
        originalSetItem.apply(this, args);
      }
      
      if (isInventoryKey && !isInternalUpdate) {
        handleLocalStorageChange();
      }
    };

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }
    const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
    const barbershopId = storedActiveId || activeBarbershopId;
    
    const timeoutId = setTimeout(() => {
      persistInventory(inventory, barbershopId);
    }, 300);

    const alertedStore = alertedRef.current.store;
    const alertedConsumables = alertedRef.current.consumables;

    inventory.storeProducts.forEach((product) => {
      if (isLowStock(product.quantity, product.minStock) && !alertedStore.has(product.id)) {
        alertedStore.add(product.id);
        toast({
          variant: "destructive",
          title: "Reposição necessária",
          description: `${product.name} está com ${product.quantity} unidade(s). Considere repor o estoque.`,
        });
      } else if (!isLowStock(product.quantity, product.minStock) && alertedStore.has(product.id)) {
        alertedStore.delete(product.id);
      }
    });

    inventory.consumables.forEach((item) => {
      if (isLowStock(item.quantity, item.minStock) && !alertedConsumables.has(item.id)) {
        alertedConsumables.add(item.id);
        toast({
          variant: "destructive",
          title: "Consumo em baixa",
          description: `${item.name} está com ${item.quantity} ${item.unit}. Programe a reposição.`,
        });
      } else if (!isLowStock(item.quantity, item.minStock) && alertedConsumables.has(item.id)) {
        alertedConsumables.delete(item.id);
      }
    });
    
    return () => clearTimeout(timeoutId);
  }, [inventory, activeBarbershopId]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    [],
  );

  const activeProduct = useMemo(
    () => inventory.storeProducts.find((product) => product.id === activeProductId) ?? null,
    [inventory.storeProducts, activeProductId],
  );

  const activeConsumable = useMemo(
    () => inventory.consumables.find((item) => item.id === activeConsumableId) ?? null,
    [inventory.consumables, activeConsumableId],
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
        quantity: activeProduct.quantity.toString(),
        minStock: activeProduct.minStock.toString(),
        vipDiscount: activeProduct.vipDiscount.toString(),
        vipPromotionLabel: activeProduct.vipPromotionLabel,
      });
    } else {
      setProductForm(INITIAL_PRODUCT_FORM);
    }
  }, [activeProduct]);

  useEffect(() => {
    if (activeConsumable) {
      setConsumableForm({
        name: activeConsumable.name,
        imageUrl: activeConsumable.imageUrl,
        imageFileName: activeConsumable.imageFileName ?? null,
        quantity: activeConsumable.quantity.toString(),
        minStock: activeConsumable.minStock.toString(),
        unit: activeConsumable.unit,
        notes: activeConsumable.notes,
      });
    } else {
      setConsumableForm(INITIAL_CONSUMABLE_FORM);
    }
  }, [activeConsumable]);

  const handleProductFormChange = <Key extends keyof ProductFormState>(field: Key, value: ProductFormState[Key]) => {
    setProductForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleConsumableFormChange = <Key extends keyof ConsumableFormState>(
    field: Key,
    value: ConsumableFormState[Key],
  ) => {
    setConsumableForm((previous) => ({
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

  const handleConsumableImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      setConsumableForm((previous) => ({
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

  const handleClearConsumableImage = () => {
    setConsumableForm((previous) => ({
      ...previous,
      imageUrl: null,
      imageFileName: null,
    }));
  };

  const parseInteger = (value: string) => {
    const numeric = Number(value.replace(/[^\d-]/g, ""));
    return Number.isNaN(numeric) ? 0 : numeric;
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
    const numericQuantity = parseInteger(productForm.quantity);
    const numericMinStock = Math.max(parseInteger(productForm.minStock), 0);
    const numericVipDiscount = Math.min(Math.max(Number(productForm.vipDiscount), 0), 100);

    const sanitizedProduct: StoreProduct = {
      id: activeProduct?.id ?? crypto.randomUUID(),
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      imageUrl: (productForm.imageUrl?.trim() || ""),
      rating: Number.isNaN(numericRating) ? 0 : Math.min(Math.max(numericRating, 0), 5),
      price: Number.isNaN(numericPrice) ? 0 : Number(numericPrice.toFixed(2)),
      quantity: Math.max(0, numericQuantity),
      minStock: numericMinStock,
      vipDiscount: Number.isNaN(numericVipDiscount) ? 0 : numericVipDiscount,
      vipPromotionLabel: productForm.vipPromotionLabel.trim(),
      createdAt: activeProduct?.createdAt ?? new Date().toISOString(),
    };

    setInventory((previous) => {
      const exists = previous.storeProducts.some((product) => product.id === sanitizedProduct.id);
      const storeProducts: StoreProduct[] = exists
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
      description: `${sanitizedProduct.name} foi ${activeProduct ? "atualizado" : "adicionado"} com sucesso.`,
    });
  };

  const removeProduct = (id: string) => {
    setInventory((previous) => {
      const filtered = previous.storeProducts.filter((product) => product.id !== id);
      if (filtered.length === 0) {
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
      description: "Produto retirado do estoque da loja.",
    });
  };

  const upsertConsumable = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!consumableForm.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Preencha o nome do item de consumo.",
      });
      return;
    }

    const numericQuantity = parseInteger(consumableForm.quantity);
    const numericMinStock = Math.max(parseInteger(consumableForm.minStock), 0);

    const sanitizedItem: ConsumableItem = {
      id: activeConsumable?.id ?? crypto.randomUUID(),
      name: consumableForm.name.trim(),
      imageUrl: consumableForm.imageUrl ?? null,
      imageFileName: consumableForm.imageFileName ?? null,
      quantity: Math.max(0, numericQuantity),
      minStock: numericMinStock,
      unit: consumableForm.unit.trim(),
      notes: consumableForm.notes.trim(),
      updatedAt: new Date().toISOString(),
    };

    setInventory((previous) => {
      const exists = previous.consumables.some((item) => item.id === sanitizedItem.id);
      const consumables: ConsumableItem[] = exists
        ? previous.consumables.map((item) => (item.id === sanitizedItem.id ? sanitizedItem : item))
        : [...previous.consumables, sanitizedItem];

      if (!exists) {
        setActiveConsumableId(sanitizedItem.id);
      }

      return {
        ...previous,
        consumables,
      };
    });

    toast({
      title: "Item salvo",
      description: `${sanitizedItem.name} foi ${activeConsumable ? "atualizado" : "adicionado"} no consumo interno.`,
    });
  };

  const removeConsumable = (id: string) => {
    setInventory((previous) => {
      const filtered = previous.consumables.filter((item) => item.id !== id);
      if (filtered.length === 0) {
        setActiveConsumableId(null);
      } else if (activeConsumableId === id) {
        setActiveConsumableId(filtered[0].id);
      }

      return {
        ...previous,
        consumables: filtered,
      };
    });

    toast({
      title: "Item removido",
      description: "Material de consumo retirado do controle de estoque.",
    });
  };

  const handleResetInventory = () => {
    const storedActiveId = localStorage.getItem("admin_active_barbershop_id");
    const barbershopId = storedActiveId || activeBarbershopId;
    resetInventory(barbershopId);
    const data = loadInventory(barbershopId);
    setInventory(data);
    setActiveProductId(data.storeProducts[0]?.id ?? null);
    setActiveConsumableId(data.consumables[0]?.id ?? null);
    toast({
      title: "Estoque restaurado",
      description: "Os dados padrão foram carregados novamente.",
    });
  };

  const addNewProduct = () => {
    setCurrentTab("store");
    setActiveProductId(null);
    setProductForm(INITIAL_PRODUCT_FORM);
    
    setTimeout(() => {
      const formElement = document.getElementById("product-name");
      if (formElement) {
        formElement.scrollIntoView({ behavior: "smooth", block: "center" });
        formElement.focus();
      }
    }, 100);
  };

  const addNewConsumable = () => {
    setActiveConsumableId(null);
    setConsumableForm(INITIAL_CONSUMABLE_FORM);
  };

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
                  Gestão de <span className="text-primary">Estoque</span>
                </h1>
                <p className="text-muted-foreground">
                  Controle produtos da loja e itens de consumo da barbearia com alertas de reposição.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={addNewProduct}>
                <Plus className="mr-2 h-4 w-4" />
                + ADD Produto
              </Button>
              <Button variant="secondary" onClick={addNewConsumable}>
                <Plus className="mr-2 h-4 w-4" />
                Novo item de consumo
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
                    <AlertDialogTitle>Restaurar estoque padrão?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Essa ação remove produtos e itens personalizados, voltando às configurações iniciais.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetInventory}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as "store" | "consumables")}>
            <TabsList className="mb-6">
              <TabsTrigger value="store" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" /> Loja
              </TabsTrigger>
              <TabsTrigger value="consumables" className="flex items-center gap-2">
                <Boxes className="h-4 w-4" /> Consumo da Barbearia
              </TabsTrigger>
            </TabsList>

            <TabsContent value="store">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="shadow-card border-border">
                  <CardHeader>
                    <CardTitle>Produtos cadastrados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {inventory.storeProducts.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhum produto cadastrado. Clique em &quot;Novo produto&quot; para adicionar itens à loja.
                      </p>
                    )}

                    {inventory.storeProducts.map((product) => {
                      const isActive = product.id === activeProductId;
                      const showLowStock = isLowStock(product.quantity, product.minStock);

                      return (
                        <button
                          key={product.id}
                          onClick={() => setActiveProductId(product.id)}
                          className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                            isActive
                              ? "border-primary bg-primary/5 shadow-gold"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-secondary">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold flex items-center gap-2">{product.name}</p>
                                <span className="text-sm font-semibold text-primary">
                                  {currencyFormatter.format(product.price)}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Star className="h-3 w-3 text-primary" />
                                  {product.rating.toFixed(1)}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Package className="h-3 w-3 text-primary" />
                                  {product.quantity} un.
                                </span>
                                {product.vipDiscount > 0 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    VIP -{product.vipDiscount}%
                                  </Badge>
                                )}
                                {showLowStock && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Necessário repor
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
                    {inventory.storeProducts.length} produto(s) na loja
                  </CardFooter>
                </Card>

                <Card className="shadow-card border-border xl:col-span-2">
                  <CardHeader>
                    <CardTitle>{activeProduct ? "Editar produto" : "Novo produto"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6" onSubmit={upsertProduct}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-name">Nome</Label>
                          <Input
                            id="product-name"
                            value={productForm.name}
                            onChange={(event) => handleProductFormChange("name", event.target.value)}
                            placeholder="Pomada Modeladora"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-rating">Avaliação</Label>
                          <Input
                            id="product-rating"
                            value={productForm.rating}
                            onChange={(event) => handleProductFormChange("rating", event.target.value)}
                            placeholder="4,8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="product-description">Descrição</Label>
                        <Textarea
                          id="product-description"
                          value={productForm.description}
                          onChange={(event) => handleProductFormChange("description", event.target.value)}
                          placeholder="Detalhes do produto para a vitrine."
                          className="min-h-[110px]"
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

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="product-price">Preço</Label>
                          <Input
                            id="product-price"
                            value={productForm.price}
                            onChange={(event) => handleProductFormChange("price", event.target.value)}
                            placeholder="199,90"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-quantity">Quantidade</Label>
                          <Input
                            id="product-quantity"
                            value={productForm.quantity}
                            onChange={(event) => handleProductFormChange("quantity", event.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-min-stock">Alerta de reposição</Label>
                          <Input
                            id="product-min-stock"
                            value={productForm.minStock}
                            onChange={(event) => handleProductFormChange("minStock", event.target.value)}
                            placeholder="Quantidade mínima"
                          />
                        </div>
                      </div>


                      <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          <span>
                            Estoque atual:{" "}
                            <strong className="text-primary">{productForm.quantity || "0"} un.</strong> • Alerta quando
                            chegar em <strong>{productForm.minStock || "0"} un.</strong>
                          </span>
                        </div>
                        {Number(productForm.vipDiscount) > 0 && (
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-primary" />
                            <span>
                              Clientes VIP recebem {productForm.vipDiscount}% de desconto e visualizam a mensagem
                              personalizada na loja.
                            </span>
                          </div>
                        )}
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
                                  Essa ação remove o produto da loja e do controle de estoque. Deseja continuar?
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
            </TabsContent>

            <TabsContent value="consumables">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="shadow-card border-border">
                  <CardHeader>
                    <CardTitle>Itens de consumo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {inventory.consumables.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhum item de consumo cadastrado. Clique em &quot;Novo item de consumo&quot; para iniciar.
                      </p>
                    )}

                    {inventory.consumables.map((item) => {
                      const isActive = item.id === activeConsumableId;
                      const showLowStock = isLowStock(item.quantity, item.minStock);

                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveConsumableId(item.id)}
                          className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                            isActive
                              ? "border-primary bg-primary/5 shadow-gold"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-secondary">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                  <Box className="h-5 w-5 text-primary" />
                                )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold">{item.name}</p>
                                <Badge variant="outline" className="text-[10px]">
                                  {item.quantity} {item.unit}
                                </Badge>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Atualizado em {new Date(item.updatedAt).toLocaleDateString()}
                              </div>
                              {showLowStock && (
                                <div className="mt-2 flex items-center gap-2 text-xs text-destructive">
                                  <AlertCircle className="h-3 w-3" />
                                  Estoque abaixo do mínimo ({item.minStock})
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    {inventory.consumables.length} item(ns) de consumo
                  </CardFooter>
                </Card>

                <Card className="shadow-card border-border xl:col-span-2">
                  <CardHeader>
                    <CardTitle>{activeConsumable ? "Editar item de consumo" : "Novo item de consumo"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-6" onSubmit={upsertConsumable}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="consumable-image">Imagem do item</Label>
                        <Input
                          id="consumable-image"
                          type="file"
                          accept="image/*"
                          onChange={handleConsumableImageUpload}
                        />
                        {consumableForm.imageUrl && (
                          <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                            <div className="h-16 w-16 overflow-hidden rounded-md bg-secondary">
                              <img
                                src={consumableForm.imageUrl}
                                alt={consumableForm.name || "Pré-visualização do item"}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 text-xs text-muted-foreground">
                              <p>Pré-visualização do item</p>
                              {consumableForm.imageFileName && <p>{consumableForm.imageFileName}</p>}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={handleClearConsumableImage}>
                              Remover
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                          <Label htmlFor="consumable-name">Nome</Label>
                          <Input
                            id="consumable-name"
                            value={consumableForm.name}
                            onChange={(event) => handleConsumableFormChange("name", event.target.value)}
                            placeholder="Lâminas descartáveis"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="consumable-unit">Unidade</Label>
                          <Input
                            id="consumable-unit"
                            value={consumableForm.unit}
                            onChange={(event) => handleConsumableFormChange("unit", event.target.value)}
                            placeholder="unidades, litros, caixas..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="consumable-quantity">Quantidade</Label>
                          <Input
                            id="consumable-quantity"
                            value={consumableForm.quantity}
                            onChange={(event) => handleConsumableFormChange("quantity", event.target.value)}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="consumable-min-stock">Alerta de reposição</Label>
                          <Input
                            id="consumable-min-stock"
                            value={consumableForm.minStock}
                            onChange={(event) => handleConsumableFormChange("minStock", event.target.value)}
                            placeholder="Quantidade mínima"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="consumable-notes">Observações</Label>
                        <Textarea
                          id="consumable-notes"
                          value={consumableForm.notes}
                          onChange={(event) => handleConsumableFormChange("notes", event.target.value)}
                          placeholder="Fornecedor preferencial, frequência de compra, etc."
                          className="min-h-[110px]"
                        />
                      </div>

                      <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <span>
                          Informe a quantidade mínima para receber alertas visuais quando o estoque estiver baixo.
                        </span>
                      </div>

                      <div className="flex flex-wrap justify-between gap-3">
                        <Button type="submit" variant="hero">
                          {activeConsumable ? "Salvar alterações" : "Adicionar item"}
                        </Button>

                        {activeConsumable && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover item
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover {activeConsumable.name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação remove o item do controle de consumo interno. Deseja continuar?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => removeConsumable(activeConsumable.id)}>
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminInventory;

