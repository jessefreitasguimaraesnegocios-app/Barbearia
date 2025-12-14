import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";
import { Collaborator } from "@/data/collaborators";
import { loadCollaborators, persistCollaborators } from "@/lib/collaborators-storage";
import { persistBarbershops } from "@/lib/barbershops-storage";
import { persistServices } from "@/lib/services-storage";
import { persistInventory } from "@/lib/inventory-storage";
import { persistVipData } from "@/lib/vips-storage";
import { verifyPassword } from "@/lib/password";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";
import { hashPassword } from "@/lib/password";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const GoogleIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M17.64 9.2045c0-.6395-.0573-1.2527-.1636-1.8409H9v3.4814h4.8618c-.2091 1.1286-.8432 2.0855-1.7932 2.7264v2.2645h2.8973c1.6945-1.5614 2.6741-3.8627 2.6741-6.6314Z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.4673-.8064 5.9564-2.1632l-2.8973-2.2645c-.8064.54-1.8373.8618-3.0591.8618-2.3527 0-4.3455-1.5886-5.0582-3.7273H.9586v2.3427C2.4382 15.9832 5.4827 18 9 18Z"
      fill="#34A853"
    />
    <path
      d="M3.9418 10.7073c-.18-.54-.2836-1.1164-.2836-1.7073s.1036-1.1673.2836-1.7073V4.95H.9586C.3477 6.1727 0 7.5486 0 9s.3477 2.8273.9586 4.05l2.9832-2.3427Z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.5455c1.3218 0 2.5082.4545 3.4382 1.3455l2.5786-2.5786C13.4645.88 11.4273 0 9 0 5.4827 0 2.4382 2.0168.9586 4.95l2.9832 2.3427C4.6545 5.1341 6.6473 3.5455 9 3.5455Z"
      fill="#EA4335"
    />
  </svg>
);

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<"success" | "error" | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => loadCollaborators());
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [signupCompany, setSignupCompany] = useState("");
  const [signupCnpj, setSignupCnpj] = useState("");
  const [signupResponsavel, setSignupResponsavel] = useState("");
  const [signupCpf, setSignupCpf] = useState("");
  const [signupWhatsapp, setSignupWhatsapp] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupEndereco, setSignupEndereco] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 14);
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    } else if (numbers.length <= 12) {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    } else {
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) {
      return numbers.length > 0 ? `(${numbers}` : numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "barberbook_admin_collaborators") {
        setCollaborators(loadCollaborators());
      }
    };

    const handleFocus = () => {
      setCollaborators(loadCollaborators());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const collaboratorsByEmail = useMemo(() => {
    return collaborators.reduce<Record<string, Collaborator>>((accumulator, collaborator) => {
      accumulator[collaborator.email.toLowerCase()] = collaborator;
      return accumulator;
    }, {});
  }, [collaborators]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginMessage(null);
    setLoginStatus(null);

    try {
      const { data, error } = await signIn(loginEmail.trim(), loginPassword);

      if (error) {
        setLoginMessage(error.message || "Credenciais inválidas. Verifique o e-mail e senha.");
        setLoginStatus("error");
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        setLoginMessage("Login realizado com sucesso!");
        setLoginStatus("success");
        
        // Aguardar um pouco para garantir que a sessão foi estabelecida
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar se há profile e criar se necessário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile não existe, criar um básico
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.email?.split('@')[0] || 'Usuário',
            is_admin: false,
          });
        }

        // Redirecionar após login bem-sucedido
        navigate("/admin");
      }
    } catch (error: any) {
      setLoginMessage(error.message || "Erro ao fazer login. Tente novamente.");
      setLoginStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // validações básicas
      const email = signupEmail.trim().toLowerCase();
      if (signupPassword !== signupConfirm) {
        setIsLoading(false);
        toast.error("As senhas não coincidem");
        return;
      }

      const phoneNumbers = signupWhatsapp.replace(/\D/g, "");
      const cpfNumbers = signupCpf.replace(/\D/g, "");

      if (cpfNumbers.length !== 11) {
        setIsLoading(false);
        toast.error("CPF deve conter exatamente 11 dígitos");
        return;
      }

      if (phoneNumbers.length !== 11) {
        setIsLoading(false);
        toast.error("WhatsApp deve conter exatamente 11 dígitos (DDD + 9 dígitos)");
        return;
      }

      // Criar usuário no Supabase
      const { data: signUpData, error: signUpError } = await signUp(email, signupPassword);

      if (signUpError) {
        setIsLoading(false);
        toast.error(signUpError.message || "Erro ao criar conta. Tente novamente.");
        return;
      }

      if (!signUpData?.user) {
        setIsLoading(false);
        toast.error("Erro ao criar conta. Tente novamente.");
        return;
      }

      // Criar profile no Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signUpData.user.id,
          email: email,
          full_name: signupResponsavel.trim(),
          phone: phoneNumbers,
          is_admin: true, // Primeiro usuário é admin
          metadata: {
            cpf: cpfNumbers,
            company: signupCompany,
            cnpj: signupCnpj,
            address: signupEndereco,
          },
        });

      if (profileError) {
        console.error('Erro ao criar profile:', profileError);
        // Não falhar o signup se profile falhar, mas logar o erro
      }

      // Manter compatibilidade com sistema local (opcional)
      const id =
        (typeof crypto !== "undefined" && "randomUUID" in crypto && crypto.randomUUID()) ||
        `c_${Math.random().toString(36).slice(2, 10)}`;

      const newCollaborator: Collaborator = {
        id,
        name: signupResponsavel.trim(),
        phone: phoneNumbers,
        email,
        cpf: cpfNumbers,
        password: hashPassword(signupPassword),
        role: "socio",
        specialty: "",
        createdAt: new Date().toISOString(),
      };

      persistCollaborators([newCollaborator]);
      setCollaborators([newCollaborator]);

      // Limpar e salvar arrays vazios para garantir dashboard limpo
      // Barbearias: array vazio
      persistBarbershops([]);

      // Serviços: array vazio
      persistServices([]);

      // Estoque/Inventário: estrutura vazia
      persistInventory(
        {
          storeProducts: [],
          consumables: [],
          storefront: {
            title: "Nossa Loja",
            subtitle: "Produtos profissionais selecionados para cuidar do seu estilo",
            highlight: "Para compras acima de R$ 100,00 dentro da região metropolitana",
          },
        },
        null
      );

      // Limpar todas as chaves de inventário de barbearias específicas
      if (typeof window !== "undefined") {
        const inventoryKeys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith("barberbook_admin_inventory") && key !== "barberbook_admin_inventory_default") {
            inventoryKeys.push(key);
          }
        }
        inventoryKeys.forEach((key) => window.localStorage.removeItem(key));
      }

      // VIPs: estrutura vazia (apenas config padrão, sem membros)
      persistVipData({
        config: {
          priceMonthly: 199.9,
          priceAnnual: 500.0,
          billingCycle: "monthly",
          benefits: [],
        },
        members: [],
      });

      // Limpar seleção de barbearia padrão
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("barberbook_default_barbershop");
        window.localStorage.removeItem("selectedBarbershop");
      }

      // Limpar todos os agendamentos (bookingConfirmation_*)
      if (typeof window !== "undefined") {
        const bookingKeys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith("bookingConfirmation")) {
            bookingKeys.push(key);
          }
        }
        bookingKeys.forEach((key) => window.localStorage.removeItem(key));
        
        // Limpar também agendamentos temporários
        window.localStorage.removeItem("bookingAppointments");
      }

      // Limpar registros de ponto (time_clock_*)
      if (typeof window !== "undefined") {
        const timeClockKeys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith("time_clock_")) {
            timeClockKeys.push(key);
          }
        }
        timeClockKeys.forEach((key) => window.localStorage.removeItem(key));
      }

      // Limpar vendas da loja (shop_sale_* e completed_order_*)
      if (typeof window !== "undefined") {
        const saleKeys: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && (key.startsWith("shop_sale_") || key.startsWith("completed_order_"))) {
            saleKeys.push(key);
          }
        }
        saleKeys.forEach((key) => window.localStorage.removeItem(key));
      }

      // Limpar despesas
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("barberbook_admin_expenses");
      }

      // Limpar carrinho
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("fadebook-cart");
      }

      // limpa campos e informa sucesso
      setLoginEmail(email);
      setLoginPassword(signupPassword);
      setSignupCompany("");
      setSignupCnpj("");
      setSignupResponsavel("");
      setSignupCpf("");
      setSignupWhatsapp("");
      setSignupEmail("");
      setSignupEndereco("");
      setSignupPassword("");
      setSignupConfirm("");

      setIsLoading(false);
      toast.success("Cadastro Realizado com Sucesso!", { duration: 2000 });
      
      // Preencher campos de login e mudar para aba de login
      setLoginEmail(email);
      setLoginPassword(signupPassword);
      setTab("login");
      
      // Aguardar um pouco e fazer login automaticamente
      setTimeout(async () => {
        const { data: loginData, error: loginError } = await signIn(email, signupPassword);
        if (!loginError && loginData?.user) {
          navigate("/admin");
        }
      }, 1000);
    } catch (error: any) {
      setIsLoading(false);
      toast.error(error.message || "Erro ao criar conta. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="shadow-gold border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-display">Acesse sua Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          required
                          className="pr-10"
                          value={loginPassword}
                          onChange={(event) => setLoginPassword(event.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                          aria-label={showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="keep-connected" className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Switch id="keep-connected" />
                        <span>Conectado</span>
                      </label>
                      <Button type="button" variant="link" className="p-0 text-sm text-primary">
                        Esqueci minha senha
                      </Button>
                    </div>
                    <Button
                      type="submit"
                      variant="hero"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                    {loginMessage && (
                      <p
                        className={`text-sm text-center ${
                          loginStatus === "success" ? "text-emerald-500" : "text-destructive"
                        }`}
                      >
                        {loginMessage}
                      </p>
                    )}
                    <div className="text-center text-sm text-muted-foreground">ou</div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-card"
                    >
                      <span className="flex items-center justify-center space-x-2">
                        <GoogleIcon />
                        <span>Google</span>
                      </span>
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-company">Nome da Barbearia</Label>
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="Nome fantasia"
                        required
                        value={signupCompany}
                        onChange={(e) => setSignupCompany(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-cnpj">CNPJ</Label>
                        <Input
                          id="signup-cnpj"
                          type="text"
                          placeholder="00.000.000/0000-00"
                          value={signupCnpj}
                          onChange={(e) => setSignupCnpj(formatCNPJ(e.target.value))}
                          maxLength={18}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-responsavel">Responsável</Label>
                        <Input
                          id="signup-responsavel"
                          type="text"
                          placeholder="Nome completo do responsável"
                          required
                          value={signupResponsavel}
                          onChange={(e) => setSignupResponsavel(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-cpf">CPF</Label>
                        <Input
                          id="signup-cpf"
                          type="text"
                          placeholder="000.000.000-00"
                          required
                          value={signupCpf}
                          onChange={(e) => setSignupCpf(formatCPF(e.target.value))}
                          maxLength={14}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-whatsapp">WhatsApp</Label>
                        <Input
                          id="signup-whatsapp"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          required
                          value={signupWhatsapp}
                          onChange={(e) => setSignupWhatsapp(formatPhone(e.target.value))}
                          maxLength={15}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">E-mail</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-endereco">Endereço</Label>
                      <Textarea
                        id="signup-endereco"
                        placeholder="Rua, número, bairro, cidade e estado"
                        required
                        className="min-h-[80px]"
                      value={signupEndereco}
                      onChange={(e) => setSignupEndereco(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            className="pr-10"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)} />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                        <div className="relative">
                          <Input
                            id="signup-confirm"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            className="pr-10"
                            value={signupConfirm}
                            onChange={(e) => setSignupConfirm(e.target.value)} />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                            aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      variant="hero"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Cadastrando..." : "Criar Conta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Auth;
