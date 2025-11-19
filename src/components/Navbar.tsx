import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
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
} from "./ui/alert-dialog";
import { Scissors, Menu, X, Calendar, ShoppingBag, LayoutDashboard, LogIn } from "lucide-react";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeCollaborator, setActiveCollaborator] = useState<null | { id: string; name: string; role: string }>(() => {
    try {
      const stored = localStorage.getItem("activeCollaborator");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "activeCollaborator") {
        try {
          setActiveCollaborator(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setActiveCollaborator(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("activeCollaborator");
    setActiveCollaborator(null);
    navigate("/");
  };

  const navLinks = [
    { name: "Início", path: "/", icon: null },
    { name: "Barbearias", path: "/barbearias", icon: null },
    { name: "Serviços", path: "/services", icon: null },
    { name: "Agendar", path: "/booking", icon: Calendar },
    { name: "Loja", path: "/shop", icon: ShoppingBag },
  ];

  return (
    <>
      {/* Blur Overlay - aparece quando o menu mobile está aberto */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav className="fixed top-0 w-full z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-primary rounded-lg group-hover:shadow-gold transition-all duration-300">
                <Scissors className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-display font-bold">BarberBook Pro</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1 transition-colors ${
                    isActive(link.path)
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.icon && <link.icon className="h-4 w-4" />}
                  <span>{link.name}</span>
                </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              {activeCollaborator?.role === "socio" ? (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              ) : activeCollaborator ? (
                <Link to="/menu">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Menu
                  </Button>
                </Link>
              ) : null}
              {!activeCollaborator && (
                <Link to="/auth">
                  <Button variant="hero" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors z-50 relative"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden py-4 space-y-3 border-t border-border relative z-50 bg-card">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-secondary"
                  }`}
                >
                  {link.icon && <link.icon className="h-4 w-4" />}
                  <span>{link.name}</span>
                </Link>
              ))}
              <div className="px-4 pt-3 space-y-2 border-t border-border">
                <ThemeToggle />
                {activeCollaborator?.role === "socio" && (
                  <Link to="/admin" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                {activeCollaborator && activeCollaborator.role !== "socio" && (
                  <Link to="/menu" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Menu
                    </Button>
                  </Link>
                )}
                {!activeCollaborator && (
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <Button variant="hero" className="w-full">
                      <LogIn className="h-4 w-4 mr-2" />
                      Entrar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};
