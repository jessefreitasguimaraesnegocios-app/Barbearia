import { Link } from "react-router-dom";
import { Scissors, Instagram, Facebook, Twitter, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary rounded-lg">
                <Scissors className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-display font-bold">BarberBook Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plataforma completa de gestão para barbearias modernas.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Serviços</Link></li>
              <li><Link to="/booking" className="hover:text-primary transition-colors">Agendar</Link></li>
              <li><Link to="/shop" className="hover:text-primary transition-colors">Loja</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contato</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>(31) 98512-5108</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>jesse@barberbookpro.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Contagem, MG</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">Redes Sociais</h3>
            <div className="flex space-x-3">
              <a href="#" className="p-2 bg-secondary rounded-lg hover:bg-primary hover:shadow-gold transition-all">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-secondary rounded-lg hover:bg-primary hover:shadow-gold transition-all">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-secondary rounded-lg hover:bg-primary hover:shadow-gold transition-all">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BarberBook Pro. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};
