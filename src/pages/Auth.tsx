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
import { loadCollaborators } from "@/lib/collaborators-storage";
import { verifyPassword } from "@/lib/password";

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
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [loginStatus, setLoginStatus] = useState<"success" | "error" | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => loadCollaborators());

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginMessage(null);
    setLoginStatus(null);

    const normalizedEmail = loginEmail.trim().toLowerCase();

    const collaborator = collaboratorsByEmail[normalizedEmail];

    if (!collaborator) {
      setTimeout(() => {
        setIsLoading(false);
        setLoginMessage("Credenciais inválidas. Verifique o e-mail informado.");
        setLoginStatus("error");
      }, 500);
      return;
    }

    const isValidPassword = verifyPassword(loginPassword, collaborator.password);

    setTimeout(() => {
      setIsLoading(false);

      if (!isValidPassword) {
        setLoginMessage("Senha incorreta. Tente novamente.");
        setLoginStatus("error");
        return;
      }

      setLoginMessage(`Bem-vindo, ${collaborator.name}!`);
      setLoginStatus("success");

      localStorage.setItem(
        "activeCollaborator",
        JSON.stringify({
          id: collaborator.id,
          name: collaborator.name,
          email: collaborator.email,
          role: collaborator.role,
          loggedAt: new Date().toISOString(),
        }),
      );
    }, 500);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
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
              <Tabs defaultValue="login" className="w-full">
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
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-cnpj">CNPJ</Label>
                        <Input
                          id="signup-cnpj"
                          type="text"
                          placeholder="00.000.000/0000-00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-responsavel">Responsável</Label>
                        <Input
                          id="signup-responsavel"
                          type="text"
                          placeholder="Nome completo do responsável"
                          required
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-whatsapp">WhatsApp</Label>
                        <Input
                          id="signup-whatsapp"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          required
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-endereco">Endereço</Label>
                      <Textarea
                        id="signup-endereco"
                        placeholder="Rua, número, bairro, cidade e estado"
                        required
                        className="min-h-[80px]"
                      />
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
                          />
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
                          />
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
